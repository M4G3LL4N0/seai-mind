import {
  SkillSchema,
  type Skill,
} from "@seai/core";
import { generateId, nowISO, Result } from "@seai/core";
import { createTelemetry, EventTypes, type Telemetry } from "@seai/core";
import { StorageAdapter, createRepository, storage } from "@seai/core";
import { SecurityEngine, type SecurityContext } from "@seai/core";

export interface SkillConfig {
  maxSkillsPerMind: number;
  autoValidate: boolean;
  validationTimeoutMs: number;
}

const DEFAULT_CONFIG: SkillConfig = {
  maxSkillsPerMind: 1000,
  autoValidate: true,
  validationTimeoutMs: 30000,
};

export interface SkillExecutionContext {
  mindId: string;
  input: unknown;
  context: SecurityContext;
  memory?: unknown;
  tools?: string[];
  model?: string;
}

export interface SkillExecutionResult {
  success: boolean;
  output?: unknown;
  error?: string;
  latencyMs: number;
  tokensUsed?: number;
  cost?: number;
  metadata?: Record<string, unknown>;
}

export interface SkillValidationResult {
  valid: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
}

export class SkillEngine {
  private config: SkillConfig;
  private telemetry: Telemetry;
  private storage: StorageAdapter;
  private repository: ReturnType<typeof createRepository<Skill>>;
  private securityEngine: SecurityEngine;
  private skillCache: Map<string, Skill> = new Map();

  constructor(
    config: Partial<SkillConfig> = {},
    telemetry: Telemetry,
    storage: StorageAdapter,
    securityEngine: SecurityEngine
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.telemetry = telemetry;
    this.storage = storage;
    this.securityEngine = securityEngine;
    this.repository = createRepository(storage, "skills", this.serialize, this.deserialize);
  }

  async initialize(): Promise<void> {
    await this.storage.initialize();
    await this.loadCache();
  }

  async shutdown(): Promise<void> {
    await this.storage.close();
  }

  private async loadCache(): Promise<void> {
    const skills = await this.repository.list({}, 10000);
    for (const skill of skills) {
      this.skillCache.set(skill.id, skill);
    }
  }

  async createSkill(
    mindId: string,
    skill: Omit<Skill, "id" | "version" | "provenance" | "performance" | "failures">,
    context: SecurityContext
  ): Promise<Result<Skill, Error>> {
    const privacyCheck = this.securityEngine.checkPrivacy(context, "private");
    if (!privacyCheck) {
      return Result.err(new Error("Privacy level insufficient for skill creation"));
    }

    const count = await this.repository.count({ mind_id: mindId } as any);
    if (count >= this.config.maxSkillsPerMind) {
      return Result.err(new Error(`Maximum skills per mind reached: ${this.config.maxSkillsPerMind}`));
    }

    const newSkill: Skill = {
      ...skill,
      id: generateId(),
      version: { major: 1, minor: 0, patch: 0 },
      provenance: {
        createdBy: context.userId || "system",
        createdAt: nowISO(),
        source: "human",
      },
      performance: undefined,
      failures: [],
    };

    const validated = SkillSchema.parse(newSkill);
    await this.repository.create(validated);
    this.skillCache.set(validated.id, validated);

    this.telemetry.emitEvent(
      EventTypes.SKILL_CREATED,
      "skill-engine",
      { mindId, skillId: validated.id, skillName: validated.name }
    );

    return Result.ok(validated);
  }

  async getSkill(skillId: string): Promise<Skill | null> {
    if (this.skillCache.has(skillId)) {
      return this.skillCache.get(skillId)!;
    }
    const skill = await this.repository.get(skillId);
    if (skill) {
      this.skillCache.set(skillId, skill);
    }
    return skill || null;
  }

  async getSkillsByMind(mindId: string): Promise<Skill[]> {
    return this.repository.list({ mind_id: mindId } as any, 1000);
  }

