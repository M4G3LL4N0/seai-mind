import {
  TaskSchema,
  MemoryTypeSchema,
  type Task,
  type ModelCapability,
} from "@seai/core";
import { generateId, nowISO, Result } from "@seai/core";
import { createTelemetry, EventTypes, type Telemetry } from "@seai/core";
import { MemoryEngine, type MemoryQuery, type MemoryEntry } from "@seai/state";
import { SkillEngine, type SkillExecutionContext } from "@seai/state";
import { ToolEngine, type ToolExecutionContext } from "@seai/state";
import { RoutingEngine, type RoutingContext, type RoutingResult } from "@seai/runtime";
import { ModelSchema, type Model } from "@seai/core";
import { RuntimeManager, type ModelHandle, type GenerationRequest, type GenerationResponse } from "@seai/runtime";
import { SecurityEngine, type SecurityContext } from "@seai/core";
import { PolicyEngine, type PolicyContext } from "@seai/core";

export interface CognitionConfig {
  maxConcurrentTasks: number;
  defaultTimeoutMs: number;
  enableCache: boolean;
  cacheTtlMs: number;
}

const DEFAULT_CONFIG: CognitionConfig = {
  maxConcurrentTasks: 10,
  defaultTimeoutMs: 60000,
  enableCache: true,
  cacheTtlMs: 300000,
};

export interface TaskContext {
  mindId: string;
  securityContext: SecurityContext;
  policyContext: PolicyContext;
  hardwareProfile: any;
  availableModels: Model[];
  availableProviders: any[];
  qualityTarget?: number;
  latencyBudgetMs?: number;
  costBudget?: number;
  priority?: number;
  privacy?: string;
}

export interface CognitiveStep {
  type: "classify" | "check-cache" | "check-memory" | "check-knowledge" | "check-skill" | "check-tool" | "select-model" | "execute" | "verify" | "escalate";
  description: string;
  input?: unknown;
  output?: unknown;
  latencyMs: number;
  success: boolean;
  error?: string;
}

export interface CognitiveTrace {
  taskId: string;
  steps: CognitiveStep[];
  totalLatencyMs: number;
  finalOutput?: unknown;
  error?: string;
}

export class CognitionEngine {
  private config: CognitionConfig;
  private telemetry: Telemetry;
  private memoryEngine: MemoryEngine;
  private skillEngine: SkillEngine;
  private toolEngine: ToolEngine;
  private routingEngine: RoutingEngine;
  private runtimeManager: RuntimeManager;
  private securityEngine: SecurityEngine;
  private policyEngine: PolicyEngine;
  private taskCache: Map<string, { output: unknown; timestamp: number }> = new Map();
  private activeTasks: Map<string, Task> = new Map();

  constructor(
    config: Partial<CognitionConfig>,
    telemetry: Telemetry,
    memoryEngine: MemoryEngine,
    skillEngine: SkillEngine,
    toolEngine: ToolEngine,
    routingEngine: RoutingEngine,
    runtimeManager: RuntimeManager,
    securityEngine: SecurityEngine,
    policyEngine: PolicyEngine
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.telemetry = telemetry;
    this.memoryEngine = memoryEngine;
    this.skillEngine = skillEngine;
    this.toolEngine = toolEngine;
    this.routingEngine = routingEngine;
    this.runtimeManager = runtimeManager;
    this.securityEngine = securityEngine;
    this.policyEngine = policyEngine;
  }

