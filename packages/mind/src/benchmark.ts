import {
  BenchmarkResultSchema,
  HardwareProfileSchema,
  ModelSchema,
  type BenchmarkResult,
  type HardwareProfile,
  type Model,
  ResultLabelSchema,
  type ResultLabel,
} from "@seai/core";
import { generateId, nowISO, Result, percentile, mean, median, standardDeviation } from "@seai/core";
import { createTelemetry, EventTypes, type Telemetry } from "@seai/core";
import { StorageAdapter, createRepository } from "@seai/core";
import { SecurityEngine, type SecurityContext } from "@seai/core";
import { CognitionEngine, type TaskContext } from "./cognition.js";

export interface BenchmarkConfig {
  maxConcurrentBenchmarks: number;
  defaultTimeoutMs: number;
  warmupRuns: number;
  measurementRuns: number;
  cooldownMs: number;
}

const DEFAULT_CONFIG: BenchmarkConfig = {
  maxConcurrentBenchmarks: 3,
  defaultTimeoutMs: 300000,
  warmupRuns: 2,
  measurementRuns: 10,
  cooldownMs: 1000,
};

export interface BenchmarkExperiment {
  id: string;
  name: string;
  description: string;
  tasks: BenchmarkTask[];
  hardware: HardwareProfile;
  models: Model[];
  config: BenchmarkConfig;
  createdAt: string;
  status: "pending" | "running" | "completed" | "failed";
  results: BenchmarkResult[];
}

export interface BenchmarkTask {
  id: string;
  name: string;
  type: string;
  input: unknown;
  expectedOutput?: unknown;
  evaluationSuite: string;
  iterations: number;
  timeoutMs: number;
  metadata?: Record<string, unknown>;
}

export interface BenchmarkSuite {
  id: string;
  name: string;
  description: string;
  tasks: BenchmarkTask[];
  passingThreshold: number;
}

export class BenchmarkEngine {
  private config: BenchmarkConfig;
  private telemetry: Telemetry;
  private storage: StorageAdapter;
  private experimentRepository: ReturnType<typeof createRepository<BenchmarkExperiment>>;
  private resultRepository: ReturnType<typeof createRepository<BenchmarkResult>>;
  private securityEngine: SecurityEngine;
  private cognitionEngine: CognitionEngine;
  private activeExperiments: Map<string, BenchmarkExperiment> = new Map();

  constructor(
    config: Partial<BenchmarkConfig>,
    telemetry: Telemetry,
    storage: StorageAdapter,
    securityEngine: SecurityEngine,
    cognitionEngine: CognitionEngine
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.telemetry = telemetry;
    this.storage = storage;
    this.securityEngine = securityEngine;
    this.cognitionEngine = cognitionEngine;
    this.experimentRepository = createRepository(storage, "experiments", this.serializeExperiment, this.deserializeExperiment);
    this.resultRepository = createRepository(storage, "benchmark_results", this.serializeResult, this.deserializeResult);
  }

  async initialize(): Promise<void> {
    await this.storage.initialize();
  }

  async shutdown(): Promise<void> {
    await this.storage.close();
  }

  async createExperiment(
    experiment: Omit<BenchmarkExperiment, "id" | "createdAt" | "status" | "results">,
    context: SecurityContext
  ): Promise<Result<BenchmarkExperiment, Error>> {
    const privacyCheck = this.securityEngine.checkPrivacy(context, "internal");
    if (!privacyCheck) {
      return Result.err(new Error("Privacy level insufficient for experiment creation"));
    }

    const newExperiment: BenchmarkExperiment = {
      ...experiment,
      id: generateId(),
      createdAt: nowISO(),
      status: "pending",
      results: [],
    };

    await this.experimentRepository.create(newExperiment);

    this.telemetry.emitEvent(EventTypes.BENCHMARK_STARTED, "benchmark-engine", { 
      experimentId: newExperiment.id, 
      name: newExperiment.name 
    });

    return Result.ok(newExperiment);
  }