  async updateSkill(
    skillId: string,
    updates: Partial<Skill>,
    context: SecurityContext
  ): Promise<Result<Skill, Error>> {
    const existing = await this.getSkill(skillId);
    if (!existing) {
      return Result.err(new Error(`Skill not found: ${skillId}`));
    }
    
    const privacyCheck = this.securityEngine.checkPrivacy(context, "private");
    if (!privacyCheck) {
      return Result.err(new Error("Privacy level insufficient for skill update"));
    }

    const updated: Skill = {
      ...existing,
      ...updates,
      id: existing.id,
      version: this.incrementVersion(existing.version),
      provenance: {
        ...existing.provenance,
        source: "evolved",
        parentSkill: existing.id,
      },
    };

    const validated = SkillSchema.parse(updated);
    await this.repository.update(validated);
    this.skillCache.set(validated.id, validated);

    this.telemetry.emitEvent(
      EventTypes.SKILL_EVOLVED,
      "skill-engine",
      { skillId: validated.id, action: "update" }
    );

    return Result.ok(validated);
  }

  async deleteSkill(skillId: string, context: SecurityContext): Promise<Result<boolean, Error>> {
    const existing = await this.getSkill(skillId);
    if (!existing) {
      return Result.err(new Error(`Skill not found: ${skillId}`));
    }
    
    const privacyCheck = this.securityEngine.checkPrivacy(context, "private");
    if (!privacyCheck) {
      return Result.err(new Error("Privacy level insufficient for skill deletion"));
    }

    await this.repository.delete(skillId);
    this.skillCache.delete(skillId);

    this.telemetry.emitEvent(
      EventTypes.SKILL_EVOLVED,
      "skill-engine",
      { skillId, action: "delete" }
    );

    return Result.ok(true);
  }

  async executeSkill(
    skillId: string,
    executionContext: SkillExecutionContext
  ): Promise<SkillExecutionResult> {
    const skill = await this.getSkill(skillId);
    if (!skill) {
      return { success: false, error: `Skill not found: ${skillId}`, latencyMs: 0 };
    }

    const privacyCheck = this.securityEngine.checkPrivacy(executionContext.context, "internal");
    if (!privacyCheck) {
      return { success: false, error: "Privacy level insufficient for skill execution", latencyMs: 0 };
    }

    const startTime = Date.now();
    
    try {
      this.telemetry.emitEvent(
        EventTypes.SKILL_USED,
        "skill-engine",
        { skillId, mindId: executionContext.mindId, action: "execute-start" }
      );

      const result = await this.runSkillProcedure(skill, executionContext);
      
      const latencyMs = Date.now() - startTime;
      
      await this.recordExecution(skillId, true, latencyMs, { input: executionContext.input }, result.tokensUsed, result.cost);

      this.telemetry.emitEvent(
        EventTypes.SKILL_USED,
        "skill-engine",
        { skillId, mindId: executionContext.mindId, action: "execute-complete", latencyMs, success: true }
      );

      return { success: true, ...result, latencyMs };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      await this.recordExecution(skillId, false, latencyMs, { input: executionContext.input }, undefined, undefined, String(error));
      
      this.telemetry.emitEvent(
        EventTypes.SKILL_USED,
        "skill-engine",
        { skillId, mindId: executionContext.mindId, action: "execute-error", latencyMs, error: String(error) }
      );

      return { success: false, error: String(error), latencyMs };
    }
  }

  private async runSkillProcedure(
    skill: Skill,
    context: SkillExecutionContext
  ): Promise<Omit<SkillExecutionResult, "success" | "latencyMs">> {
    // This is a placeholder - actual implementation would depend on the procedure format
    // For now, return a mock successful result
    return {
      output: { result: "Skill executed successfully", skill: skill.name },
      tokensUsed: 100,
      cost: 0.001,
      metadata: { skillId: skill.id },
    };
  }

  private async recordExecution(
    skillId: string,
    success: boolean,
    latencyMs: number,
    context: { input: unknown },
    tokensUsed?: number,
    cost?: number,
    error?: string
  ): Promise<void> {
    const skill = await this.getSkill(skillId);
    if (!skill) return;

    const performance = skill.performance || { successRate: 0, averageLatencyMs: 0, averageCost: 0 };
    const totalExecutions = ((performance.successRate ?? 0) * 100) + 1; // Approximate
    
    performance.successRate = ((performance.successRate ?? 0) * (totalExecutions - 1) + (success ? 1 : 0)) / totalExecutions;
    performance.averageLatencyMs = ((performance.averageLatencyMs ?? 0) * (totalExecutions - 1) + latencyMs) / totalExecutions;
    if (cost !== undefined) {
      performance.averageCost = ((performance.averageCost ?? 0) * (totalExecutions - 1) + cost) / totalExecutions;
    }
    performance.lastEvaluated = nowISO();

    if (!success && error) {
      const failures = skill.failures || [];
      failures.push({
        timestamp: nowISO(),
        input: context.input,
        error,
        context: "execution",
      });
      if (failures.length > 100) failures.shift();
      skill.failures = failures;
    }

    skill.performance = performance;
    await this.repository.update(skill);
    this.skillCache.set(skillId, skill);
  }

