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
import { MindRuntime, createMindRuntime, MindConfig, MindTemplate, DEFAULT_MIND_TEMPLATE, detectAndCreateMind } from "@seai/mind";
import { IdentitySchema, VersionSchema, HardwareProfileSchema, type Identity, type Version, type HardwareProfile } from "@seai/core";
import { generateId, nowISO } from "@seai/core";
import { createTelemetry, type Telemetry } from "@seai/core";
import { detectHardware } from "@seai/core";

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

  async evolve(weakness: string): Promise<unknown> {
    if (!this.mind) throw new Error("Client not initialized");
    const result = await this.mind.evolve(weakness);
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