  async runExperiment(
    experimentId: string,
    mindId: string,
    context: TaskContext
  ): Promise<Result<BenchmarkExperiment, Error>> {
    const experiment = await this.experimentRepository.get(experimentId);
    if (!experiment) {
      return Result.err(new Error(`Experiment not found: ${experimentId}`));
    }

    if (this.activeExperiments.size >= this.config.maxConcurrentBenchmarks) {
      return Result.err(new Error("Maximum concurrent benchmarks reached"));
    }

    experiment.status = "running";
    this.activeExperiments.set(experimentId, experiment);
    await this.experimentRepository.update(experiment);

    const results: BenchmarkResult[] = [];

    try {
      for (const task of experiment.tasks) {
        const taskResults = await this.runBenchmarkTask(task, experiment, mindId, context);
        results.push(...taskResults);
      }

      experiment.status = "completed";
      experiment.results = results;
      await this.experimentRepository.update(experiment);

      this.telemetry.emitEvent(EventTypes.BENCHMARK_COMPLETED, "benchmark-engine", { 
        experimentId, 
        taskCount: experiment.tasks.length,
        resultCount: results.length,
      });

      return Result.ok(experiment);
    } catch (error) {
      experiment.status = "failed";
      await this.experimentRepository.update(experiment);
      
      this.telemetry.emitEvent(EventTypes.BENCHMARK_COMPLETED, "benchmark-engine", { 
        experimentId, 
        error: String(error) 
      });
      
      return Result.err(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.activeExperiments.delete(experimentId);
    }
  }

  private async runBenchmarkTask(
    task: BenchmarkTask,
    experiment: BenchmarkExperiment,
    mindId: string,
    context: TaskContext
  ): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    // Warmup runs
    for (let i = 0; i < this.config.warmupRuns; i++) {
      await this.cognitionEngine.processTask({
        type: task.type,
        input: task.input,
        priority: 50,
        privacy: "internal",
      }, context);
      await new Promise(resolve => setTimeout(resolve, this.config.cooldownMs));
    }

    // Measurement runs
    const latencies: number[] = [];
    const tokenCounts: number[] = [];
    let successCount = 0;
    let totalTokens = 0;

    for (let i = 0; i < this.config.measurementRuns; i++) {
      const startTime = Date.now();
      
      const taskResult = await this.cognitionEngine.processTask({
        type: task.type,
        input: task.input,
        priority: 50,
        privacy: "internal",
      }, context);
      
      const latency = Date.now() - startTime;
      latencies.push(latency);

      if (taskResult.ok) {
        successCount++;
        totalTokens += taskResult.value.tokensUsed || 0;
        tokenCounts.push(taskResult.value.tokensUsed || 0);
      }

      await new Promise(resolve => setTimeout(resolve, this.config.cooldownMs));
    }

    // Calculate metrics
    latencies.sort((a, b) => a - b);
    const taskSuccess = successCount / this.config.measurementRuns;
    const meanLatency = mean(latencies);
    const p50Latency = percentile(latencies, 50);
    const p95Latency = percentile(latencies, 95);
    const p99Latency = percentile(latencies, 99);
    const tokensPerSecond = meanLatency > 0 ? (mean(tokenCounts) / meanLatency) * 1000 : 0;

    // Get hardware metrics (simplified)
    const hardware = experiment.hardware;
    const ramUsage = process.memoryUsage();

    const result: BenchmarkResult = {
      id: generateId(),
      experimentId: experiment.id,
      mindId,
      genomeId: undefined,
      hardware,
      software: {
        nodeVersion: process.version,
        pnpmVersion: "11.17.0",
        seaiVersion: "0.1.0-alpha",
      },
      model: experiment.models[0],
      modelVersion: experiment.models[0].version,
      configuration: {},
      dataset: task.name,
      evaluator: task.evaluationSuite,
      timestamp: nowISO(),
      result: {
        taskSuccess,
        accuracy: taskSuccess,
        latency: {
          meanMs: meanLatency,
          p50Ms: p50Latency,
          p95Ms: p95Latency,
          p99Ms: p99Latency,
        },
        tokensPerSecond,
        ram: {
          peakBytes: ramUsage.heapUsed,
          averageBytes: ramUsage.heapUsed,
        },
        cpu: {
          peakPercent: 0,
          averagePercent: 0,
        },
        modelLoadingTimeMs: 0,
        toolCalls: 0,
        memoryRetrieval: 0,
        skillReuse: 0,
        reliability: taskSuccess,
      },
      label: "measured",
    };

    const validated = BenchmarkResultSchema.parse(result);
    await this.resultRepository.create(validated);
    results.push(validated);

    return results;
  }

