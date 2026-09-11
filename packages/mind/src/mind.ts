import {
  IdentitySchema,
  PurposeSchema,
  GoalSchema,
  ValueSchema,
  ConstraintSchema,
  PolicySchema,
  HardwareProfileSchema,
  GenomeSchema,
  VersionSchema,
  type Identity,
  type Purpose,
  type Goal,
  type Value,
  type Constraint,
  type Policy,
  type HardwareProfile,
  type Genome,
  type Version,
  type Task,
} from "@seai/core";
import { generateId, nowISO, Result } from "@seai/core";
import { createTelemetry, EventTypes, type Telemetry } from "@seai/core";
import { StorageAdapter, createRepository, storage } from "@seai/core";
import { SecurityEngine, type SecurityContext } from "@seai/core";
import { PolicyEngine, type PolicyContext } from "@seai/core";
import { MemoryEngine, type MemoryConfig } from "@seai/state";
import { SkillEngine, type SkillConfig } from "@seai/state";
import { ToolEngine, type ToolConfig } from "@seai/state";
import { CognitionEngine, type CognitionConfig, type TaskContext } from "./cognition.js";
import { RoutingEngine } from "@seai/runtime";
import { RuntimeManager, createRuntimeManager, type InferenceRuntime } from "@seai/runtime";
import { CognitiveCompiler, type CompilerConfig } from "./compiler.js";
import { EvaluationEngine, type EvaluationConfig } from "./evaluation.js";
import { EvolutionEngine, type EvolutionConfig } from "./evolution.js";
import { GenomeEngine, type GenomeConfig } from "@seai/state";
import { BenchmarkEngine, type BenchmarkConfig } from "./benchmark.js";
import { HardwareDetector, type HardwareProfile as DetectedHardwareProfile, detectHardware } from "@seai/core";

export interface MindConfig {
  identity: Identity;
  purpose: Purpose;
  goals: Goal[];
  values: Value[];
  constraints: Constraint[];
  policies: Policy[];
  memory: MemoryConfig;
  skills: SkillConfig;
  tools: ToolConfig;
  cognition: CognitionConfig;
  compiler: CompilerConfig;
  evaluation: EvaluationConfig;
  evolution: EvolutionConfig;
  genome: GenomeConfig;
  benchmark: BenchmarkConfig;
  hardware: HardwareProfile;
  computeBudget: {
    maxTokensPerTask: number;
    maxCostPerTask: number;
    maxLatencyMs: number;
  };
  privacy: {
    defaultLevel: string;
    allowedLevels: string[];
  };
  security: {
    defaultLevel: string;
    requiredPermissions: string[];
  };
}

export interface MindState {
  id: string;
  name: string;
  status: "initializing" | "ready" | "running" | "paused" | "stopped" | "error";
  currentTask?: string;
  activeTasks: number;
  uptime: number;
  lastActivity: string;
}

export class MindRuntime {
  private config: MindConfig;
  private telemetry: Telemetry;
  private storage: StorageAdapter;
  private securityEngine: SecurityEngine;
  private policyEngine: PolicyEngine;
  private memoryEngine: MemoryEngine;
  private skillEngine: SkillEngine;
  private toolEngine: ToolEngine;
  private routingEngine: RoutingEngine;
  private runtimeManager: RuntimeManager;
  private cognitionEngine: CognitionEngine;
  private compiler: CognitiveCompiler;
  private evaluationEngine: EvaluationEngine;
  private evolutionEngine: EvolutionEngine;
  private genomeEngine: GenomeEngine;
  private benchmarkEngine: BenchmarkEngine;
  private state: MindState;
  private startTime: number;
  private taskContext: TaskContext | null = null;

