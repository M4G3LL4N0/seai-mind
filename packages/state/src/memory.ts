import {
  MemoryEntrySchema,
  MemoryTypeSchema,
  MemoryStateSchema,
  type MemoryEntry,
  type MemoryType,
  type MemoryState,
} from "@seai/core";

export type { MemoryEntry };
import { generateId, nowISO, Result, percentile, mean, median, standardDeviation } from "@seai/core";
import { createTelemetry, EventTypes, type Telemetry } from "@seai/core";
import { StorageAdapter, createRepository, storage } from "@seai/core";
import { SecurityEngine, type SecurityContext } from "@seai/core";

export interface MemoryConfig {
  workingMemoryCapacity: number;
  consolidationIntervalMs: number;
  decayRate: number;
  maxMemoryAge: number;
  compressionEnabled: boolean;
  embeddingEnabled: boolean;
  embeddingModel?: string;
}

const DEFAULT_CONFIG: MemoryConfig = {
  workingMemoryCapacity: 100,
  consolidationIntervalMs: 300000,
  decayRate: 0.01,
  maxMemoryAge: 86400000 * 30,
  compressionEnabled: true,
  embeddingEnabled: false,
};

export interface MemoryQuery {
  type?: MemoryType;
  state?: MemoryState;
  mindId?: string;
  tags?: string[];
  timeRange?: { start: string; end: string };
  limit?: number;
  offset?: number;
  minConfidence?: number;
  minUtility?: number;
  searchText?: string;
}

export interface MemoryStats {
  total: number;
  byType: Record<MemoryType, number>;
  byState: Record<MemoryState, number>;
  averageConfidence: number;
  averageUtility: number;
  totalStorageCost: number;
  oldestMemory: string | null;
  newestMemory: string | null;
}

export interface ConsolidationResult {
  consolidated: number;
  compressed: number;
  archived: number;
  deleted: number;
  errors: string[];
}

export class MemoryEngine {
  private config: MemoryConfig;
  private telemetry: Telemetry;
  private storage: StorageAdapter;
  private repository: ReturnType<typeof createRepository<MemoryEntry>>;
  private securityEngine: SecurityEngine;
  private consolidationTimer: NodeJS.Timeout | null = null;
  private workingMemory: Map<string, MemoryEntry[]> = new Map();

  constructor(
    config: Partial<MemoryConfig> = {},
    telemetry: Telemetry,
    storage: StorageAdapter,
    securityEngine: SecurityEngine
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.telemetry = telemetry;
    this.storage = storage;
    this.securityEngine = securityEngine;
    this.repository = createRepository(storage, "memories", this.serialize, this.deserialize);
  }

  async initialize(): Promise<void> {
    await this.storage.initialize();
    this.startConsolidationTimer();
  }

  async shutdown(): Promise<void> {
    if (this.consolidationTimer) {
      clearInterval(this.consolidationTimer);
      this.consolidationTimer = null;
    }
    await this.storage.close();
  }

  private startConsolidationTimer(): void {
    this.consolidationTimer = setInterval(async () => {
      try {
        await this.consolidate();
      } catch (error) {
        this.telemetry.emitEvent(
          EventTypes.SECURITY_ALERT,
          "memory-engine",
          { action: "consolidate", error: String(error) }
        );
      }
    }, this.config.consolidationIntervalMs);
    
    this.consolidationTimer.unref();
  }

  async capture(
    mindId: string,
    type: MemoryType,
    content: unknown,
    context: SecurityContext,
    options: {
      metadata?: Record<string, unknown>;
      embedding?: number[];
      confidence?: number;
      utility?: number;
      dependencies?: string[];
      risk?: number;
    } = {}
  ): Promise<Result<MemoryEntry, Error>> {
    const privacyCheck = this.securityEngine.checkPrivacy(context, "internal");
    if (!privacyCheck) {
      return Result.err(new Error("Privacy level insufficient for memory capture"));
    }

    const entry: MemoryEntry = {
      id: generateId(),
      type,
      content,
      embedding: options.embedding,
      metadata: options.metadata,
      provenance: {
        source: context.userId || "system",
        timestamp: nowISO(),
        confidence: options.confidence ?? 1,
        validated: false,
      },
      state: "active",
      confidence: options.confidence ?? 1,
      utility: options.utility ?? 0,
      recency: Date.now(),
      frequency: 0,
      dependencies: options.dependencies,
      risk: options.risk ?? 0,
      storageCost: this.estimateStorageCost(content),
      validationHistory: [],
      accessHistory: [],
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };

    const validated = MemoryEntrySchema.parse(entry);
    
    await this.repository.create(validated);
    this.addToWorkingMemory(mindId, validated);

    this.telemetry.emitEvent(
      EventTypes.MEMORY_CREATED,
      "memory-engine",
      { mindId, memoryId: validated.id, type: validated.type }
    );

    return Result.ok(validated);
  }