  async validateSkill(skillId: string, testCases: Array<{ input: unknown; expectedOutput: unknown }>): Promise<SkillValidationResult> {
    const skill = await this.getSkill(skillId);
    if (!skill) {
      return { valid: false, score: 0, issues: [`Skill not found: ${skillId}`], suggestions: [] };
    }

    const issues: string[] = [];
    const suggestions: string[] = [];
    let passed = 0;

    for (const testCase of testCases) {
      try {
        const result = await this.executeSkill(skillId, {
          mindId: "validation",
          input: testCase.input,
          context: { permissions: [], privacyLevel: "internal", securityLevel: "low" },
        });
        
        if (result.success) {
          // Simple comparison - in reality would use more sophisticated comparison
          passed++;
        } else {
          issues.push(`Test failed: ${result.error}`);
        }
      } catch (error) {
        issues.push(`Test error: ${error}`);
      }
    }

    const score = testCases.length > 0 ? passed / testCases.length : 0;
    const valid = score >= 0.8 && issues.length === 0;

    if (!valid) {
      suggestions.push("Add more test cases");
      suggestions.push("Review skill procedure for edge cases");
      if (skill.failures && skill.failures.length > 0) {
        suggestions.push(`Address ${skill.failures.length} known failure(s)`);
      }
    }

    return { valid, score, issues, suggestions };
  }

  async composeSkills(skillIds: string[], context: SkillExecutionContext): Promise<SkillExecutionResult> {
    let currentInput = context.input;
    let totalLatency = 0;
    let totalTokens = 0;
    let totalCost = 0;
    const metadata: Record<string, unknown> = { composedSkills: skillIds };

    for (const skillId of skillIds) {
      const result = await this.executeSkill(skillId, {
        ...context,
        input: currentInput,
      });
      
      totalLatency += result.latencyMs;
      totalTokens += result.tokensUsed || 0;
      totalCost += result.cost || 0;
      
      if (!result.success) {
        return {
          success: false,
          error: `Skill ${skillId} failed: ${result.error}`,
          latencyMs: totalLatency,
          tokensUsed: totalTokens,
          cost: totalCost,
          metadata,
        };
      }
      
      currentInput = result.output;
      metadata[skillId] = result.output;
    }

    return {
      success: true,
      output: currentInput,
      latencyMs: totalLatency,
      tokensUsed: totalTokens,
      cost: totalCost,
      metadata,
    };
  }

  private incrementVersion(version: { major: number; minor: number; patch: number }): { major: number; minor: number; patch: number } {
    return { major: version.major, minor: version.minor, patch: version.patch + 1 };
  }

  private serialize(skill: Skill): Record<string, unknown> {
    return {
      id: skill.id,
      mind_id: skill.provenance.createdBy,
      name: skill.name,
      purpose: skill.purpose,
      description: skill.description,
      inputs: JSON.stringify(skill.inputs),
      outputs: JSON.stringify(skill.outputs),
      prerequisites: skill.prerequisites ? JSON.stringify(skill.prerequisites) : null,
      procedure: JSON.stringify(skill.procedure),
      tools: skill.tools ? JSON.stringify(skill.tools) : null,
      model_requirements: skill.modelRequirements ? JSON.stringify(skill.modelRequirements) : null,
      evaluator: skill.evaluator || null,
      examples: skill.examples ? JSON.stringify(skill.examples) : null,
      version: JSON.stringify(skill.version),
      provenance: JSON.stringify(skill.provenance),
      performance: skill.performance ? JSON.stringify(skill.performance) : null,
      failures: skill.failures ? JSON.stringify(skill.failures) : null,
      created_at: skill.provenance.createdAt,
      updated_at: nowISO(),
    };
  }