  constructor(
    config: MindConfig,
    telemetry: Telemetry,
    storage: StorageAdapter,
    securityEngine: SecurityEngine,
    policyEngine: PolicyEngine,
    memoryEngine: MemoryEngine,
    skillEngine: SkillEngine,
    toolEngine: ToolEngine,
    routingEngine: RoutingEngine,
    runtimeManager: RuntimeManager,
    cognitionEngine: CognitionEngine,
    compiler: CognitiveCompiler,
    evaluationEngine: EvaluationEngine,
    evolutionEngine: EvolutionEngine,
    genomeEngine: GenomeEngine,
    benchmarkEngine: BenchmarkEngine
  ) {
    this.config = config;
    this.telemetry = telemetry;
    this.storage = storage;
    this.securityEngine = securityEngine;
    this.policyEngine = policyEngine;
    this.memoryEngine = memoryEngine;
    this.skillEngine = skillEngine;
    this.toolEngine = toolEngine;
    this.routingEngine = routingEngine;
    this.runtimeManager = runtimeManager;
    this.cognitionEngine = cognitionEngine;
    this.compiler = compiler;
    this.evaluationEngine = evaluationEngine;
    this.evolutionEngine = evolutionEngine;
    this.genomeEngine = genomeEngine;
    this.benchmarkEngine = benchmarkEngine;
    this.state = {
      id: config.identity.id,
      name: config.identity.name,
      status: "initializing",
      activeTasks: 0,
      uptime: 0,
      lastActivity: nowISO(),
    };
    this.startTime = Date.now();
  }

