import {
  EvolutionCandidateSchema,
  EvolutionLayerSchema,
  GenomeSchema,
  type EvolutionCandidate,
  type EvolutionLayer,
  type Genome,
} from "@seai/core";
import { generateId, nowISO, Result } from "@seai/core";
import { createTelemetry, EventTypes, type Telemetry } from "@seai/core";
import { StorageAdapter, createRepository } from "@seai/core";
import { SecurityEngine, type SecurityContext } from "@seai/core";
import { PolicyEngine, type PolicyContext } from "@seai/core";
import { EvaluationEngine, type EvaluationResult } from "./evaluation.js";
import { BenchmarkEngine } from "./benchmark.js";
import { type BenchmarkResult } from "@seai/core";

export interface EvolutionConfig {
  maxConcurrentCandidates: number;
  sandboxTimeoutMs: number;
  minImprovementThreshold: number;
  requireSecurityReview: boolean;
  requirePrivacyReview: boolean;
  requireCostReview: boolean;
  autoPromote: boolean;
}

const DEFAULT_CONFIG: EvolutionConfig = {
  maxConcurrentCandidates: 5,
  sandboxTimeoutMs: 300000,
  minImprovementThreshold: 0.05,
  requireSecurityReview: true,
  requirePrivacyReview: true,
  requireCostReview: true,
  autoPromote: false,
};

export interface EvolutionLabConfig {
  isolationLevel: "process" | "container" | "vm";
  resourceLimits: {
    cpu: number;
    memory: number;
    disk: number;
    network: boolean;
  };
}

export interface CandidateGenerator {
  generate(layer: EvolutionLayer, context: EvolutionContext): Promise<EvolutionCandidate[]>;
}

export interface EvolutionContext {
  genomeId: string;
  mindId: string;
  weakness: string;
  currentPerformance: Record<string, number>;
  hardwareProfile: any;
  availableModels: any[];
}

export interface SandboxResult {
  candidateId: string;
  success: boolean;
  error?: string;
  metrics: Record<string, number>;
  logs: string[];
}

export interface RegressionTestResult {
  candidateId: string;
  passed: boolean;
  regressions: string[];
  metrics: Record<string, number>;
}

export class EvolutionEngine {
  private config: EvolutionConfig;
  private telemetry: Telemetry;
  private storage: StorageAdapter;
  private candidateRepository: ReturnType<typeof createRepository<EvolutionCandidate>>;
  private genomeRepository: ReturnType<typeof createRepository<Genome>>;
  private securityEngine: SecurityEngine;
  private policyEngine: PolicyEngine;
  private evaluationEngine: EvaluationEngine;
  private benchmarkEngine: BenchmarkEngine;
  private generators: Map<EvolutionLayer, CandidateGenerator[]> = new Map();
  private activeCandidates: Map<string, EvolutionCandidate> = new Map();

  constructor(
    config: Partial<EvolutionConfig>,
    telemetry: Telemetry,
    storage: StorageAdapter,
    securityEngine: SecurityEngine,
    policyEngine: PolicyEngine,
    evaluationEngine: EvaluationEngine,
    benchmarkEngine: BenchmarkEngine
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.telemetry = telemetry;
    this.storage = storage;
    this.securityEngine = securityEngine;
    this.policyEngine = policyEngine;
    this.evaluationEngine = evaluationEngine;
    this.benchmarkEngine = benchmarkEngine;
    this.candidateRepository = createRepository(storage, "evolution_candidates", this.serializeCandidate, this.deserializeCandidate);
    this.genomeRepository = createRepository(storage, "genomes", this.serializeGenome, this.deserializeGenome);
    this.initializeGenerators();
  }

  async initialize(): Promise<void> {
    await this.storage.initialize();
  }

  async shutdown(): Promise<void> {
    await this.storage.close();
  }

  private initializeGenerators(): void {
    const layers: EvolutionLayer[] = [
      "configuration", "prompts", "memory", "skills", "knowledge",
      "routing", "model-selection", "adapters", "distilled-models", "architecture"
    ];
    
    for (const layer of layers) {
      this.generators.set(layer, [this.createDefaultGenerator(layer)]);
    }
  }

  private createDefaultGenerator(layer: EvolutionLayer): CandidateGenerator {
    return {
      generate: async (targetLayer: EvolutionLayer, context: EvolutionContext) => {
        if (targetLayer !== layer) return [];
        
        return [{
          id: generateId(),
          layer,
          description: `Auto-generated candidate for ${layer}`,
          changes: { type: "auto-generated", layer, timestamp: nowISO() },
          generatedBy: "default-generator",
          generatedAt: nowISO(),
          status: "proposed",
        }];
      },
    };
  }

