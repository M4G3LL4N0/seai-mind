// Re-export core (includes kernel, schemas, telemetry, security, policy, storage, hardware)
export * from "@seai/core";

// Re-export runtime (includes models, providers, routing, adapters)
export * from "@seai/runtime";

// Re-export state (includes memory, skills, tools, genome)
// Note: Tool from state conflicts with Tool from core/schemas
// We export state but alias the conflicting type
export {
  MemoryEngine,
  createMemoryEngine,
  memoryEngine,
  SkillEngine,
  createSkillEngine,
  skillEngine,
  registerBuiltinSkills,
  ToolEngine,
  createToolEngine,
  toolEngine,
  GenomeEngine,
  createGenomeEngine,
  genomeEngine,
  type MemoryConfig,
  type MemoryQuery,
  type MemoryStats,
  type ConsolidationResult,
  type MemorySnapshot,
  type SkillConfig,
  type SkillExecutionContext,
  type SkillExecutionResult,
  type SkillValidationResult,
  type SkillTemplate,
  type ToolConfig,
  type ToolExecutionContext,
  type ToolExecutionResult,
  type ToolCapability,
  type GenomeConfig,
  type GenomeDiff,
  type GenomeBranch,
  type GenomeVersion,
} from "@seai/state";

// Re-export mind (includes mind, cognition, compiler, evaluation, evolution, benchmark)
export * from "@seai/mind";

// Import for SDK-specific exports
import { MindRuntime, createMindRuntime, MindConfig, MindTemplate, DEFAULT_MIND_TEMPLATE, detectAndCreateMind, defaultStorePaths, getActiveGenome, loadGenomeSnapshot, EXPERIMENT_SUITES } from "@seai/mind";
import { IdentitySchema, VersionSchema, HardwareProfileSchema, type Identity, type Version, type HardwareProfile } from "@seai/core";
import { generateId, nowISO } from "@seai/core";
import { createTelemetry, type Telemetry } from "@seai/core";
import { detectHardware } from "@seai/core";
import { discoverLocalRuntimes } from "@seai/runtime";

export interface SEAIClientConfig {
  mindName: string;
  generation: string;
  codename: string;
  template?: MindTemplate;
  autoInitialize?: boolean;
}

export class SEAIClient {
  private mind: MindRuntime | null = null;
  private config: SEAIClientConfig;
  private telemetry: Telemetry;
  private initialized = false;

  constructor(config: SEAIClientConfig) {
    this.config = config;
    this.telemetry = createTelemetry();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const result = await detectAndCreateMind(
      this.config.mindName,
      this.config.generation,
      this.config.codename,
      this.config.template || DEFAULT_MIND_TEMPLATE
    );

    if (!result.ok) {
      throw result.error;
    }

    this.mind = result.value;
    this.initialized = true;
  }

  async shutdown(): Promise<void> {
    if (this.mind) {
      await this.mind.shutdown();
      this.mind = null;
      this.initialized = false;
    }
  }

  // Composition-root bootstrap: discovers locally reachable execution
  // runtimes (today: a local Ollama server) and registers them on the Mind.
  // Explicit and best-effort — never throws. Without it the Mind has no
  // model path and fails honestly; with it, `runTask` can reach real models.
  // Returns what was found so callers can report it.
  async enableLocalRuntimes(options?: { ollamaBaseUrl?: string; timeoutMs?: number }): Promise<{
    runtimes: string[];
    models: number;
  }> {
    if (!this.mind) throw new Error("Client not initialized");
    const found = await discoverLocalRuntimes(options);
    for (const runtime of found) {
      await this.mind.registerRuntime(runtime);
    }
    const models = found.length > 0 ? await this.mind.getRuntimeManager().discoverAllModels() : [];
    return { runtimes: found.map((r) => r.name), models: models.length };
  }

  getMindRuntime(): MindRuntime | null {
    return this.mind;
  }

