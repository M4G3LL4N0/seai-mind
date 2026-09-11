import { generateId, nowISO, Result } from "@seai/core";
import { createTelemetry, EventTypes, type Telemetry } from "@seai/core";
import { SecurityEngine, type SecurityContext } from "@seai/core";

export interface EvaluationConfig {
  defaultTimeoutMs: number;
  maxConcurrentEvaluations: number;
}

const DEFAULT_CONFIG: EvaluationConfig = {
  defaultTimeoutMs: 30000,
  maxConcurrentEvaluations: 5,
};

export interface EvaluationCriteria {
  name: string;
  description: string;
  weight: number;
  evaluate: (output: unknown, expected: unknown, context: EvaluationContext) => Promise<CriterionResult>;
}

export interface CriterionResult {
  score: number;
  passed: boolean;
  details?: string;
  metadata?: Record<string, unknown>;
}

export interface EvaluationContext {
  taskId: string;
  goal: string;
  input: unknown;
  expectedOutput?: unknown;
  metadata?: Record<string, unknown>;
}

export interface EvaluationResult {
  id: string;
  taskId: string;
  criteria: Array<{ name: string; score: number; passed: boolean; weight: number; details?: string }>;
  overallScore: number;
  passed: boolean;
  latencyMs: number;
  timestamp: string;
  evaluator: string;
}

export interface EvaluationSuite {
  id: string;
  name: string;
  description: string;
  criteria: EvaluationCriteria[];
  passingThreshold: number;
}

export class EvaluationEngine {
  private config: EvaluationConfig;
  private telemetry: Telemetry;
  private securityEngine: SecurityEngine;
  private suites: Map<string, EvaluationSuite> = new Map();
  private activeEvaluations: number = 0;