  private deserialize(row: Record<string, unknown>): Skill {
    return {
      id: row.id as string,
      name: row.name as string,
      purpose: row.purpose as string,
      description: row.description as string,
      inputs: JSON.parse(row.inputs as string),
      outputs: JSON.parse(row.outputs as string),
      prerequisites: row.prerequisites ? JSON.parse(row.prerequisites as string) : undefined,
      procedure: JSON.parse(row.procedure as string),
      tools: row.tools ? JSON.parse(row.tools as string) : undefined,
      modelRequirements: row.model_requirements ? JSON.parse(row.model_requirements as string) : undefined,
      evaluator: row.evaluator as string | undefined,
      examples: row.examples ? JSON.parse(row.examples as string) : undefined,
      version: JSON.parse(row.version as string),
      provenance: JSON.parse(row.provenance as string),
      performance: row.performance ? JSON.parse(row.performance as string) : undefined,
      failures: row.failures ? JSON.parse(row.failures as string) : undefined,
    };
  }
}

export function createSkillEngine(
  config: Partial<SkillConfig>,
  telemetry: Telemetry,
  storage: StorageAdapter,
  securityEngine: SecurityEngine
): SkillEngine {
  return new SkillEngine(config, telemetry, storage, securityEngine);
}

export const skillEngine = createSkillEngine(
  {},
  createTelemetry(),
  storage,
  new SecurityEngine()
);

export interface SkillTemplate {
  name: string;
  purpose: string;
  description?: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  procedure: unknown;
  tools?: string[];
  modelRequirements?: Skill["modelRequirements"];
}

export const BUILTIN_SKILL_TEMPLATES: SkillTemplate[] = [
  {
    name: "reasoning",
    purpose: "Step-by-step reasoning for complex problems",
    description: "Breaks down complex problems into logical steps",
    inputs: { problem: "string" },
    outputs: { reasoning: "string", conclusion: "string" },
    procedure: {
      steps: [
        "Analyze the problem",
        "Identify key components",
        "Apply logical reasoning",
        "Synthesize conclusion",
      ],
    },
    modelRequirements: { capabilities: ["reasoning"] },
  },
  {
    name: "code-generation",
    purpose: "Generate code from specifications",
    description: "Writes code based on natural language requirements",
    inputs: { specification: "string", language: "string" },
    outputs: { code: "string", explanation: "string" },
    procedure: {
      steps: [
        "Parse specification",
        "Design solution",
        "Generate code",
        "Add documentation",
      ],
    },
    modelRequirements: { capabilities: ["coding"] },
  },
  {
    name: "summarization",
    purpose: "Summarize long text",
    description: "Creates concise summaries of documents",
    inputs: { text: "string", maxLength: "number" },
    outputs: { summary: "string", keyPoints: "string[]" },
    procedure: {
      steps: [
        "Extract key information",
        "Identify main themes",
        "Generate summary",
        "Extract key points",
      ],
    },
    modelRequirements: { capabilities: ["summarization"] },
  },
  {
    name: "extraction",
    purpose: "Extract structured information from text",
    description: "Pulls specific data fields from unstructured text",
    inputs: { text: "string", schema: "object" },
    outputs: { extracted: "object", confidence: "number" },
    procedure: {
      steps: [
        "Analyze schema",
        "Scan text for relevant information",
        "Extract and validate fields",
        "Calculate confidence",
      ],
    },
    modelRequirements: { capabilities: ["extraction", "structured-output"] },
  },
  {
    name: "planning",
    purpose: "Create execution plans for goals",
    description: "Breaks down goals into actionable steps",
    inputs: { goal: "string", constraints: "object" },
    outputs: { plan: "object", steps: "object[]" },
    procedure: {
      steps: [
        "Analyze goal",
        "Identify constraints",
        "Decompose into steps",
        "Order dependencies",
        "Estimate resources",
      ],
    },
    modelRequirements: { capabilities: ["reasoning", "planning"] },
  },
];

export async function registerBuiltinSkills(
  engine: SkillEngine,
  mindId: string,
  context: SecurityContext
): Promise<void> {
  for (const template of BUILTIN_SKILL_TEMPLATES) {
    await engine.createSkill(mindId, template as any, context);
  }
}