  async initialize(): Promise<Result<void, Error>> {
    try {
      this.state.status = "initializing";
      
      await this.storage.initialize();
      await this.memoryEngine.initialize();
      await this.skillEngine.initialize();
      await this.toolEngine.initialize();
      
      // Initialize hardware detection
      const hardware = await detectHardware();
      this.config.hardware = hardware;
      
      // Create task context
      this.taskContext = this.createTaskContext();
      
      this.state.status = "ready";
      this.state.lastActivity = nowISO();
      
      this.telemetry.emitEvent(EventTypes.MIND_STARTED, "mind-runtime", { 
        mindId: this.config.identity.id,
        name: this.config.identity.name,
      });
      
      return Result.ok(undefined);
    } catch (error) {
      this.state.status = "error";
      this.telemetry.emitEvent(EventTypes.SECURITY_ALERT, "mind-runtime", { 
        mindId: this.config.identity.id,
        error: String(error),
        action: "initialize" 
      });
      return Result.err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async shutdown(): Promise<Result<void, Error>> {
    try {
      this.state.status = "stopped";
      
      await this.memoryEngine.shutdown();
      await this.skillEngine.shutdown();
      await this.toolEngine.shutdown();
      await this.storage.close();
      
      this.telemetry.emitEvent(EventTypes.MIND_STOPPED, "mind-runtime", { 
        mindId: this.config.identity.id,
        uptime: Date.now() - this.startTime,
      });
      
      return Result.ok(undefined);
    } catch (error) {
      this.telemetry.emitEvent(EventTypes.SECURITY_ALERT, "mind-runtime", { 
        mindId: this.config.identity.id,
        error: String(error),
        action: "shutdown" 
      });
      return Result.err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async runTask(
    taskInput: Omit<TaskContext, "mindId" | "securityContext" | "policyContext" | "hardwareProfile" | "availableModels" | "availableProviders"> & {
      type: string;
      input: unknown;
    }
  ): Promise<Result<any, Error>> {
    if (!this.taskContext) {
      return Result.err(new Error("Mind not initialized"));
    }
    
    if (this.state.status !== "ready" && this.state.status !== "running") {
      return Result.err(new Error(`Mind not ready: ${this.state.status}`));
    }

    this.state.status = "running";
    this.state.activeTasks = this.cognitionEngine.getTaskCount();
    this.state.lastActivity = nowISO();

    const fullTaskContext: TaskContext = {
      ...this.taskContext,
      ...taskInput,
    };

    const result = await this.cognitionEngine.processTask(taskInput as any, fullTaskContext);

    this.state.activeTasks = this.cognitionEngine.getTaskCount();
    this.state.status = this.state.activeTasks > 0 ? "running" : "ready";
    this.state.lastActivity = nowISO();

    // Record the experience (best effort: a recording failure must never
    // fail the task itself). Successes are episodic memory; failures are
    // negative memory so the Mind can learn what does not work.
    await this.recordExperience(result.ok ? result.value : null, result.ok ? null : result.error, fullTaskContext);

    return result;
  }

  private async recordExperience(task: Task | null, error: Error | null, context: TaskContext): Promise<void> {
    try {
      // Best-effort genome link: null when the Mind has no genome yet.
      let genomeVersion: unknown = null;
      try {
        const latest = await this.genomeEngine.getLatestGenome(this.config.identity.id);
        genomeVersion = latest ? latest.version : null;
      } catch {
        genomeVersion = null;
      }
      const truncate = (value: unknown, max = 500): string => {
        const s = typeof value === "string" ? value : JSON.stringify(value ?? null);
        return s.length > max ? s.slice(0, max) + "…[truncated]" : s;
      };
      const experience = {
        kind: "task-experience",
        taskId: task?.id ?? generateId(),
        taskType: task?.type ?? "unknown",
        input: truncate(task?.input),
        result: task ? truncate(task.result) : undefined,
        error: error ? String(error.message || error) : undefined,
        executionPath: task?.executionPath ?? "none",
        modelUsed: task?.modelUsed,
        toolsUsed: task?.toolsUsed,
        skillsUsed: task?.skillsUsed,
        tokensUsed: task?.tokensUsed,
        latencyMs: task?.latencyMs,
        verification: task?.verification ?? "none",
        status: task?.status ?? "failed",
        genomeVersion,
      };
      const res = await this.memoryEngine.capture(
        this.config.identity.id,
        task && error === null ? "episodic" : "negative",
        experience,
        context.securityContext,
        {
          confidence: 1,
          utility: 0.5,
          metadata: { kind: "task-experience", verification: experience.verification },
        }
      );
      if (!res.ok) {
        this.telemetry.emitEvent(EventTypes.TASK_COMPLETED, "mind-runtime", {
          mindId: this.config.identity.id,
          action: "experience-record-failed",
          error: String(res.error),
        });
      }
    } catch (err) {
      this.telemetry.emitEvent(EventTypes.TASK_COMPLETED, "mind-runtime", {
        mindId: this.config.identity.id,
        action: "experience-record-failed",
        error: String(err),
      });
    }
  }

  async compileGoal(goal: string): Promise<Result<any, Error>> {
    if (!this.taskContext) {
      return Result.err(new Error("Mind not initialized"));
    }
    
    return this.compiler.compile(goal, this.taskContext);
  }

  async evolve(weakness: string): Promise<Result<any, Error>> {
    if (!this.taskContext) {
      return Result.err(new Error("Mind not initialized"));
    }

    const latestGenome = await this.genomeEngine.getLatestGenome(this.config.identity.id);
    if (!latestGenome) {
      return Result.err(new Error("No genome found for evolution"));
    }

    const context = {
      genomeId: latestGenome.id,
      mindId: this.config.identity.id,
      weakness,
      currentPerformance: (latestGenome.benchmarkResults || {}) as Record<string, number>,
      hardwareProfile: this.config.hardware,
      availableModels: await this.runtimeManager.getModelRegistry().list(),
    };

    const candidates = await this.evolutionEngine.generateCandidates(context);
    
    for (const candidate of candidates) {
      await this.evolutionEngine.sandboxCandidate(candidate, latestGenome);
      await this.evolutionEngine.runRegressionTests(candidate, latestGenome);
      
      if (this.config.evolution.requireSecurityReview) {
        await this.evolutionEngine.securityReview(candidate, "auto");
      }
      if (this.config.evolution.requirePrivacyReview) {
        await this.evolutionEngine.privacyReview(candidate, "auto");
      }
      if (this.config.evolution.requireCostReview) {
        await this.evolutionEngine.costReview(candidate, "auto");
      }
      
      const comparison = await this.evolutionEngine.compareCandidate(candidate, latestGenome);
      if (comparison.better) {
        if (this.config.evolution.autoPromote) {
          await this.evolutionEngine.promoteCandidate(candidate.id, latestGenome.id);
        }
      }
    }

    return Result.ok({ candidates: candidates.length, promoted: 0 });
  }

  async benchmark(experimentName: string): Promise<Result<any, Error>> {
    if (!this.taskContext) {
      return Result.err(new Error("Mind not initialized"));
    }

    const latestGenome = await this.genomeEngine.getLatestGenome(this.config.identity.id);
    
    const experiment = await this.benchmarkEngine.createExperiment({
      name: experimentName,
      description: `Benchmark for ${this.config.identity.name}`,
      tasks: [],
      hardware: this.config.hardware,
      models: await this.runtimeManager.getModelRegistry().list(),
      config: this.config.benchmark,
    }, { permissions: [], privacyLevel: "internal", securityLevel: "low" });

    if (!experiment.ok) return experiment;

    return this.benchmarkEngine.runExperiment(experiment.value.id, this.config.identity.id, this.taskContext);
  }

  getState(): MindState {
    this.state.uptime = Date.now() - this.startTime;
    this.state.activeTasks = this.cognitionEngine.getTaskCount();
    return { ...this.state };
  }

  getConfig(): MindConfig {
    return { ...this.config };
  }

  getTelemetry(): Telemetry {
    return this.telemetry;
  }

  getMemoryEngine(): MemoryEngine {
    return this.memoryEngine;
  }

  getSkillEngine(): SkillEngine {
    return this.skillEngine;
  }

  getToolEngine(): ToolEngine {
    return this.toolEngine;
  }

  getRuntimeManager(): RuntimeManager {
    return this.runtimeManager;
  }

  // Registers an execution runtime (e.g. a probed-local Ollama adapter) and
  // refreshes the model's catalog the cognition layer routes over. Takes the
  // provider-neutral InferenceRuntime interface — the Mind never imports an
  // adapter directly.
  async registerRuntime(runtime: InferenceRuntime): Promise<void> {
    this.runtimeManager.registerRuntime(runtime);
    if (this.taskContext) {
      try {
        this.taskContext.availableModels = await this.runtimeManager.discoverAllModels();
      } catch {
        this.taskContext.availableModels = [];
      }
    }
  }

  getCognitionEngine(): CognitionEngine {
    return this.cognitionEngine;
  }

  getCompiler(): CognitiveCompiler {
    return this.compiler;
  }

  getEvolutionEngine(): EvolutionEngine {
    return this.evolutionEngine;
  }

  getGenomeEngine(): GenomeEngine {
    return this.genomeEngine;
  }

  getBenchmarkEngine(): BenchmarkEngine {
    return this.benchmarkEngine;
  }

  private createTaskContext(): TaskContext {
    return {
      mindId: this.config.identity.id,
      securityContext: {
        userId: "system",
        sessionId: generateId(),
        permissions: this.config.security.requiredPermissions,
        privacyLevel: this.config.privacy.defaultLevel as any,
        securityLevel: this.config.security.defaultLevel as any,
      },
      policyContext: {
        operation: "task.execute",
        resource: "mind",
        action: "execute",
        subject: {
          userId: "system",
          sessionId: generateId(),
          permissions: this.config.security.requiredPermissions,
          privacyLevel: this.config.privacy.defaultLevel as any,
          securityLevel: this.config.security.defaultLevel as any,
        },
        resourcePrivacyLevel: this.config.privacy.defaultLevel as any,
        resourceSecurityLevel: this.config.security.defaultLevel,
        timestamp: nowISO(),
      },
      hardwareProfile: this.config.hardware,
      availableModels: [],
      availableProviders: [],
    };
  }
}

export function createMindRuntime(config: MindConfig): MindRuntime {
  const telemetry = createTelemetry();
  const securityEngine = new SecurityEngine();
  const policyEngine = new PolicyEngine(securityEngine);
  const memoryEngine = new MemoryEngine(config.memory, telemetry, storage, securityEngine);
  const skillEngine = new SkillEngine(config.skills, telemetry, storage, securityEngine);
  const toolEngine = new ToolEngine(config.tools, telemetry, storage, securityEngine);
  const routingEngine = new RoutingEngine(telemetry, securityEngine, policyEngine);
  const runtimeManager = createRuntimeManager(telemetry);
  const evaluationEngine = new EvaluationEngine(config.evaluation, telemetry, securityEngine);
  const cognitionEngine = new CognitionEngine(
    config.cognition, telemetry, memoryEngine, skillEngine, toolEngine, routingEngine, runtimeManager, securityEngine, policyEngine
  );
  const compiler = new CognitiveCompiler(
    config.compiler, telemetry, memoryEngine, skillEngine, toolEngine, routingEngine, runtimeManager, securityEngine, policyEngine, evaluationEngine
  );
  const genomeEngine = new GenomeEngine(config.genome, telemetry, storage, securityEngine);
  const benchmarkEngine = new BenchmarkEngine(config.benchmark, telemetry, storage, securityEngine, cognitionEngine);
  const evolutionEngine = new EvolutionEngine(
    config.evolution, telemetry, storage, securityEngine, policyEngine, evaluationEngine, benchmarkEngine
  );

  return new MindRuntime(
    config, telemetry, storage, securityEngine, policyEngine,
    memoryEngine, skillEngine, toolEngine, routingEngine, runtimeManager,
    cognitionEngine, compiler, evaluationEngine, evolutionEngine, genomeEngine, benchmarkEngine
  );
}

export interface MindTemplate {
  name: string;
  description: string;
  purpose: Purpose;
  defaultGoals: Goal[];
  defaultValues: Value[];
  defaultConstraints: Constraint[];
  defaultPolicies: Policy[];
  memoryConfig: MemoryConfig;
  skillsConfig: SkillConfig;
  toolsConfig: ToolConfig;
  cognitionConfig: CognitionConfig;
  compilerConfig: CompilerConfig;
  evaluationConfig: EvaluationConfig;
  evolutionConfig: EvolutionConfig;
  genomeConfig: GenomeConfig;
  benchmarkConfig: BenchmarkConfig;
  computeBudget: MindConfig["computeBudget"];
  privacy: MindConfig["privacy"];
  security: MindConfig["security"];
}

export const DEFAULT_MIND_TEMPLATE: MindTemplate = {
  name: "Default Mind",
  description: "A general-purpose SE-AI Mind",
  purpose: {
    primary: "Assist with a wide range of cognitive tasks",
    secondary: ["learning", "problem-solving", "creative tasks"],
    constraints: ["privacy-first", "security-conscious", "resource-efficient"],
  },
  defaultGoals: [
    { id: generateId(), description: "Complete assigned tasks accurately", priority: 100, status: "active", createdAt: nowISO(), updatedAt: nowISO() },
    { id: generateId(), description: "Learn from interactions and improve", priority: 80, status: "active", createdAt: nowISO(), updatedAt: nowISO() },
    { id: generateId(), description: "Maintain privacy and security", priority: 100, status: "active", createdAt: nowISO(), updatedAt: nowISO() },
  ],
  defaultValues: [
    { id: generateId(), name: "accuracy", description: "Prioritize correct outputs", weight: 0.9 },
    { id: generateId(), name: "efficiency", description: "Minimize resource usage", weight: 0.7 },
    { id: generateId(), name: "privacy", description: "Protect user data", weight: 1.0 },
    { id: generateId(), name: "helpfulness", description: "Provide useful assistance", weight: 0.8 },
  ],
  defaultConstraints: [
    { id: generateId(), type: "hard", description: "Never expose private data", validator: "privacy-gate" },
    { id: generateId(), type: "hard", description: "Never execute unapproved code", validator: "security-policy" },
    { id: generateId(), type: "soft", description: "Prefer local models when possible", validator: "local-preference" },
  ],
  defaultPolicies: [],
  memoryConfig: {
    workingMemoryCapacity: 100,
    consolidationIntervalMs: 300000,
    decayRate: 0.01,
    maxMemoryAge: 86400000 * 30,
    compressionEnabled: true,
    embeddingEnabled: false,
  },
  skillsConfig: {
    maxSkillsPerMind: 1000,
    autoValidate: true,
    validationTimeoutMs: 30000,
  },
  toolsConfig: {
    maxToolsPerMind: 100,
    defaultTimeoutMs: 30000,
    maxRetries: 3,
  },
  cognitionConfig: {
    maxConcurrentTasks: 10,
    defaultTimeoutMs: 60000,
    enableCache: true,
    cacheTtlMs: 300000,
  },
  compilerConfig: {
    enableOptimization: true,
    maxGraphDepth: 10,
    cacheEnabled: true,
  },
  evaluationConfig: {
    defaultTimeoutMs: 30000,
    maxConcurrentEvaluations: 5,
  },
  evolutionConfig: {
    maxConcurrentCandidates: 5,
    sandboxTimeoutMs: 300000,
    minImprovementThreshold: 0.05,
    requireSecurityReview: true,
    requirePrivacyReview: true,
    requireCostReview: true,
    autoPromote: false,
  },
  genomeConfig: {
    maxGenomesPerMind: 100,
    autoSnapshot: true,
    snapshotIntervalMs: 3600000,
  },
  benchmarkConfig: {
    maxConcurrentBenchmarks: 3,
    defaultTimeoutMs: 300000,
    warmupRuns: 2,
    measurementRuns: 10,
    cooldownMs: 1000,
  },
  computeBudget: {
    maxTokensPerTask: 4000,
    maxCostPerTask: 0.10,
    maxLatencyMs: 30000,
  },
  privacy: {
    defaultLevel: "internal",
    allowedLevels: ["public", "internal", "private"],
  },
  security: {
    defaultLevel: "medium",
    requiredPermissions: ["mind:execute", "memory:read", "memory:write", "skill:execute", "tool:execute"],
  },
};

export function createMindConfigFromTemplate(
  template: MindTemplate,
  identity: Identity
): MindConfig {
  return {
    identity,
    purpose: template.purpose,
    goals: template.defaultGoals,
    values: template.defaultValues,
    constraints: template.defaultConstraints,
    policies: template.defaultPolicies,
    memory: template.memoryConfig,
    skills: template.skillsConfig,
    tools: template.toolsConfig,
    cognition: template.cognitionConfig,
    compiler: template.compilerConfig,
    evaluation: template.evaluationConfig,
    evolution: template.evolutionConfig,
    genome: template.genomeConfig,
    benchmark: template.benchmarkConfig,
    hardware: {} as HardwareProfile, // Will be populated on init
    computeBudget: template.computeBudget,
    privacy: template.privacy,
    security: template.security,
  };
}

export async function detectAndCreateMind(
  name: string,
  generation: string,
  codename: string,
  template: MindTemplate = DEFAULT_MIND_TEMPLATE
): Promise<Result<MindRuntime, Error>> {
  const identity: Identity = {
    id: generateId(),
    name,
    version: { major: 0, minor: 1, patch: 0 },
    generation,
    codename,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };

  const config = createMindConfigFromTemplate(template, identity);
  const mind = createMindRuntime(config);
  
  const initResult = await mind.initialize();
  if (!initResult.ok) {
    return initResult;
  }

  return Result.ok(mind);
}