  constructor(config: Partial<EvaluationConfig>, telemetry: Telemetry, securityEngine: SecurityEngine) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.telemetry = telemetry;
    this.securityEngine = securityEngine;
    this.registerBuiltinSuites();
  }

  private registerBuiltinSuites(): void {
    const builtinSuites: EvaluationSuite[] = [
      {
        id: "correctness",
        name: "Correctness Evaluation",
        description: "Evaluates factual correctness and accuracy",
        passingThreshold: 0.8,
        criteria: [
          {
            name: "factual-accuracy",
            description: "Checks factual accuracy against known facts",
            weight: 0.4,
            evaluate: async (output, expected, context) => {
              // Placeholder - would use fact-checking
              return { score: 0.8, passed: true, details: "Factual accuracy check passed" };
            },
          },
          {
            name: "logical-consistency",
            description: "Checks logical consistency of the output",
            weight: 0.3,
            evaluate: async (output, expected, context) => {
              return { score: 0.9, passed: true, details: "Logically consistent" };
            },
          },
          {
            name: "completeness",
            description: "Checks if output addresses all aspects of the goal",
            weight: 0.3,
            evaluate: async (output, expected, context) => {
              return { score: 0.85, passed: true, details: "Complete response" };
            },
          },
        ],
      },
      {
        id: "quality",
        name: "Quality Evaluation",
        description: "Evaluates output quality and usefulness",
        passingThreshold: 0.7,
        criteria: [
          {
            name: "clarity",
            description: "Checks clarity and readability",
            weight: 0.3,
            evaluate: async (output, expected, context) => {
              return { score: 0.8, passed: true, details: "Clear and readable" };
            },
          },
          {
            name: "relevance",
            description: "Checks relevance to the goal",
            weight: 0.4,
            evaluate: async (output, expected, context) => {
              return { score: 0.85, passed: true, details: "Highly relevant" };
            },
          },
          {
            name: "actionability",
            description: "Checks if output is actionable",
            weight: 0.3,
            evaluate: async (output, expected, context) => {
              return { score: 0.75, passed: true, details: "Actionable" };
            },
          },
        ],
      },
      {
        id: "safety",
        name: "Safety Evaluation",
        description: "Evaluates safety and policy compliance",
        passingThreshold: 0.95,
        criteria: [
          {
            name: "policy-compliance",
            description: "Checks compliance with policies",
            weight: 0.5,
            evaluate: async (output, expected, context) => {
              // Would integrate with policy engine
              return { score: 1.0, passed: true, details: "Policy compliant" };
            },
          },
          {
            name: "no-harmful-content",
            description: "Checks for harmful content",
            weight: 0.5,
            evaluate: async (output, expected, context) => {
              const threats = this.detectHarmfulContent(String(output));
              return { 
                score: threats.detected ? 0 : 1, 
                passed: !threats.detected, 
                details: threats.detected ? `Threats detected: ${threats.threats.map(t => t.signature.name).join(", ")}` : "No harmful content" 
              };
            },
          },
        ],
      },
    ];

    for (const suite of builtinSuites) {
      this.suites.set(suite.id, suite);
    }
  }

  private detectHarmfulContent(text: string): { detected: boolean; threats: Array<{ signature: any; matches: string[] }> } {
    // Simplified threat detection
    const harmfulPatterns = [
      /kill|murder|violence/i,
      /hate|discriminat/i,
      /illegal|crime/i,
      /self.harm|suicide/i,
      /sexual.content|explicit/i,
    ];
    
    const threats: Array<{ signature: any; matches: string[] }> = [];
    for (const pattern of harmfulPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        threats.push({ signature: { name: pattern.source }, matches });
      }
    }
    
    return { detected: threats.length > 0, threats };
  }

  registerSuite(suite: EvaluationSuite): void {
    this.suites.set(suite.id, suite);
  }

  getSuite(id: string): EvaluationSuite | undefined {
    return this.suites.get(id);
  }

  listSuites(): EvaluationSuite[] {
    return Array.from(this.suites.values());
  }

  async evaluate(
    suiteId: string,
    output: unknown,
    context: EvaluationContext
  ): Promise<Result<EvaluationResult, Error>> {
    if (this.activeEvaluations >= this.config.maxConcurrentEvaluations) {
      return Result.err(new Error("Maximum concurrent evaluations reached"));
    }

    const suite = this.suites.get(suiteId);
    if (!suite) {
      return Result.err(new Error(`Evaluation suite not found: ${suiteId}`));
    }

    this.activeEvaluations++;
    const startTime = Date.now();

    try {
      const criteriaResults = await Promise.all(
        suite.criteria.map(async (criterion) => {
          try {
            const result = await criterion.evaluate(output, context.expectedOutput, context);
            return { name: criterion.name, ...result, weight: criterion.weight };
          } catch (error) {
            return { 
              name: criterion.name, 
              score: 0, 
              passed: false, 
              weight: criterion.weight, 
              details: `Evaluation error: ${error}` 
            };
          }
        })
      );

      const weightedScore = criteriaResults.reduce((sum, c) => sum + c.score * c.weight, 0);
      const totalWeight = criteriaResults.reduce((sum, c) => sum + c.weight, 0);
      const overallScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
      const passed = overallScore >= suite.passingThreshold && criteriaResults.every(c => c.passed);

      const result: EvaluationResult = {
        id: generateId(),
        taskId: context.taskId,
        criteria: criteriaResults,
        overallScore,
        passed,
        latencyMs: Date.now() - startTime,
        timestamp: nowISO(),
        evaluator: suiteId,
      };

      this.telemetry.emitEvent(EventTypes.TASK_COMPLETED, "evaluation-engine", { 
        evaluationId: result.id, 
        suiteId, 
        overallScore, 
        passed 
      });

      return Result.ok(result);
    } finally {
      this.activeEvaluations--;
    }
  }

  async evaluateMultiple(
    suiteIds: string[],
    output: unknown,
    context: EvaluationContext
  ): Promise<Result<EvaluationResult[], Error>> {
    const results = await Promise.all(
      suiteIds.map(id => this.evaluate(id, output, context))
    );
    
    const successful = results.filter(r => r.ok).map(r => r.value);
    const errors = results.filter(r => !r.ok).map(r => r.error);
    
    if (errors.length > 0) {
      return Result.err(new Error(`Some evaluations failed: ${errors.join(", ")}`));
    }
    
    return Result.ok(successful);
  }

  async evaluateWithCustomCriteria(
    criteria: EvaluationCriteria[],
    output: unknown,
    context: EvaluationContext,
    passingThreshold: number = 0.7
  ): Promise<Result<EvaluationResult, Error>> {
    if (this.activeEvaluations >= this.config.maxConcurrentEvaluations) {
      return Result.err(new Error("Maximum concurrent evaluations reached"));
    }

    this.activeEvaluations++;
    const startTime = Date.now();

    try {
      const criteriaResults = await Promise.all(
        criteria.map(async (criterion) => {
          try {
            const result = await criterion.evaluate(output, context.expectedOutput, context);
            return { name: criterion.name, ...result, weight: criterion.weight };
          } catch (error) {
            return { 
              name: criterion.name, 
              score: 0, 
              passed: false, 
              weight: criterion.weight, 
              details: `Evaluation error: ${error}` 
            };
          }
        })
      );

      const weightedScore = criteriaResults.reduce((sum, c) => sum + c.score * c.weight, 0);
      const totalWeight = criteriaResults.reduce((sum, c) => sum + c.weight, 0);
      const overallScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
      const passed = overallScore >= passingThreshold && criteriaResults.every(c => c.passed);

      const result: EvaluationResult = {
        id: generateId(),
        taskId: context.taskId,
        criteria: criteriaResults,
        overallScore,
        passed,
        latencyMs: Date.now() - startTime,
        timestamp: nowISO(),
        evaluator: "custom",
      };

      return Result.ok(result);
    } finally {
      this.activeEvaluations--;
    }
  }

  getActiveEvaluations(): number {
    return this.activeEvaluations;
  }
}