  async processTask(
    taskInput: Omit<Task, "id" | "createdAt" | "status" | "startedAt" | "completedAt" | "result" | "error" | "modelUsed" | "toolsUsed" | "skillsUsed" | "tokensUsed" | "latencyMs">,
    context: TaskContext
  ): Promise<Result<Task, Error>> {
    if (this.activeTasks.size >= this.config.maxConcurrentTasks) {
      return Result.err(new Error("Maximum concurrent tasks reached"));
    }

    const task: Task = {
      ...taskInput,
      id: generateId(),
      status: "pending",
      createdAt: nowISO(),
    };

    this.activeTasks.set(task.id, task);
    const trace: CognitiveTrace = { taskId: task.id, steps: [], totalLatencyMs: 0 };
    const startTime = Date.now();

    try {
      task.status = "running";
      task.startedAt = nowISO();
      this.telemetry.emitEvent(EventTypes.TASK_STARTED, "cognition-engine", { taskId: task.id });

      // Step 1: Classify
      const classifyStep = await this.executeStep(trace, "classify", "Classify task", async () => {
        return this.classifyTask(task);
      });

      // Step 2: Check Cache
      const cacheStep = await this.executeStep(trace, "check-cache", "Check cache", async () => {
        if (this.config.enableCache) {
          const cached = this.taskCache.get(this.getCacheKey(task));
          if (cached && Date.now() - cached.timestamp < this.config.cacheTtlMs) {
            return cached.output;
          }
        }
        return null;
      });

      if (cacheStep.output) {
        task.result = cacheStep.output;
        task.status = "completed";
        task.completedAt = nowISO();
        task.latencyMs = Date.now() - startTime;
        this.activeTasks.delete(task.id);
        return Result.ok(task);
      }

      // Step 3: Check Memory
      const memoryStep = await this.executeStep(trace, "check-memory", "Check memory", async () => {
        return this.checkMemory(task, context);
      });

      // Step 4: Check Knowledge (placeholder)
      const knowledgeStep = await this.executeStep(trace, "check-knowledge", "Check knowledge", async () => {
        return null; // Would check knowledge base
      });

      // Step 5: Check Skill
      const skillStep = await this.executeStep(trace, "check-skill", "Check skill", async () => {
        return this.checkSkill(task, context);
      });

      // Step 6: Check Tool
      const toolStep = await this.executeStep(trace, "check-tool", "Check tool", async () => {
        return this.checkTool(task, context);
      });

      // Step 7: Select Model
      const modelStep = await this.executeStep(trace, "select-model", "Select model", async () => {
        return this.selectModel(task, context);
      });

      // Step 8: Execute
      const executeStep = await this.executeStep(trace, "execute", "Execute task", async () => {
        return this.executeTask(task, context, modelStep.output as ModelHandle | null);
      });

      // Step 9: Verify
      const verifyStep = await this.executeStep(trace, "verify", "Verify result", async () => {
        return this.verifyResult(task, executeStep.output);
      });

      // Step 10: Escalate if necessary
      const escalateStep = await this.executeStep(trace, "escalate", "Escalate if needed", async () => {
        if (!verifyStep.output) {
          return this.escalateTask(task, context);
        }
        return null;
      });

      task.result = executeStep.output;
      task.status = "completed";
      task.completedAt = nowISO();
      task.latencyMs = Date.now() - startTime;
      trace.totalLatencyMs = task.latencyMs;

      if (this.config.enableCache) {
        this.taskCache.set(this.getCacheKey(task), { output: task.result, timestamp: Date.now() });
      }

      this.telemetry.emitEvent(EventTypes.TASK_COMPLETED, "cognition-engine", { 
        taskId: task.id, 
        latencyMs: task.latencyMs,
        modelUsed: task.modelUsed,
        toolsUsed: task.toolsUsed,
        skillsUsed: task.skillsUsed,
      });

      this.activeTasks.delete(task.id);
      return Result.ok(task);
    } catch (error) {
      task.status = "failed";
      task.error = String(error);
      task.completedAt = nowISO();
      task.latencyMs = Date.now() - startTime;
      trace.totalLatencyMs = task.latencyMs;
      trace.error = String(error);

      this.telemetry.emitEvent(EventTypes.TASK_FAILED, "cognition-engine", { 
        taskId: task.id, 
        error: String(error),
        latencyMs: task.latencyMs,
      });

      this.activeTasks.delete(task.id);
      return Result.err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async executeStep(
    trace: CognitiveTrace,
    type: CognitiveStep["type"],
    description: string,
    fn: () => Promise<unknown>
  ): Promise<CognitiveStep> {
    const stepStart = Date.now();
    try {
      const output = await fn();
      const step: CognitiveStep = {
        type,
        description,
        output,
        latencyMs: Date.now() - stepStart,
        success: true,
      };
      trace.steps.push(step);
      return step;
    } catch (error) {
      const step: CognitiveStep = {
        type,
        description,
        latencyMs: Date.now() - stepStart,
        success: false,
        error: String(error),
      };
      trace.steps.push(step);
      throw error;
    }
  }

  private classifyTask(task: Task): { category: string; complexity: number; capabilities: ModelCapability[] } {
    // Simple classification based on task type
    const typeMap: Record<string, { category: string; complexity: number; capabilities: ModelCapability[] }> = {
      "reasoning": { category: "reasoning", complexity: 0.8, capabilities: ["reasoning"] },
      "coding": { category: "coding", complexity: 0.7, capabilities: ["coding"] },
      "extraction": { category: "extraction", complexity: 0.5, capabilities: ["extraction", "structured-output"] },
      "summarization": { category: "summarization", complexity: 0.4, capabilities: ["summarization"] },
      "planning": { category: "planning", complexity: 0.9, capabilities: ["reasoning", "planning"] },
      "research": { category: "research", complexity: 0.8, capabilities: ["reasoning", "extraction"] },
      "chat": { category: "chat", complexity: 0.3, capabilities: ["chat"] },
    };
    
    return typeMap[task.type] || { category: "general", complexity: 0.5, capabilities: ["chat"] };
  }

  private async checkMemory(task: Task, context: TaskContext): Promise<MemoryEntry[]> {
    const query: MemoryQuery = {
      mindId: context.mindId,
      searchText: JSON.stringify(task.input),
      state: "active",
      limit: 10,
    };
    
    const result = await this.memoryEngine.retrieve(context.mindId, query, context.securityContext);
    return result.ok ? result.value : [];
  }

  private async checkSkill(task: Task, context: TaskContext): Promise<string | null> {
    const skills = await this.skillEngine.getSkillsByMind(context.mindId);
    const classification = this.classifyTask(task);
    
    for (const skill of skills) {
      if (classification.capabilities.some(c => skill.modelRequirements?.capabilities?.includes(c as any))) {
        return skill.id;
      }
    }
    return null;
  }

  private async checkTool(task: Task, context: TaskContext): Promise<string | null> {
    // ToolEngine does not currently support per-mind tool queries
    // This is a stub - in a full implementation, tools would be registered per mind
    return null;
  }

  private async selectModel(task: Task, context: TaskContext): Promise<ModelHandle | null> {
    const routingContext: RoutingContext = {
      task: {
        id: task.id,
        type: task.type,
        capability: this.classifyTask(task).capabilities[0],
        privacy: task.privacy,
        qualityTarget: task.qualityTarget,
        latencyBudgetMs: task.latencyBudgetMs,
        costBudget: task.costBudget,
      },
      hardware: context.hardwareProfile,
      availableModels: context.availableModels,
      availableProviders: context.availableProviders,
      securityContext: context.securityContext,
      policyContext: context.policyContext,
    };

    const routingResult = await this.routingEngine.route(routingContext);
    
    if (routingResult.decision.model) {
      const model = context.availableModels.find(m => m.id === routingResult.decision.model);
      if (model) {
        task.modelUsed = model.id;
        return this.runtimeManager.loadModel(model, routingResult.decision.runtime);
      }
    }
    
    return null;
  }

  private async executeTask(
    task: Task,
    context: TaskContext,
    modelHandle: ModelHandle | null
  ): Promise<unknown> {
    const classification = this.classifyTask(task);
    
    // Try skill first
    const skillId = await this.checkSkill(task, context);
    if (skillId) {
      const skillResult = await this.skillEngine.executeSkill(skillId, {
        mindId: context.mindId,
        input: task.input,
        context: context.securityContext,
      });
      if (skillResult.success) {
        task.skillsUsed = [skillId];
        return skillResult.output;
      }
    }

    // Try tool
    const toolId = await this.checkTool(task, context);
    if (toolId) {
      const toolResult = await this.toolEngine.executeTool(toolId, {
        mindId: context.mindId,
        input: task.input,
        context: context.securityContext,
      });
      if (toolResult.success) {
        task.toolsUsed = [toolId];
        return toolResult.output;
      }
    }

    // Fall back to model
    if (modelHandle) {
      const request: GenerationRequest = {
        prompt: typeof task.input === "string" ? task.input : JSON.stringify(task.input),
        systemPrompt: "You are a helpful AI assistant.",
        maxTokens: 2000,
        temperature: 0.7,
      };
      
      const response = await this.runtimeManager.generate(modelHandle, request);
      task.tokensUsed = response.usage.totalTokens;
      return response.text;
    }

    throw new Error("No execution method available");
  }

  private verifyResult(task: Task, output: unknown): boolean {
    // Simple verification - in reality would be more sophisticated
    return output !== null && output !== undefined && String(output).length > 0;
  }

  private async escalateTask(task: Task, context: TaskContext): Promise<unknown> {
    // Would escalate to a more capable model or human
    this.telemetry.emitEvent(EventTypes.TASK_FAILED, "cognition-engine", { 
      taskId: task.id, 
      reason: "escalation_needed" 
    });
    throw new Error("Task requires escalation");
  }

  private getCacheKey(task: Task): string {
    return `${task.type}:${JSON.stringify(task.input)}`;
  }

  getActiveTasks(): Task[] {
    return Array.from(this.activeTasks.values());
  }

  getTaskCount(): number {
    return this.activeTasks.size;
  }

  clearCache(): void {
    this.taskCache.clear();
  }
}

export function createCognitionEngine(
  config: Partial<CognitionConfig>,
  telemetry: Telemetry,
  memoryEngine: MemoryEngine,
  skillEngine: SkillEngine,
  toolEngine: ToolEngine,
  routingEngine: RoutingEngine,
  runtimeManager: RuntimeManager,
  securityEngine: SecurityEngine,
  policyEngine: PolicyEngine
): CognitionEngine {
  return new CognitionEngine(config, telemetry, memoryEngine, skillEngine, toolEngine, routingEngine, runtimeManager, securityEngine, policyEngine);
}

export interface CognitivePipeline {
  steps: Array<{
    name: string;
    execute: (input: unknown, context: TaskContext) => Promise<unknown>;
  }>;
}

export function createPipeline(steps: CognitivePipeline["steps"]): CognitivePipeline {
  return { steps };
}

export async function runPipeline(
  pipeline: CognitivePipeline,
  input: unknown,
  context: TaskContext
): Promise<unknown> {
  let current = input;
  for (const step of pipeline.steps) {
    current = await step.execute(current, context);
  }
  return current;
}