  async retrieve(
    mindId: string,
    query: MemoryQuery,
    context: SecurityContext
  ): Promise<Result<MemoryEntry[], Error>> {
    const privacyCheck = this.securityEngine.checkPrivacy(context, "internal");
    if (!privacyCheck) {
      return Result.err(new Error("Privacy level insufficient for memory retrieval"));
    }

    let memories = await this.repository.list({ mindId } as any, query.limit || 100, query.offset || 0);
    
    memories = this.applyQueryFilters(memories, query);
    memories = this.rankMemories(memories, query);

    for (const memory of memories) {
      memory.accessHistory = memory.accessHistory || [];
      memory.accessHistory.push({ timestamp: nowISO(), context: query.searchText });
      memory.frequency += 1;
      memory.recency = Date.now();
      memory.updatedAt = nowISO();
      await this.repository.update(memory);
    }

    this.telemetry.emitEvent(
      EventTypes.MEMORY_RETRIEVED,
      "memory-engine",
      { mindId, query, count: memories.length }
    );

    return Result.ok(memories);
  }

  async getById(memoryId: string, context: SecurityContext): Promise<Result<MemoryEntry | null, Error>> {
    const memory = await this.repository.get(memoryId);
    if (!memory) return Result.ok(null);
    
    const privacyCheck = this.securityEngine.checkPrivacy(context, "internal");
    if (!privacyCheck) {
      return Result.err(new Error("Privacy level insufficient for memory access"));
    }
    
    return Result.ok(memory);
  }

  async update(
    memoryId: string,
    updates: Partial<MemoryEntry>,
    context: SecurityContext
  ): Promise<Result<MemoryEntry, Error>> {
    const existing = await this.repository.get(memoryId);
    if (!existing) {
      return Result.err(new Error(`Memory not found: ${memoryId}`));
    }
    
    const privacyCheck = this.securityEngine.checkPrivacy(context, "internal");
    if (!privacyCheck) {
      return Result.err(new Error("Privacy level insufficient for memory update"));
    }

    const updated: MemoryEntry = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: nowISO(),
    };

    const validated = MemoryEntrySchema.parse(updated);
    await this.repository.update(validated);

    this.telemetry.emitEvent(
      EventTypes.MEMORY_CREATED,
      "memory-engine",
      { memoryId: validated.id, action: "update" }
    );