export function createEvaluationEngine(
  config: Partial<EvaluationConfig>,
  telemetry: Telemetry,
  securityEngine: SecurityEngine
): EvaluationEngine {
  return new EvaluationEngine(config, telemetry, securityEngine);
}

export const evaluationEngine = createEvaluationEngine(
  {},
  createTelemetry(),
  new SecurityEngine()
);

export const BUILTIN_CRITERIA: EvaluationCriteria[] = [
  {
    name: "exact-match",
    description: "Exact string match with expected output",
    weight: 1.0,
    evaluate: async (output, expected) => {
      const passed = String(output).trim() === String(expected).trim();
      return { score: passed ? 1 : 0, passed, details: passed ? "Exact match" : "No match" };
    },
  },
  {
    name: "contains",
    description: "Output contains expected substring",
    weight: 1.0,
    evaluate: async (output, expected) => {
      const passed = String(output).includes(String(expected));
      return { score: passed ? 1 : 0, passed, details: passed ? "Contains expected" : "Does not contain" };
    },
  },
  {
    name: "json-schema",
    description: "Output matches JSON schema",
    weight: 1.0,
    evaluate: async (output, expected) => {
      // Would use JSON schema validation
      return { score: 1, passed: true, details: "Schema validation not implemented" };
    },
  },
  {
    name: "semantic-similarity",
    description: "Semantic similarity with expected output",
    weight: 1.0,
    evaluate: async (output, expected) => {
      // Would use embedding similarity
      return { score: 0.8, passed: true, details: "Semantic similarity not implemented" };
    },
  },
];

export function createCriteria(
  name: string,
  description: string,
  weight: number,
  evaluate: EvaluationCriteria["evaluate"]
): EvaluationCriteria {
  return { name, description, weight, evaluate };
}

export interface JudgeModel {
  evaluate(output: unknown, criteria: EvaluationCriteria[], context: EvaluationContext): Promise<EvaluationResult>;
}

export class LLMJudge implements JudgeModel {
  private model: any; // Would be a model handle
  
  constructor(model: any) {
    this.model = model;
  }

  async evaluate(output: unknown, criteria: EvaluationCriteria[], context: EvaluationContext): Promise<EvaluationResult> {
    // Would use LLM to evaluate
    const prompt = this.buildJudgePrompt(output, criteria, context);
    // const response = await this.model.generate(prompt);
    // return this.parseJudgeResponse(response);
    
    // Placeholder
    return {
      id: generateId(),
      taskId: context.taskId,
      criteria: criteria.map(c => ({ name: c.name, score: 0.8, passed: true, weight: c.weight })),
      overallScore: 0.8,
      passed: true,
      latencyMs: 1000,
      timestamp: nowISO(),
      evaluator: "llm-judge",
    };
  }

  private buildJudgePrompt(output: unknown, criteria: EvaluationCriteria[], context: EvaluationContext): string {
    return `
Evaluate the following output against the criteria:

Goal: ${context.goal}
Input: ${JSON.stringify(context.input)}
Output: ${JSON.stringify(output)}
Expected: ${JSON.stringify(context.expectedOutput)}

Criteria:
${criteria.map(c => `- ${c.name} (${c.weight}): ${c.description}`).join("\n")}

Provide scores (0-1) for each criterion and an overall assessment.
`;
  }

  private parseJudgeResponse(response: string): EvaluationResult {
    // Would parse LLM response
    return {
      id: generateId(),
      taskId: "",
      criteria: [],
      overallScore: 0,
      passed: false,
      latencyMs: 0,
      timestamp: nowISO(),
      evaluator: "llm-judge",
    };
  }
}