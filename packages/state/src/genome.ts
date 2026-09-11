import {
  GenomeSchema,
  type Genome,
  VersionSchema,
  type Version,
} from "@seai/core";
import { generateId, nowISO, Result } from "@seai/core";
import { createTelemetry, EventTypes, type Telemetry } from "@seai/core";
import { StorageAdapter, createRepository, storage } from "@seai/core";
import { SecurityEngine, type SecurityContext } from "@seai/core";

export interface GenomeConfig {
  maxGenomesPerMind: number;
  autoSnapshot: boolean;
  snapshotIntervalMs: number;
}

const DEFAULT_CONFIG: GenomeConfig = {
  maxGenomesPerMind: 100,
  autoSnapshot: true,
  snapshotIntervalMs: 3600000,
};

export interface GenomeDiff {
  genomeA: string;
  genomeB: string;
  additions: string[];
  deletions: string[];
  modifications: Array<{ field: string; oldValue: unknown; newValue: unknown }>;
}

export interface GenomeBranch {
  id: string;
  name: string;
  baseGenomeId: string;
  description: string;
  createdAt: string;
  genomes: string[];
}

export class GenomeEngine {
  private config: GenomeConfig;
  private telemetry: Telemetry;
  private storage: StorageAdapter;
  private repository: ReturnType<typeof createRepository<Genome>>;
  private securityEngine: SecurityEngine;
  private branches: Map<string, GenomeBranch> = new Map();
  private snapshotTimer: NodeJS.Timeout | null = null;

  constructor(
    config: Partial<GenomeConfig>,
    telemetry: Telemetry,
    storage: StorageAdapter,
    securityEngine: SecurityEngine
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.telemetry = telemetry;
    this.storage = storage;
    this.securityEngine = securityEngine;
    this.repository = createRepository(storage, "genomes", this.serialize, this.deserialize);
  }

  async initialize(): Promise<void> {
    await this.storage.initialize();
    if (this.config.autoSnapshot) {
      this.startSnapshotTimer();
    }
  }

