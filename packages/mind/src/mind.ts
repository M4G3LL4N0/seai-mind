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
import { StorageAdapter, createRepository, createStorage, storage } from "@seai/core";
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
import {
  ARITHMETIC_FORMAT_SUITE_V1,
  applyPromotion,
  compareArms,
  decideGate,
  formatComplianceCriterion,
  measureArm,
  proposeFormatComplianceCandidate,
  isCurrentlyPromoted,
  summarizeEmptyArm,
  appendExperimentRecord,
  defaultStorePaths,
  getActiveGenome,
  loadGenomeSnapshot,
  readExperimentHistory,
  setActiveGenome,
  storeGenomeSnapshot,
  updateExperimentRecord,
  type ExperimentRecord,
  type ExperimentStorePaths,
  type ExperimentSuite,
} from "./experiment.js";
import type { EvolutionCandidate } from "@seai/core";

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

  // Runs the REAL evolution experiment (baseline vs candidate on identical
  // tasks, measured evidence, explicit gate). The legacy simulated path is
  // retired: this method executes, measures, and records — never fabricates.
  // The weakness string is recorded as the motivating observation.
  async evolve(weakness: string, opts?: { storeBaseDir?: string }): Promise<Result<any, Error>> {
    if (!this.taskContext) {
      return Result.err(new Error("Mind not initialized"));
    }

    const result = await this.runExperiment(ARITHMETIC_FORMAT_SUITE_V1, opts);
    if (!result.ok) return result;

    const record = result.value;
    return Result.ok({
      experimentId: record.id,
      suite: record.suiteId,
      observation: weakness,
      baselineQuality: record.baseline.qualityRate,
      candidateQuality: record.candidateResult.qualityRate,
      decision: record.gate.decision,
      reasons: record.gate.reasons,
    });
  }

  // Full experiment lifecycle for one suite. Never auto-promotes: promotion
  // requires an explicit promoteExperiment() call (AUTO-PROMOTE = FALSE).
  async runExperiment(
    suite: ExperimentSuite = ARITHMETIC_FORMAT_SUITE_V1,
    opts?: { storeBaseDir?: string }
  ): Promise<Result<ExperimentRecord, Error>> {
    if (!this.taskContext) {
      return Result.err(new Error("Mind not initialized"));
    }

    const startedAt = nowISO();
    const paths = defaultStorePaths(this.config.identity.name, opts?.storeBaseDir);
    this.telemetry.emitEvent(EventTypes.EVOLUTION_STARTED, "mind-runtime", {
      mindId: this.config.identity.id,
      suite: suite.id,
      tasks: suite.tasks.length,
    });

    try {
      const parent = await this.ensureBaselineGenome();

      // BASELINE arm: live cognition config, isolated sandbox storage.
      const baselineSandbox = this.spawnSandbox(this.cognitionEngine.getConfig());
      const baseline = await measureArm(
        {
          telemetry: this.telemetry,
          cognition: baselineSandbox.cognition,
          mindId: this.config.identity.id,
          taskContext: baselineSandbox.taskContext,
        },
        suite.tasks,
        formatComplianceCriterion
      );

      // CANDIDATE from measured evidence (null when nothing failed).
      const candidate = proposeFormatComplianceCandidate({
        mindId: this.config.identity.id,
        genomeId: parent.id,
        suiteId: suite.id,
        baseline,
      });

      let candidateResult = summarizeEmptyArm();
      if (candidate) {
        const candidateSandbox = this.spawnSandbox({
          ...this.cognitionEngine.getConfig(),
          ...((candidate.changes.cognitionConfig ?? {}) as Partial<CognitionConfig>),
        });
        candidateResult = await measureArm(
          {
            telemetry: this.telemetry,
            cognition: candidateSandbox.cognition,
            mindId: this.config.identity.id,
            taskContext: candidateSandbox.taskContext,
          },
          suite.tasks,
          formatComplianceCriterion
        );
      }

      const deltas = compareArms(baseline, candidateResult);
      const gate = candidate
        ? decideGate({
            baseline,
            candidate: candidateResult,
            deltas,
            candidateChanges: candidate.changes as Record<string, unknown>,
            thresholds: { minQualityImprovement: this.config.evolution.minImprovementThreshold },
          })
        : {
            decision: "hold" as const,
            reasons: ["HOLD: baseline arm revealed no failures, so no candidate was proposed"],
            checks: [],
          };

      const record: ExperimentRecord = {
        id: generateId(),
        mindId: this.config.identity.id,
        suiteId: suite.id,
        startedAt,
        completedAt: nowISO(),
        parentGenomeId: parent.id,
        parentVersion: parent.version,
        candidate,
        baseline,
        candidateResult,
        deltas,
        gate,
        promotion: null,
        rollback: null,
        lineage: [...(parent.lineage ?? []), parent.id],
      };

      await storeGenomeSnapshot(paths, parent);
      await appendExperimentRecord(paths, record);
      this.telemetry.emitEvent(EventTypes.EVOLUTION_CANDIDATE_EVALUATED, "mind-runtime", {
        mindId: this.config.identity.id,
        experimentId: record.id,
        suite: suite.id,
        baselineQuality: baseline.qualityRate,
        candidateQuality: candidateResult.qualityRate,
        decision: gate.decision,
      });

      return Result.ok(record);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Explicit promotion: ELIGIBLE record → new genome version → live adoption.
  // Throws unless the gate decision is eligible and no promotion happened yet.
  async promoteExperiment(experimentId: string, opts?: { storeBaseDir?: string }): Promise<Result<Genome, Error>> {
    if (!this.taskContext) {
      return Result.err(new Error("Mind not initialized"));
    }

    try {
      const paths = defaultStorePaths(this.config.identity.name, opts?.storeBaseDir);
      const history = await readExperimentHistory(paths);
      const record = history.find((r) => r.id === experimentId);
      if (!record) return Result.err(new Error(`Experiment not found: ${experimentId}`));
      if (record.gate.decision !== "eligible") {
        return Result.err(new Error(`Experiment ${experimentId} is not eligible (decision: ${record.gate.decision})`));
      }
      if (isCurrentlyPromoted(record)) {
        return Result.err(new Error(`Experiment ${experimentId} already promoted (roll back first to re-promote)`));
      }
      if (!record.candidate) return Result.err(new Error(`Experiment ${experimentId} produced no candidate`));

      const parent = await loadGenomeSnapshot(paths, record.parentGenomeId);
      if (!parent) return Result.err(new Error(`Parent genome snapshot missing: ${record.parentGenomeId}`));

      const genome = applyPromotion(parent, record.candidate);
      const sysCtx = this.systemGenomeContext();
      const put = await this.genomeEngine.putGenome(genome, sysCtx);
      if (!put.ok) return put;
      this.applyGenome(put.value);

      await storeGenomeSnapshot(paths, put.value);
      const updated: ExperimentRecord = {
        ...record,
        promotion: {
          promotedGenomeId: put.value.id,
          promotedVersion: put.value.version,
          promotedAt: nowISO(),
        },
        lineage: [...record.lineage, put.value.id],
      };
      await updateExperimentRecord(paths, updated);
      await setActiveGenome(paths, {
        genomeId: put.value.id,
        version: put.value.version,
        experimentId: record.id,
        updatedAt: nowISO(),
      });
      this.telemetry.emitEvent(EventTypes.EVOLUTION_PROMOTED, "mind-runtime", {
        mindId: this.config.identity.id,
        experimentId: record.id,
        genomeId: put.value.id,
      });

      return Result.ok(put.value);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Real rollback through the genome engine's lineage traversal, then live
  // re-adoption of the restored version. Lineage history is preserved.
  async rollbackExperiment(reason: string, opts?: { storeBaseDir?: string }): Promise<Result<Genome, Error>> {
    if (!this.taskContext) {
      return Result.err(new Error("Mind not initialized"));
    }

    try {
      const paths = defaultStorePaths(this.config.identity.name, opts?.storeBaseDir);
      const active = await getActiveGenome(paths);
      if (!active) return Result.err(new Error("No active genome to roll back from"));

      // Rehydrate the chain into the live repository so the engine's real
      // lineage-traversal rollback operates on genuine records.
      const activeGenome = await loadGenomeSnapshot(paths, active.genomeId);
      if (!activeGenome) return Result.err(new Error(`Active genome snapshot missing: ${active.genomeId}`));
      const sysCtx = this.systemGenomeContext();
      const putActive = await this.genomeEngine.putGenome(activeGenome, sysCtx);
      if (!putActive.ok) return putActive;

      const parentId = activeGenome.parentGenome;
      if (!parentId) return Result.err(new Error("Active genome has no parent; nothing to roll back to"));
      const parent = await loadGenomeSnapshot(paths, parentId);
      if (!parent) return Result.err(new Error(`Parent genome snapshot missing: ${parentId}`));
      const putParent = await this.genomeEngine.putGenome(parent, sysCtx);
      if (!putParent.ok) return putParent;

      const rolled = await this.genomeEngine.rollbackGenome(activeGenome.id, parent.version, sysCtx);
      if (!rolled.ok) return rolled;
      this.applyGenome(rolled.value);

      await storeGenomeSnapshot(paths, rolled.value);
      await setActiveGenome(paths, {
        genomeId: rolled.value.id,
        version: rolled.value.version,
        experimentId: active.experimentId,
        updatedAt: nowISO(),
      });
      if (active.experimentId) {
        const history = await readExperimentHistory(paths);
        const record = history.find((r) => r.id === active.experimentId);
        if (record) {
          await updateExperimentRecord(paths, {
            ...record,
            rollback: {
              rolledBackGenomeId: rolled.value.id,
              rolledBackVersion: rolled.value.version,
              restoredGenomeId: parent.id,
              rolledBackAt: nowISO(),
              reason,
            },
            lineage: [...record.lineage, rolled.value.id],
          });
        }
      }
      this.telemetry.emitEvent(EventTypes.EVOLUTION_ROLLBACK, "mind-runtime", {
        mindId: this.config.identity.id,
        genomeId: rolled.value.id,
        reason,
      });

      return Result.ok(rolled.value);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Durable evolution history (file store — survives process restarts).
  async getEvolutionHistory(opts?: { storeBaseDir?: string }): Promise<ExperimentRecord[]> {
    const paths = defaultStorePaths(this.config.identity.name, opts?.storeBaseDir);
    return readExperimentHistory(paths);
  }

  // Switches live execution to a genome's cognitive configuration.
  // Unknown/absent config resets to the deterministic default (raw).
  applyGenome(genome: Genome): void {
    const raw = genome.cognitionConfig?.deterministicFormat;
    const deterministicFormat = raw === "json" ? "json" : "raw";
    this.cognitionEngine.updateConfig({ deterministicFormat });
  }

  // Ensures a baseline genome exists (gen-0 snapshots live cognition config).
  private async ensureBaselineGenome(): Promise<Genome> {
    const mindId = this.config.identity.id;
    const latest = await this.genomeEngine.getLatestGenome(mindId);
    if (latest) return latest;

    const now = nowISO();
    const gen0: Genome = {
      id: generateId(),
      mindId,
      version: { major: 0, minor: 1, patch: 0 },
      baseModels: [],
      skills: [],
      tools: [],
      policies: [],
      routing: [],
      evaluators: [],
      cognitionConfig: { ...this.cognitionEngine.getConfig() },
      createdAt: now,
      updatedAt: now,
      lineage: [],
      evolutionHistory: [],
    };
    const put = await this.genomeEngine.putGenome(gen0, this.systemGenomeContext());
    if (!put.ok) throw put.error;
    return put.value;
  }

  // Genome operations act on the Mind's own genome at confidential level.
  private systemGenomeContext(): SecurityContext {
    const base = this.taskContext?.securityContext;
    return {
      userId: "system",
      sessionId: generateId(),
      permissions: base?.permissions ?? [],
      privacyLevel: "confidential",
      securityLevel: base?.securityLevel ?? "medium",
    } as SecurityContext;
  }

  // Builds an isolated sandbox: fresh storage-backed engines sharing only
  // stateless services. Production memory is untouched by construction.
  private spawnSandbox(cognitionConfig: Partial<CognitionConfig>): {
    cognition: CognitionEngine;
    taskContext: TaskContext;
  } {
    const sandboxStorage = createStorage();
    const telemetry = this.telemetry;
    const security = this.securityEngine;
    const memory = new MemoryEngine(this.config.memory, telemetry, sandboxStorage, security);
    const skills = new SkillEngine(this.config.skills, telemetry, sandboxStorage, security);
    const tools = new ToolEngine(this.config.tools, telemetry, sandboxStorage, security);
    const routing = new RoutingEngine(telemetry, security, this.policyEngine);
    const cognition = new CognitionEngine(
      { ...this.cognitionEngine.getConfig(), ...cognitionConfig },
      telemetry,
      memory,
      skills,
      tools,
      routing,
      this.runtimeManager,
      security,
      this.policyEngine
    );
    const live = this.taskContext as TaskContext;
    return {
      cognition,
      taskContext: {
        ...live,
        securityContext: { ...live.securityContext },
        availableModels: [],
        availableProviders: [],
      },
    };
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