    return Result.ok(validated);
  }

  async delete(memoryId: string, context: SecurityContext, hard: boolean = false): Promise<Result<boolean, Error>> {
    const existing = await this.repository.get(memoryId);
    if (!existing) {
      return Result.err(new Error(`Memory not found: ${memoryId}`));
    }
    
    const privacyCheck = this.securityEngine.checkPrivacy(context, "private");
    if (!privacyCheck) {
      return Result.err(new Error("Privacy level insufficient for memory deletion"));
    }

    if (hard) {
      await this.repository.delete(memoryId);
    } else {
      existing.state = "deleted";
      existing.deletedAt = nowISO();
      existing.updatedAt = nowISO();
      await this.repository.update(existing);
    }

    this.telemetry.emitEvent(
      EventTypes.MEMORY_ARCHIVED,
      "memory-engine",
      { memoryId, hard }
    );

    return Result.ok(true);
  }

  async consolidate(mindId?: string): Promise<ConsolidationResult> {
    const result: ConsolidationResult = {
      consolidated: 0,
      compressed: 0,
      archived: 0,
      deleted: 0,
      errors: [],
    };

    try {
      const query: MemoryQuery = { state: "active" };
      if (mindId) query.mindId = mindId;
      
      const memories = await this.repository.list(query as any, 10000);
      const now = Date.now();

      for (const memory of memories) {
        try {
          const age = now - new Date(memory.createdAt).getTime();
          
          if (age > this.config.maxMemoryAge && memory.state === "active") {
            if (memory.utility < 0.1 && memory.frequency < 2) {
              memory.state = "deleted";
              memory.deletedAt = nowISO();
              result.deleted++;
            } else {
              memory.state = "archived";
              memory.archivedAt = nowISO();
              result.archived++;
            }
            memory.updatedAt = nowISO();
            await this.repository.update(memory);
          } else if (memory.state === "active") {
            memory.confidence = Math.max(0, memory.confidence - this.config.decayRate);
            memory.utility = Math.max(0, memory.utility - this.config.decayRate * 0.5);
            
            if (this.config.compressionEnabled && memory.storageCost > 10000) {
              memory.storageCost = Math.floor(memory.storageCost * 0.8);
              result.compressed++;
            }
            
            if (memory.confidence < 0.3 && memory.utility < 0.1) {
              memory.state = "stale";
            }
            
            memory.updatedAt = nowISO();
            await this.repository.update(memory);
            result.consolidated++;
          }
        } catch (error) {
          result.errors.push(`Memory ${memory.id}: ${error}`);
        }
      }

      this.telemetry.emitEvent(
        EventTypes.MEMORY_CONSOLIDATED,
        "memory-engine",
        { mindId, ...result }
      );
    } catch (error) {
      result.errors.push(String(error));
    }

    return result;
  }

  async getStats(mindId?: string): Promise<MemoryStats> {
    const query: MemoryQuery = {};
    if (mindId) query.mindId = mindId;
    
    const memories = await this.repository.list(query as any, 10000);
    
    const byType: Record<MemoryType, number> = {
      working: 0, episodic: 0, semantic: 0, procedural: 0,
      identity: 0, preference: 0, temporal: 0, relational: 0,
      negative: 0, reflective: 0,
    };
    
    const byState: Record<MemoryState, number> = {
      active: 0, stale: 0, quarantined: 0, archived: 0, deleted: 0,
    };
    
    let totalConfidence = 0;
    let totalUtility = 0;
    let totalStorageCost = 0;
    let oldest: string | null = null;
    let newest: string | null = null;
    
    for (const memory of memories) {
      byType[memory.type]++;
      byState[memory.state]++;
      totalConfidence += memory.confidence;
      totalUtility += memory.utility;
      totalStorageCost += memory.storageCost;
      
      const created = new Date(memory.createdAt).getTime();
      if (!oldest || created < new Date(oldest).getTime()) oldest = memory.createdAt;
      if (!newest || created > new Date(newest).getTime()) newest = memory.createdAt;
    }
    
    return {
      total: memories.length,
      byType,
      byState,
      averageConfidence: memories.length > 0 ? totalConfidence / memories.length : 0,
      averageUtility: memories.length > 0 ? totalUtility / memories.length : 0,
      totalStorageCost,
      oldestMemory: oldest,
      newestMemory: newest,
    };
  }

  async searchSimilar(
    mindId: string,
    embedding: number[],
    limit: number = 10,
    threshold: number = 0.7
  ): Promise<MemoryEntry[]> {
    const query: MemoryQuery = { mindId, limit: 1000 };
    const memories = await this.repository.list(query as any, 1000);
    
    const scored = memories
      .filter(m => m.embedding && m.embedding.length === embedding.length)
      .map(m => ({
        memory: m,
        similarity: this.cosineSimilarity(embedding, m.embedding!),
      }))
      .filter(s => s.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    return scored.map(s => s.memory);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private applyQueryFilters(memories: MemoryEntry[], query: MemoryQuery): MemoryEntry[] {
    return memories.filter(m => {
      if (query.type && m.type !== query.type) return false;
      if (query.state && m.state !== query.state) return false;
      if (query.minConfidence && m.confidence < query.minConfidence) return false;
      if (query.minUtility && m.utility < query.minUtility) return false;
      if (query.searchText) {
        const contentStr = JSON.stringify(m.content).toLowerCase();
        if (!contentStr.includes(query.searchText.toLowerCase())) return false;
      }
      return true;
    });
  }

  private rankMemories(memories: MemoryEntry[], query: MemoryQuery): MemoryEntry[] {
    return memories.sort((a, b) => {
      const scoreA = a.confidence * 0.4 + a.utility * 0.3 + (a.recency / Date.now()) * 0.3;
      const scoreB = b.confidence * 0.4 + b.utility * 0.3 + (b.recency / Date.now()) * 0.3;
      return scoreB - scoreA;
    });
  }

  private addToWorkingMemory(mindId: string, memory: MemoryEntry): void {
    const wm = this.workingMemory.get(mindId) || [];
    wm.unshift(memory);
    if (wm.length > this.config.workingMemoryCapacity) {
      wm.pop();
    }
    this.workingMemory.set(mindId, wm);
  }

  getWorkingMemory(mindId: string): MemoryEntry[] {
    return this.workingMemory.get(mindId) || [];
  }

  private estimateStorageCost(content: unknown): number {
    return JSON.stringify(content).length;
  }

  private serialize(entry: MemoryEntry): Record<string, unknown> {
    return {
      id: entry.id,
      mind_id: entry.metadata?.mindId || "",
      type: entry.type,
      content: JSON.stringify(entry.content),
      embedding: entry.embedding ? JSON.stringify(entry.embedding) : null,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      provenance: JSON.stringify(entry.provenance),
      state: entry.state,
      confidence: entry.confidence,
      utility: entry.utility,
      recency: entry.recency,
      frequency: entry.frequency,
      dependencies: entry.dependencies ? JSON.stringify(entry.dependencies) : null,
      risk: entry.risk,
      storage_cost: entry.storageCost,
      validation_history: entry.validationHistory ? JSON.stringify(entry.validationHistory) : null,
      access_history: entry.accessHistory ? JSON.stringify(entry.accessHistory) : null,
      created_at: entry.createdAt,
      updated_at: entry.updatedAt,
      archived_at: entry.archivedAt || null,
      deleted_at: entry.deletedAt || null,
    };
  }

  private deserialize(row: Record<string, unknown>): MemoryEntry {
    const get = <T>(key: string): T => row[key] as T;
    const getOpt = <T>(key: string): T | undefined => (row[key] !== undefined && row[key] !== null) ? row[key] as T : undefined;

    return {
      id: get<string>('id'),
      type: get<MemoryType>('type'),
      content: JSON.parse(get<string>('content')),
      embedding: getOpt<string>('embedding') ? JSON.parse(get<string>('embedding')) : undefined,
      metadata: getOpt<string>('metadata') ? JSON.parse(get<string>('metadata')) : undefined,
      provenance: JSON.parse(get<string>('provenance')),
      state: get<MemoryState>('state'),
      confidence: get<number>('confidence'),
      utility: get<number>('utility'),
      recency: get<number>('recency'),
      frequency: get<number>('frequency'),
      dependencies: getOpt<string>('dependencies') ? JSON.parse(get<string>('dependencies')) : undefined,
      risk: get<number>('risk'),
      storageCost: get<number>('storage_cost'),
      validationHistory: getOpt<string>('validation_history') ? JSON.parse(get<string>('validation_history')) : undefined,
      accessHistory: getOpt<string>('access_history') ? JSON.parse(get<string>('access_history')) : undefined,
      createdAt: get<string>('created_at'),
      updatedAt: get<string>('updated_at'),
      archivedAt: getOpt<string>('archived_at'),
      deletedAt: getOpt<string>('deleted_at'),
    };
  }
}

export function createMemoryEngine(
  config: Partial<MemoryConfig>,
  telemetry: Telemetry,
  storage: StorageAdapter,
  securityEngine: SecurityEngine
): MemoryEngine {
  return new MemoryEngine(config, telemetry, storage, securityEngine);
}

export const memoryEngine = createMemoryEngine(
  {},
  createTelemetry(),
  storage,
  new SecurityEngine()
);

export interface MemorySnapshot {
  id: string;
  mindId: string;
  timestamp: string;
  memories: MemoryEntry[];
  stats: MemoryStats;
}

export async function createSnapshot(
  engine: MemoryEngine,
  mindId: string
): Promise<MemorySnapshot> {
  const stats = await engine.getStats(mindId);
  const memories = await engine.retrieve(mindId, { mindId, state: "active", limit: 10000 }, { permissions: [], privacyLevel: "internal", securityLevel: "low" });
  
  return {
    id: generateId(),
    mindId,
    timestamp: nowISO(),
    memories: memories.ok ? memories.value : [],
    stats,
  };
}

export async function restoreSnapshot(
  engine: MemoryEngine,
  snapshot: MemorySnapshot,
  context: SecurityContext
): Promise<Result<number, Error>> {
  let restored = 0;
  for (const memory of snapshot.memories) {
    const result = await engine.capture(
      snapshot.mindId,
      memory.type,
      memory.content,
      context,
      {
        metadata: memory.metadata,
        embedding: memory.embedding,
        confidence: memory.confidence,
        utility: memory.utility,
        dependencies: memory.dependencies,
        risk: memory.risk,
      }
    );
    if (result.ok) restored++;
  }
  return Result.ok(restored);
}