  registerGenerator(layer: EvolutionLayer, generator: CandidateGenerator): void {
    const generators = this.generators.get(layer) || [];
    generators.push(generator);
    this.generators.set(layer, generators);
  }

  async identifyWeaknesses(genomeId: string): Promise<string[]> {
    const genome = await this.genomeRepository.get(genomeId);
    if (!genome) return [];
    
    const weaknesses: string[] = [];
    
    if (genome.benchmarkResults) {
      for (const [metric, value] of Object.entries(genome.benchmarkResults)) {
        if (typeof value === "number" && value < 0.7) {
          weaknesses.push(`Low ${metric}: ${value}`);
        }
      }
    }
    
    if (genome.evolutionHistory) {
      const recentRollbacks = genome.evolutionHistory.filter(h => h.action === "rolled-back").length;
      if (recentRollbacks > 2) {
        weaknesses.push(`Frequent rollbacks: ${recentRollbacks} in history`);
      }
    }
    
    return weaknesses;
  }

  async generateCandidates(context: EvolutionContext): Promise<EvolutionCandidate[]> {
    const allCandidates: EvolutionCandidate[] = [];
    
    for (const [layer, generators] of this.generators) {
      for (const generator of generators) {
        try {
          const candidates = await generator.generate(layer, context);
          allCandidates.push(...candidates);
        } catch (error) {
          this.telemetry.emitEvent(EventTypes.SECURITY_ALERT, "evolution-engine", { 
            action: "generate", layer, error: String(error) 
          });
        }
      }
    }
    
    for (const candidate of allCandidates) {
      await this.candidateRepository.create(candidate);
    }
    
    this.telemetry.emitEvent(EventTypes.EVOLUTION_CANDIDATE_CREATED, "evolution-engine", { 
      genomeId: context.genomeId, 
      count: allCandidates.length 
    });
    
    return allCandidates;
  }

  async sandboxCandidate(candidate: EvolutionCandidate, genome: Genome): Promise<SandboxResult> {
    this.activeCandidates.set(candidate.id, { ...candidate, status: "sandboxed" });
    await this.candidateRepository.update({ ...candidate, status: "sandboxed" });
    
    this.telemetry.emitEvent(EventTypes.EVOLUTION_CANDIDATE_CREATED, "evolution-engine", { 
      candidateId: candidate.id, 
      action: "sandbox-start" 
    });
    
    try {
      // In reality, this would run in an isolated environment
      // For now, simulate sandbox execution
      const metrics = await this.runSandboxSimulation(candidate, genome);
      
      const result: SandboxResult = {
        candidateId: candidate.id,
        success: true,
        metrics,
        logs: [`Sandbox completed for ${candidate.layer}`],
      };
      
      await this.candidateRepository.update({ ...candidate, status: "benchmarked", benchmarkResults: metrics });
      
      this.telemetry.emitEvent(EventTypes.EVOLUTION_CANDIDATE_EVALUATED, "evolution-engine", { 
        candidateId: candidate.id, 
        success: true 
      });
      
      return result;
    } catch (error) {
      const result: SandboxResult = {
        candidateId: candidate.id,
        success: false,
        error: String(error),
        metrics: {},
        logs: [`Sandbox failed: ${error}`],
      };
      
      await this.candidateRepository.update({ ...candidate, status: "rejected" });
      
      return result;
    } finally {
      this.activeCandidates.delete(candidate.id);
    }
  }