  async compareExperiments(experimentAId: string, experimentBId: string): Promise<Result<ComparisonResult, Error>> {
    const expA = await this.experimentRepository.get(experimentAId);
    const expB = await this.experimentRepository.get(experimentBId);
    
    if (!expA || !expB) {
      return Result.err(new Error("One or both experiments not found"));
    }

    const resultsA = expA.results;
    const resultsB = expB.results;

    const comparison: ComparisonResult = {
      experimentA: experimentAId,
      experimentB: experimentBId,
      metrics: {},
      better: "B",
      confidence: 0,
    };

    // Compare key metrics
    for (const resultA of resultsA) {
      const resultB = resultsB.find(r => r.dataset === resultA.dataset);
      if (!resultB) continue;

      for (const [key, valueA] of Object.entries(resultA.result)) {
        const valueB = (resultB.result as any)[key];
        if (typeof valueA === "number" && typeof valueB === "number") {
          const diff = ((valueB - valueA) / Math.abs(valueA)) * 100;
          comparison.metrics[key] = diff;
        }
      }
    }

    // Determine which is better
    let betterCount = 0;
    let totalComparisons = 0;
    for (const [key, diff] of Object.entries(comparison.metrics)) {
      totalComparisons++;
      // For latency, lower is better; for others, higher is better
      const lowerIsBetter = key.includes("latency") || key.includes("cost") || key.includes("ram") || key.includes("cpu");
      if ((lowerIsBetter && diff < 0) || (!lowerIsBetter && diff > 0)) {
        betterCount++;
      }
    }

    comparison.better = betterCount > totalComparisons / 2 ? "B" : "A";
    comparison.confidence = totalComparisons > 0 ? betterCount / totalComparisons : 0;

    return Result.ok(comparison);
  }

  async getExperiment(experimentId: string): Promise<BenchmarkExperiment | null> {
    return this.experimentRepository.get(experimentId);
  }

  async listExperiments(): Promise<BenchmarkExperiment[]> {
    return this.experimentRepository.list({}, 100);
  }

  async getResults(experimentId: string): Promise<BenchmarkResult[]> {
    return this.resultRepository.list({ experiment_id: experimentId } as any, 1000);
  }

  private serializeExperiment(exp: BenchmarkExperiment): Record<string, unknown> {
    return {
      id: exp.id,
      name: exp.name,
      description: exp.description,
      tasks: JSON.stringify(exp.tasks),
      hardware: JSON.stringify(exp.hardware),
      models: JSON.stringify(exp.models),
      config: JSON.stringify(exp.config),
      created_at: exp.createdAt,
      status: exp.status,
      results: JSON.stringify(exp.results.map(r => r.id)),
    };
  }

  private deserializeExperiment(row: Record<string, unknown>): BenchmarkExperiment {
    return {
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      tasks: JSON.parse(row.tasks as string),
      hardware: JSON.parse(row.hardware as string),
      models: JSON.parse(row.models as string),
      config: JSON.parse(row.config as string),
      createdAt: row.created_at as string,
      status: row.status as BenchmarkExperiment["status"],
      results: [],
    };
  }