  // Boots the Mind from its last promoted genome (if any): subsequent
  // executions use the promoted version without re-running experiments.
  // Best-effort — returns applied:false when no durable state exists yet.
  async applyActiveGenome(): Promise<{ applied: boolean; genomeId?: string }> {
    if (!this.mind) throw new Error("Client not initialized");
    const paths = defaultStorePaths(this.config.mindName);
    const active = await getActiveGenome(paths);
    if (!active) return { applied: false };
    const genome = await loadGenomeSnapshot(paths, active.genomeId);
    if (!genome) return { applied: false };
    this.mind.applyGenome(genome);
    return { applied: true, genomeId: genome.id };
  }

  async runTask(type: string, input: unknown, options?: {
    priority?: number;
    privacy?: string;
    qualityTarget?: number;
    latencyBudgetMs?: number;
    costBudget?: number;
  }): Promise<unknown> {
    if (!this.mind) throw new Error("Client not initialized");

    const result = await this.mind.runTask({
      type,
      input,
      qualityTarget: options?.qualityTarget,
      latencyBudgetMs: options?.latencyBudgetMs,
      costBudget: options?.costBudget,
    });

    if (!result.ok) throw result.error;
    return result.value;
  }

  async compileGoal(goal: string): Promise<unknown> {
    if (!this.mind) throw new Error("Client not initialized");
    const result = await this.mind.compileGoal(goal);
    if (!result.ok) throw result.error;
    return result.value;
  }

  async evolve(
    weakness: string,
    opts?: {
      suiteId?: string;
      candidates?: string[];
      enableModels?: boolean;
      repeatRuns?: number;
      gateThresholds?: {
        minQualityImprovement?: number;
        maxCategoryRegression?: number;
        varianceSignalToNoise?: number;
      };
    }
  ): Promise<unknown> {
    if (!this.mind) throw new Error("Client not initialized");
    if (opts?.enableModels) {
      await this.enableLocalRuntimes();
    }
    const registration = opts?.suiteId
      ? EXPERIMENT_SUITES[opts.suiteId]
      : undefined;
    if (opts?.suiteId && !registration) {
      throw new Error(
        `Unknown suite "${opts.suiteId}" (known: ${Object.keys(EXPERIMENT_SUITES).join(", ")})`
      );
    }
    const specs = opts?.candidates?.map((name) => {
      const all = Object.values(EXPERIMENT_SUITES).flatMap((r) => r.candidates);
      const spec = all.find((s) => s.name === name);
      if (!spec) {
        throw new Error(
          `Unknown candidate "${name}" (known: ${all.map((s) => s.name).join(", ")})`
        );
      }
      return spec;
    });
    const result = await this.mind.evolve(weakness, {
      suite: registration?.suite,
      criterion: registration?.criterion,
      candidates: specs ?? registration?.candidates,
      repeatRuns: opts?.repeatRuns,
      gateThresholds: opts?.gateThresholds,
    });
    if (!result.ok) throw result.error;
    return result.value;
  }

  async benchmark(name: string): Promise<unknown> {
    if (!this.mind) throw new Error("Client not initialized");
    const result = await this.mind.benchmark(name);
    if (!result.ok) throw result.error;
    return result.value;
  }

  getState(): unknown {
    if (!this.mind) return { status: "not-initialized" };
    return this.mind.getState();
  }

  getTelemetry(): Telemetry {
    return this.telemetry;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export function createClient(config: SEAIClientConfig): SEAIClient {
  return new SEAIClient(config);
}

export interface QuickStartOptions {
  mindName: string;
  generation?: string;
  codename?: string;
  goal?: string;
}

export async function quickStart(options: QuickStartOptions): Promise<{ client: SEAIClient; result?: unknown }> {
  const generation = options.generation || "Darwin";
  const codename = options.codename || "Darwin 0.1";
  
  const client = createClient({
    mindName: options.mindName,
    generation,
    codename,
    autoInitialize: true,
  });

  await client.initialize();
  await client.enableLocalRuntimes();

  let result;
  if (options.goal) {
    result = await client.runTask("general", options.goal);
  }

  return { client, result };
}

export const SEAI = {
  createClient,
  quickStart,
  detectHardware,
  IdentitySchema,
  VersionSchema,
  HardwareProfileSchema,
  generateId,
  nowISO,
};

export default SEAI;