  async shutdown(): Promise<void> {
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
      this.snapshotTimer = null;
    }
    await this.storage.close();
  }

  private startSnapshotTimer(): void {
    this.snapshotTimer = setInterval(async () => {
      // Auto-snapshot logic would go here
    }, this.config.snapshotIntervalMs);
    this.snapshotTimer.unref();
  }

  async createGenome(
    mindId: string,
    baseGenome: Omit<Genome, "id" | "version" | "createdAt" | "updatedAt" | "evolutionHistory" | "lineage">,
    context: SecurityContext
  ): Promise<Result<Genome, Error>> {
    const privacyCheck = this.securityEngine.checkPrivacy(context, "confidential");
    if (!privacyCheck) {
      return Result.err(new Error("Privacy level insufficient for genome creation"));
    }

    const count = await this.repository.count({ mind_id: mindId } as any);
    if (count >= this.config.maxGenomesPerMind) {
      return Result.err(new Error(`Maximum genomes per mind reached: ${this.config.maxGenomesPerMind}`));
    }

    const genome: Genome = {
      ...baseGenome,
      id: generateId(),
      mindId,
      version: { major: 1, minor: 0, patch: 0 },
      evolutionHistory: [],
      lineage: [],
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };

    const validated = GenomeSchema.parse(genome);
    await this.repository.create(validated);

    this.telemetry.emitEvent(EventTypes.TASK_CREATED, "genome-engine", { 
      genomeId: validated.id, 
      mindId, 
      action: "create" 
    });

    return Result.ok(validated);
  }

  async getGenome(genomeId: string): Promise<Genome | null> {
    return this.repository.get(genomeId);
  }

  async getGenomesByMind(mindId: string): Promise<Genome[]> {
    return this.repository.list({ mind_id: mindId } as any, 1000);
  }

  async getLatestGenome(mindId: string): Promise<Genome | null> {
    const genomes = await this.getGenomesByMind(mindId);
    if (genomes.length === 0) return null;
    return genomes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }

  async updateGenome(
    genomeId: string,
    updates: Partial<Genome>,
    context: SecurityContext
  ): Promise<Result<Genome, Error>> {
    const existing = await this.repository.get(genomeId);
    if (!existing) {
      return Result.err(new Error(`Genome not found: ${genomeId}`));
    }
    
    const privacyCheck = this.securityEngine.checkPrivacy(context, "confidential");
    if (!privacyCheck) {
      return Result.err(new Error("Privacy level insufficient for genome update"));
    }

    const updated: Genome = {
      ...existing,
      ...updates,
      id: existing.id,
      version: this.incrementVersion(existing.version),
      updatedAt: nowISO(),
    };

    const validated = GenomeSchema.parse(updated);
    await this.repository.update(validated);

    this.telemetry.emitEvent(EventTypes.TASK_CREATED, "genome-engine", { 
      genomeId: validated.id, 
      action: "update" 
    });

    return Result.ok(validated);
  }

  async deleteGenome(genomeId: string, context: SecurityContext): Promise<Result<boolean, Error>> {
    const existing = await this.repository.get(genomeId);
    if (!existing) {
      return Result.err(new Error(`Genome not found: ${genomeId}`));
    }
    
    const privacyCheck = this.securityEngine.checkPrivacy(context, "confidential");
    if (!privacyCheck) {
      return Result.err(new Error("Privacy level insufficient for genome deletion"));
    }

    await this.repository.delete(genomeId);

    this.telemetry.emitEvent(EventTypes.TASK_CREATED, "genome-engine", { 
      genomeId, 
      action: "delete" 
    });

    return Result.ok(true);
  }

  async createBranch(
    baseGenomeId: string,
    name: string,
    description: string,
    context: SecurityContext
  ): Promise<Result<GenomeBranch, Error>> {
    const baseGenome = await this.repository.get(baseGenomeId);
    if (!baseGenome) {
      return Result.err(new Error(`Base genome not found: ${baseGenomeId}`));
    }
    
    const privacyCheck = this.securityEngine.checkPrivacy(context, "confidential");
    if (!privacyCheck) {
      return Result.err(new Error("Privacy level insufficient for branch creation"));
    }

    const branch: GenomeBranch = {
      id: generateId(),
      name,
      baseGenomeId,
      description,
      createdAt: nowISO(),
      genomes: [baseGenomeId],
    };

    this.branches.set(branch.id, branch);

    this.telemetry.emitEvent(EventTypes.TASK_CREATED, "genome-engine", { 
      branchId: branch.id, 
      baseGenomeId, 
      action: "branch" 
    });

    return Result.ok(branch);
  }

  async getBranch(branchId: string): Promise<GenomeBranch | undefined> {
    return this.branches.get(branchId);
  }

  async listBranches(): Promise<GenomeBranch[]> {
    return Array.from(this.branches.values());
  }

  async commitToBranch(branchId: string, genomeId: string): Promise<Result<GenomeBranch, Error>> {
    const branch = this.branches.get(branchId);
    if (!branch) {
      return Result.err(new Error(`Branch not found: ${branchId}`));
    }

    const genome = await this.repository.get(genomeId);
    if (!genome) {
      return Result.err(new Error(`Genome not found: ${genomeId}`));
    }

    if (!branch.genomes.includes(genomeId)) {
      branch.genomes.push(genomeId);
    }

    return Result.ok(branch);
  }

  async diffGenomes(genomeAId: string, genomeBId: string): Promise<Result<GenomeDiff, Error>> {
    const genomeA = await this.repository.get(genomeAId);
    const genomeB = await this.repository.get(genomeBId);
    
    if (!genomeA || !genomeB) {
      return Result.err(new Error("One or both genomes not found"));
    }

    const diff: GenomeDiff = {
      genomeA: genomeAId,
      genomeB: genomeBId,
      additions: [],
      deletions: [],
      modifications: [],
    };

    // Compare base models
    const modelsA = new Set(genomeA.baseModels.map(m => m.modelId));
    const modelsB = new Set(genomeB.baseModels.map(m => m.modelId));
    
    for (const model of modelsB) {
      if (!modelsA.has(model)) diff.additions.push(`baseModel: ${model}`);
    }
    for (const model of modelsA) {
      if (!modelsB.has(model)) diff.deletions.push(`baseModel: ${model}`);
    }

    // Compare skills
    const skillsA = new Set(genomeA.skills);
    const skillsB = new Set(genomeB.skills);
    
    for (const skill of skillsB) {
      if (!skillsA.has(skill)) diff.additions.push(`skill: ${skill}`);
    }
    for (const skill of skillsA) {
      if (!skillsB.has(skill)) diff.deletions.push(`skill: ${skill}`);
    }

    // Compare tools
    const toolsA = new Set(genomeA.tools);
    const toolsB = new Set(genomeB.tools);
    
    for (const tool of toolsB) {
      if (!toolsA.has(tool)) diff.additions.push(`tool: ${tool}`);
    }
    for (const tool of toolsA) {
      if (!toolsB.has(tool)) diff.deletions.push(`tool: ${tool}`);
    }

    // Compare other fields
    const fields: (keyof Genome)[] = [
      "prompts", "memoryConfig", "policies", "routing", "evaluators", "knowledge"
    ];
    
    for (const field of fields) {
      const valA = JSON.stringify(genomeA[field]);
      const valB = JSON.stringify(genomeB[field]);
      if (valA !== valB) {
        diff.modifications.push({ field, oldValue: genomeA[field], newValue: genomeB[field] });
      }
    }

    return Result.ok(diff);
  }

  async reproduceGenome(genomeId: string, context: SecurityContext): Promise<Result<Genome, Error>> {
    const genome = await this.repository.get(genomeId);
    if (!genome) {
      return Result.err(new Error(`Genome not found: ${genomeId}`));
    }
    
    const privacyCheck = this.securityEngine.checkPrivacy(context, "confidential");
    if (!privacyCheck) {
      return Result.err(new Error("Privacy level insufficient for genome reproduction"));
    }

    // Create a new genome with the same configuration but new ID and version
    const reproduced: Genome = {
      ...genome,
      id: generateId(),
      version: { major: genome.version.major, minor: genome.version.minor, patch: genome.version.patch + 1 },
      parentGenome: genomeId,
      lineage: [...(genome.lineage || []), genomeId],
      branch: genome.branch,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      evolutionHistory: [],
    };

    const validated = GenomeSchema.parse(reproduced);
    await this.repository.create(validated);

    this.telemetry.emitEvent(EventTypes.TASK_CREATED, "genome-engine", { 
      genomeId: validated.id, 
      parentGenome: genomeId, 
      action: "reproduce" 
    });

    return Result.ok(validated);
  }

  async rollbackGenome(genomeId: string, targetVersion: Version, context: SecurityContext): Promise<Result<Genome, Error>> {
    const genome = await this.repository.get(genomeId);
    if (!genome) {
      return Result.err(new Error(`Genome not found: ${genomeId}`));
    }
    
    const privacyCheck = this.securityEngine.checkPrivacy(context, "confidential");
    if (!privacyCheck) {
      return Result.err(new Error("Privacy level insufficient for genome rollback"));
    }

    // Find genome in lineage with target version
    const lineageGenomes = await Promise.all(
      (genome.lineage || []).map(id => this.repository.get(id))
    );
    
    const targetGenome = lineageGenomes.find(g => g && this.versionEquals(g.version, targetVersion));
    if (!targetGenome) {
      return Result.err(new Error(`Target version not found in lineage`));
    }

    // Create new genome based on target
    const rolledBack: Genome = {
      ...targetGenome,
      id: generateId(),
      version: this.incrementVersion(genome.version),
      parentGenome: genomeId,
      lineage: [...(genome.lineage || []), genomeId],
      branch: genome.branch,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      evolutionHistory: [
        ...(genome.evolutionHistory || []),
        { candidateId: "", action: "rolled-back", timestamp: nowISO(), reason: `Rolled back to version ${targetVersion.major}.${targetVersion.minor}.${targetVersion.patch}` },
      ],
    };

    const validated = GenomeSchema.parse(rolledBack);
    await this.repository.create(validated);

    this.telemetry.emitEvent(EventTypes.EVOLUTION_ROLLBACK, "genome-engine", { 
      genomeId: validated.id, 
      targetVersion: `${targetVersion.major}.${targetVersion.minor}.${targetVersion.patch}` 
    });

    return Result.ok(validated);
  }

  private versionEquals(a: Version, b: Version): boolean {
    return a.major === b.major && a.minor === b.minor && a.patch === b.patch;
  }

  private incrementVersion(version: Version): Version {
    return { major: version.major, minor: version.minor, patch: version.patch + 1 };
  }

  async exportGenome(genomeId: string): Promise<string> {
    const genome = await this.repository.get(genomeId);
    if (!genome) throw new Error(`Genome not found: ${genomeId}`);
    return JSON.stringify(genome, null, 2);
  }

  async importGenome(json: string, mindId: string, context: SecurityContext): Promise<Result<Genome, Error>> {
    const privacyCheck = this.securityEngine.checkPrivacy(context, "confidential");
    if (!privacyCheck) {
      return Result.err(new Error("Privacy level insufficient for genome import"));
    }

    try {
      const genome = JSON.parse(json) as Genome;
      genome.id = generateId();
      genome.mindId = mindId;
      genome.createdAt = nowISO();
      genome.updatedAt = nowISO();
      
      const validated = GenomeSchema.parse(genome);
      await this.repository.create(validated);
      
      return Result.ok(validated);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private serialize(genome: Genome): Record<string, unknown> {
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

  private deserialize(row: Record<string, unknown>): Genome {
    const get = <T>(key: string): T => row[key] as T;
    const getOpt = <T>(key: string): T | undefined => (row[key] !== undefined && row[key] !== null) ? row[key] as T : undefined;

    return {
      id: get<string>('id'),
      mindId: get<string>('mind_id'),
      version: JSON.parse(get<string>('version')),
      baseModels: JSON.parse(get<string>('base_models')),
      adapters: getOpt<string>('adapters') ? JSON.parse(get<string>('adapters')) : undefined,
      prompts: getOpt<string>('prompts') ? JSON.parse(get<string>('prompts')) : undefined,
      memoryConfig: getOpt<string>('memory_config') ? JSON.parse(get<string>('memory_config')) : undefined,
      memorySnapshots: getOpt<string>('memory_snapshots') ? JSON.parse(get<string>('memory_snapshots')) : undefined,
      skills: JSON.parse(get<string>('skills')),
      tools: JSON.parse(get<string>('tools')),
      policies: JSON.parse(get<string>('policies')),
      routing: JSON.parse(get<string>('routing')),
      evaluators: JSON.parse(get<string>('evaluators')),
      knowledge: getOpt<string>('knowledge') ? JSON.parse(get<string>('knowledge')) : undefined,
      benchmarkResults: getOpt<string>('benchmark_results') ? JSON.parse(get<string>('benchmark_results')) : undefined,
      evolutionHistory: getOpt<string>('evolution_history') ? JSON.parse(get<string>('evolution_history')) : undefined,
      parentGenome: getOpt<string>('parent_genome'),
      branch: getOpt<string>('branch'),
      lineage: getOpt<string>('lineage') ? JSON.parse(get<string>('lineage')) : undefined,
      createdAt: get<string>('created_at'),
      updatedAt: get<string>('updated_at'),
    };
  }
}

export function createGenomeEngine(
  config: Partial<GenomeConfig>,
  telemetry: Telemetry,
  storage: StorageAdapter,
  securityEngine: SecurityEngine
): GenomeEngine {
  return new GenomeEngine(config, telemetry, storage, securityEngine);
}

export const genomeEngine = createGenomeEngine(
  {},
  createTelemetry(),
  storage,
  new SecurityEngine()
);

export interface GenomeVersion {
  major: number;
  minor: number;
  patch: number;
}

export function parseVersion(version: string): GenomeVersion | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return { major: parseInt(match[1], 10), minor: parseInt(match[2], 10), patch: parseInt(match[3], 10) };
}

export function formatVersion(version: GenomeVersion): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}

export function compareVersions(a: GenomeVersion, b: GenomeVersion): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

export const GENOME_VERSION: GenomeVersion = { major: 0, minor: 1, patch: 0 };
export const GENOME_VERSION_STRING = formatVersion(GENOME_VERSION);