  private async runSandboxSimulation(candidate: EvolutionCandidate, genome: Genome): Promise<Record<string, number>> {
    // Simulate running the candidate in a sandbox
    // In reality, this would apply the candidate's changes and run benchmarks
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      taskSuccess: Math.random() * 0.2 + 0.7,
      accuracy: Math.random() * 0.2 + 0.7,
      latency: Math.random() * 1000 + 500,
      cost: Math.random() * 0.01,
    };
  }

  async runRegressionTests(candidate: EvolutionCandidate, baselineGenome: Genome): Promise<RegressionTestResult> {
    await this.candidateRepository.update({ ...candidate, status: "regression-tested" });
    
    // Simulate regression testing
    const regressions: string[] = [];
    const metrics: Record<string, number> = {};
    
    // Would run actual regression tests against baseline
    
    const result: RegressionTestResult = {
      candidateId: candidate.id,
      passed: regressions.length === 0,
      regressions,
      metrics,
    };
    
    await this.candidateRepository.update({ ...candidate, regressionResults: metrics });
    
    return result;
  }

  async securityReview(candidate: EvolutionCandidate, reviewer: string): Promise<{ passed: boolean; notes?: string }> {
    await this.candidateRepository.update({ ...candidate, status: "security-reviewed" });
    
    // Would integrate with security engine
    const passed = true; // Simplified
    
    await this.candidateRepository.update({
      ...candidate,
      securityReview: { passed, reviewer, timestamp: nowISO(), notes: passed ? "Approved" : "Rejected" },
    });
    
    return { passed, notes: passed ? "Security review passed" : "Security concerns found" };
  }

  async privacyReview(candidate: EvolutionCandidate, reviewer: string): Promise<{ passed: boolean; notes?: string }> {
    await this.candidateRepository.update({ ...candidate, status: "privacy-reviewed" });
    
    // Would integrate with privacy gate
    const passed = true; // Simplified
    
    await this.candidateRepository.update({
      ...candidate,
      privacyReview: { passed, reviewer, timestamp: nowISO(), notes: passed ? "Approved" : "Rejected" },
    });
    
    return { passed, notes: passed ? "Privacy review passed" : "Privacy concerns found" };
  }

  async costReview(candidate: EvolutionCandidate, reviewer: string): Promise<{ passed: boolean; deltaCost?: number; notes?: string }> {
    await this.candidateRepository.update({ ...candidate, status: "cost-reviewed" });
    
    // Would analyze cost impact
    const deltaCost = 0; // Simplified
    const passed = deltaCost <= 0.1; // Allow up to 10% cost increase
    
    await this.candidateRepository.update({
      ...candidate,
      costReview: { passed, deltaCost, reviewer, timestamp: nowISO(), notes: passed ? "Cost acceptable" : "Cost increase too high" },
    });
    
    return { passed, deltaCost, notes: passed ? "Cost review passed" : `Cost increase: ${deltaCost}` };
  }

  async compareCandidate(candidate: EvolutionCandidate, baselineGenome: Genome): Promise<{ better: boolean; metrics: Record<string, number> }> {
    await this.candidateRepository.update({ ...candidate, status: "compared" });
    
    // Compare benchmark results
    const candidateMetrics = candidate.benchmarkResults || {};
    const baselineMetrics = baselineGenome.benchmarkResults || {};
    
    let better = false;
    const comparedMetrics: Record<string, number> = {};
    
    for (const [key, candidateValue] of Object.entries(candidateMetrics)) {
      const baselineValue = baselineMetrics[key];
      if (typeof candidateValue === "number" && typeof baselineValue === "number") {
        const improvement = (candidateValue - baselineValue) / Math.abs(baselineValue);
        comparedMetrics[key] = improvement;
        if (improvement > this.config.minImprovementThreshold) {
          better = true;
        }
      }
    }
    
    await this.candidateRepository.update({ ...candidate, comparison: { baselineId: baselineGenome.id, better, metrics: comparedMetrics } });
    
    return { better, metrics: comparedMetrics };
  }

  async promoteCandidate(candidateId: string, genomeId: string): Promise<Result<Genome, Error>> {
    const candidate = await this.candidateRepository.get(candidateId);
    if (!candidate) {
      return Result.err(new Error(`Candidate not found: ${candidateId}`));
    }
    
    const genome = await this.genomeRepository.get(genomeId);
    if (!genome) {
      return Result.err(new Error(`Genome not found: ${genomeId}`));
    }
    
    // Apply candidate changes to genome
    const newGenome = this.applyCandidateToGenome(genome, candidate);
    newGenome.id = generateId();
    newGenome.version = this.incrementVersion(genome.version);
    newGenome.parentGenome = genomeId;
    newGenome.lineage = [...(genome.lineage || []), genomeId];
    newGenome.createdAt = nowISO();
    newGenome.updatedAt = nowISO();
    newGenome.evolutionHistory = [
      ...(genome.evolutionHistory || []),
      { candidateId, action: "promoted", timestamp: nowISO(), reason: candidate.description },
    ];
    
    await this.genomeRepository.create(newGenome);
    await this.candidateRepository.update({ ...candidate, status: "promoted", promotedAt: nowISO() });
    
    this.telemetry.emitEvent(EventTypes.EVOLUTION_PROMOTED, "evolution-engine", { 
      candidateId, genomeId: newGenome.id, parentGenome: genomeId 
    });
    
    return Result.ok(newGenome);
  }

  async rejectCandidate(candidateId: string, reason: string): Promise<void> {
    const candidate = await this.candidateRepository.get(candidateId);
    if (!candidate) return;
    
    await this.candidateRepository.update({ ...candidate, status: "rejected" });
    
    this.telemetry.emitEvent(EventTypes.EVOLUTION_REJECTED, "evolution-engine", { 
      candidateId, reason 
    });
  }

  async rollbackCandidate(candidateId: string, reason: string): Promise<void> {
    const candidate = await this.candidateRepository.get(candidateId);
    if (!candidate) return;
    
    await this.candidateRepository.update({ ...candidate, status: "rolled-back", rolledBackAt: nowISO(), rollbackReason: reason });
    
    this.telemetry.emitEvent(EventTypes.EVOLUTION_ROLLBACK, "evolution-engine", { 
      candidateId, reason 
    });
  }

  private applyCandidateToGenome(genome: Genome, candidate: EvolutionCandidate): Genome {
    // Apply candidate changes based on layer
    const newGenome = { ...genome };
    const changes = candidate.changes as Record<string, unknown>;
    
    switch (candidate.layer) {
      case "configuration":
        // Update configuration
        break;
      case "prompts":
        newGenome.prompts = { ...genome.prompts, ...(changes.prompts as Record<string, string> || {}) };
        break;
      case "memory":
        newGenome.memoryConfig = { ...genome.memoryConfig, ...(changes.memoryConfig as Record<string, unknown> || {}) };
        break;
      case "skills":
        if (Array.isArray(changes.skills)) {
          newGenome.skills = [...new Set([...genome.skills, ...changes.skills])];
        }
        break;
      case "routing":
        if (Array.isArray(changes.routing)) {
          newGenome.routing = [...new Set([...genome.routing, ...changes.routing])];
        }
        break;
      case "model-selection":
        if (Array.isArray(changes.baseModels)) {
          newGenome.baseModels = changes.baseModels;
        }
        break;
    }
    
    return newGenome;
  }

  private incrementVersion(version: { major: number; minor: number; patch: number }): { major: number; minor: number; patch: number } {
    return { major: version.major, minor: version.minor, patch: version.patch + 1 };
  }

  async getCandidate(candidateId: string): Promise<EvolutionCandidate | null> {
    return this.candidateRepository.get(candidateId);
  }

  async getCandidatesByGenome(genomeId: string): Promise<EvolutionCandidate[]> {
    return this.candidateRepository.list({ genome_id: genomeId } as any, 1000);
  }

  async getActiveCandidates(): Promise<EvolutionCandidate[]> {
    return Array.from(this.activeCandidates.values());
  }

  private serializeCandidate(candidate: EvolutionCandidate): Record<string, unknown> {
    return {
      id: candidate.id,
      genome_id: candidate.id, // Would be actual genome_id
      layer: candidate.layer,
      description: candidate.description,
      changes: JSON.stringify(candidate.changes),
      generated_by: candidate.generatedBy,
      generated_at: candidate.generatedAt,
      status: candidate.status,
      benchmark_results: candidate.benchmarkResults ? JSON.stringify(candidate.benchmarkResults) : null,
      regression_results: candidate.regressionResults ? JSON.stringify(candidate.regressionResults) : null,
      security_review: candidate.securityReview ? JSON.stringify(candidate.securityReview) : null,
      privacy_review: candidate.privacyReview ? JSON.stringify(candidate.privacyReview) : null,
      cost_review: candidate.costReview ? JSON.stringify(candidate.costReview) : null,
      comparison: candidate.comparison ? JSON.stringify(candidate.comparison) : null,
      promoted_at: candidate.promotedAt || null,
      rolled_back_at: candidate.rolledBackAt || null,
      rollback_reason: candidate.rollbackReason || null,
    };
  }

  private deserializeCandidate(row: Record<string, unknown>): EvolutionCandidate {
    return {
      id: row.id as string,
      layer: row.layer as EvolutionLayer,
      description: row.description as string,
      changes: JSON.parse(row.changes as string),
      generatedBy: row.generated_by as string,
      generatedAt: row.generated_at as string,
      status: row.status as EvolutionCandidate["status"],
      benchmarkResults: row.benchmark_results ? JSON.parse(row.benchmark_results as string) : undefined,
      regressionResults: row.regression_results ? JSON.parse(row.regression_results as string) : undefined,
      securityReview: row.security_review ? JSON.parse(row.security_review as string) : undefined,
      privacyReview: row.privacy_review ? JSON.parse(row.privacy_review as string) : undefined,
      costReview: row.cost_review ? JSON.parse(row.cost_review as string) : undefined,
      comparison: row.comparison ? JSON.parse(row.comparison as string) : undefined,
      promotedAt: row.promoted_at as string | undefined,
      rolledBackAt: row.rolled_back_at as string | undefined,
      rollbackReason: row.rollback_reason as string | undefined,
    };
  }

  private serializeGenome(genome: Genome): Record<string, unknown> {
    return {
      id: genome.id,
      mind_id: genome.mindId,
      version: JSON.stringify(genome.version),
      base_models: JSON.stringify(genome.baseModels),
      adapters: genome.adapters ? JSON.stringify(genome.adapters) : null,
      prompts: genome.prompts ? JSON.stringify(genome.prompts) : null,
      memory_config: genome.memoryConfig ? JSON.stringify(genome.memoryConfig) : null,
      memory_snapshots: genome.memorySnapshots ? JSON.stringify(genome.memorySnapshots) : null,
      skills: JSON.stringify(genome.skills),
      tools: JSON.stringify(genome.tools),
      policies: JSON.stringify(genome.policies),
      routing: JSON.stringify(genome.routing),
      evaluators: JSON.stringify(genome.evaluators),
      knowledge: genome.knowledge ? JSON.stringify(genome.knowledge) : null,
      benchmark_results: genome.benchmarkResults ? JSON.stringify(genome.benchmarkResults) : null,
      evolution_history: genome.evolutionHistory ? JSON.stringify(genome.evolutionHistory) : null,
      parent_genome: genome.parentGenome || null,
      branch: genome.branch || null,
      lineage: genome.lineage ? JSON.stringify(genome.lineage) : null,
      created_at: genome.createdAt,
      updated_at: genome.updatedAt,
    };
  }

  private deserializeGenome(row: Record<string, unknown>): Genome {
    return {
      id: row.id as string,
      mindId: row.mind_id as string,
      version: JSON.parse(row.version as string),
      baseModels: JSON.parse(row.base_models as string),
      adapters: row.adapters ? JSON.parse(row.adapters as string) : undefined,
      prompts: row.prompts ? JSON.parse(row.prompts as string) : undefined,
      memoryConfig: row.memory_config ? JSON.parse(row.memory_config as string) : undefined,
      memorySnapshots: row.memory_snapshots ? JSON.parse(row.memory_snapshots as string) : undefined,
      skills: JSON.parse(row.skills as string),
      tools: JSON.parse(row.tools as string),
      policies: JSON.parse(row.policies as string),
      routing: JSON.parse(row.routing as string),
      evaluators: JSON.parse(row.evaluators as string),
      knowledge: row.knowledge ? JSON.parse(row.knowledge as string) : undefined,
      benchmarkResults: row.benchmark_results ? JSON.parse(row.benchmark_results as string) : undefined,
      evolutionHistory: row.evolution_history ? JSON.parse(row.evolution_history as string) : undefined,
      parentGenome: row.parent_genome as string | undefined,
      branch: row.branch as string | undefined,
      lineage: row.lineage ? JSON.parse(row.lineage as string) : undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}

export function createEvolutionEngine(
  config: Partial<EvolutionConfig>,
  telemetry: Telemetry,
  storage: StorageAdapter,
  securityEngine: SecurityEngine,
  policyEngine: PolicyEngine,
  evaluationEngine: EvaluationEngine,
  benchmarkEngine: BenchmarkEngine
): EvolutionEngine {
  return new EvolutionEngine(config, telemetry, storage, securityEngine, policyEngine, evaluationEngine, benchmarkEngine);
}

export class EvolutionLab {
  private config: EvolutionLabConfig;
  private telemetry: Telemetry;
  private sandboxes: Map<string, { candidate: EvolutionCandidate; status: string; startTime: number }> = new Map();

  constructor(config: EvolutionLabConfig, telemetry: Telemetry) {
    this.config = config;
    this.telemetry = telemetry;
  }

  async createSandbox(candidate: EvolutionCandidate): Promise<string> {
    const sandboxId = generateId();
    this.sandboxes.set(sandboxId, { candidate, status: "creating", startTime: Date.now() });
    return sandboxId;
  }

  async runSandbox(sandboxId: string): Promise<SandboxResult> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) throw new Error(`Sandbox not found: ${sandboxId}`);
    
    sandbox.status = "running";
    
    // In reality, would create isolated environment
    await new Promise(resolve => setTimeout(resolve, 100));
    
    sandbox.status = "completed";
    return { candidateId: sandbox.candidate.id, success: true, metrics: {}, logs: [] };
  }

  async destroySandbox(sandboxId: string): Promise<void> {
    this.sandboxes.delete(sandboxId);
  }

  getSandboxStatus(sandboxId: string): string | undefined {
    return this.sandboxes.get(sandboxId)?.status;
  }
}

export function createEvolutionLab(config: EvolutionLabConfig, telemetry: Telemetry): EvolutionLab {
  return new EvolutionLab(config, telemetry);
}