  private serializeResult(result: BenchmarkResult): Record<string, unknown> {
    return {
      id: result.id,
      experiment_id: result.experimentId,
      mind_id: result.mindId,
      genome_id: result.genomeId || null,
      hardware: JSON.stringify(result.hardware),
      software: JSON.stringify(result.software),
      model: JSON.stringify(result.model),
      model_version: result.modelVersion,
      configuration: JSON.stringify(result.configuration),
      prompt_version: result.promptVersion || null,
      memory_version: result.memoryVersion || null,
      skill_version: result.skillVersion || null,
      dataset: result.dataset,
      evaluator: result.evaluator,
      timestamp: result.timestamp,
      result: JSON.stringify(result.result),
      label: result.label,
    };
  }

  private deserializeResult(row: Record<string, unknown>): BenchmarkResult {
    return {
      id: row.id as string,
      experimentId: row.experiment_id as string,
      mindId: row.mind_id as string,
      genomeId: row.genome_id as string | undefined,
      hardware: JSON.parse(row.hardware as string),
      software: JSON.parse(row.software as string),
      model: JSON.parse(row.model as string),
      modelVersion: row.model_version as string,
      configuration: JSON.parse(row.configuration as string),
      promptVersion: row.prompt_version as string | undefined,
      memoryVersion: row.memory_version as string | undefined,
      skillVersion: row.skill_version as string | undefined,
      dataset: row.dataset as string,
      evaluator: row.evaluator as string,
      timestamp: row.timestamp as string,
      result: JSON.parse(row.result as string),
      label: row.label as ResultLabel,
    };
  }
}

export interface ComparisonResult {
  experimentA: string;
  experimentB: string;
  metrics: Record<string, number>;
  better: "A" | "B";
  confidence: number;
}

export function createBenchmarkEngine(
  config: Partial<BenchmarkConfig>,
  telemetry: Telemetry,
  storage: StorageAdapter,
  securityEngine: SecurityEngine,
  cognitionEngine: CognitionEngine
): BenchmarkEngine {
  return new BenchmarkEngine(config, telemetry, storage, securityEngine, cognitionEngine);
}

export const BUILTIN_BENCHMARK_TASKS: BenchmarkTask[] = [
  {
    id: "reasoning-1",
    name: "Logical Reasoning",
    type: "reasoning",
    input: "If all A are B, and some B are C, can we conclude that some A are C?",
    expectedOutput: "No, we cannot conclude that some A are C.",
    evaluationSuite: "correctness",
    iterations: 10,
    timeoutMs: 30000,
  },
  {
    id: "coding-1",
    name: "Fibonacci Function",
    type: "coding",
    input: "Write a Python function to calculate the nth Fibonacci number efficiently.",
    evaluationSuite: "correctness",
    iterations: 10,
    timeoutMs: 30000,
  },
  {
    id: "extraction-1",
    name: "Entity Extraction",
    type: "extraction",
    input: "Extract all person names, organizations, and dates from: 'John Smith from Microsoft announced on January 15, 2024 that Azure revenue grew 20%.'",
    expectedOutput: { persons: ["John Smith"], organizations: ["Microsoft"], dates: ["January 15, 2024"] },
    evaluationSuite: "correctness",
    iterations: 10,
    timeoutMs: 30000,
  },
  {
    id: "summarization-1",
    name: "Document Summarization",
    type: "summarization",
    input: "Summarize the following in 3 sentences: [long text]",
    evaluationSuite: "quality",
    iterations: 10,
    timeoutMs: 30000,
  },
  {
    id: "planning-1",
    name: "Project Planning",
    type: "planning",
    input: "Create a plan for building a web application with user authentication, database, and API.",
    evaluationSuite: "quality",
    iterations: 5,
    timeoutMs: 60000,
  },
];

export function createStandardExperiment(
  name: string,
  description: string,
  models: Model[],
  hardware: HardwareProfile,
  tasks: BenchmarkTask[] = BUILTIN_BENCHMARK_TASKS
): BenchmarkExperiment {
  return {
    id: generateId(),
    name,
    description,
    tasks,
    hardware,
    models,
    config: DEFAULT_CONFIG,
    createdAt: nowISO(),
    status: "pending",
    results: [],
  };
}