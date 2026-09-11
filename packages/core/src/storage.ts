import { EventEmitter } from "node:events";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { generateId, nowISO } from "./kernel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface StorageConfig {
  path: string;
}

const DEFAULT_CONFIG: StorageConfig = {
  path: "./data/seai.db",
};

export interface StorageAdapter {
  initialize(): Promise<void>;
  close(): Promise<void>;
  transaction<T>(fn: () => T): T;
  exec(sql: string): void;
  prepare(sql: string): PreparedStatement;
}

export interface PreparedStatement {
  run(...params: unknown[]): RunResult;
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
  iterate(...params: unknown[]): IterableIterator<unknown>;
}

export interface RunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

class MemoryStorageImpl implements StorageAdapter {
  private tables: Map<string, Map<string, Record<string, unknown>>> = new Map();

  async initialize(): Promise<void> {}

  async close(): Promise<void> {
    this.tables.clear();
  }

  transaction<T>(fn: () => T): T {
    return fn();
  }

  exec(sql: string): void {}

  prepare(sql: string): PreparedStatement {
    const upperSql = sql.trim().toUpperCase();
    
    if (upperSql.startsWith("INSERT")) {
      return this.createInsertStatement(sql);
    } else if (upperSql.startsWith("SELECT")) {
      return this.createSelectStatement(sql);
    } else if (upperSql.startsWith("UPDATE")) {
      return this.createUpdateStatement(sql);
    } else if (upperSql.startsWith("DELETE")) {
      return this.createDeleteStatement(sql);
    } else if (upperSql.startsWith("CREATE")) {
      return this.createDDLStatement(sql);
    }
    
    return this.createNoopStatement();
  }

  private createNoopStatement(): PreparedStatement {
    return {
      run: () => ({ changes: 0, lastInsertRowid: 0n }),
      get: () => undefined,
      all: () => [],
      iterate: () => (function* () {})(),
    };
  }

  private createInsertStatement(sql: string): PreparedStatement {
    const tableMatch = sql.match(/INSERT\s+INTO\s+(\w+)/i);
    const table = tableMatch?.[1] || "unknown";
    const self = this;
    
    return {
      run: (...params: unknown[]) => {
        if (!self.tables.has(table)) {
          self.tables.set(table, new Map());
        }
        const tableMap = self.tables.get(table)!;
        const id = (params[0] as string) || generateId();
        const row: Record<string, unknown> = { id, ...self.paramsToObject(sql, params) };
        tableMap.set(id, row);
        return { changes: 1, lastInsertRowid: BigInt(Date.now()) };
      },
      get: () => undefined,
      all: () => [],
      iterate: () => (function* () {})(),
    };
  }

  private createSelectStatement(sql: string): PreparedStatement {
    const tableMatch = sql.match(/FROM\s+(\w+)/i);
    const table = tableMatch?.[1] || "unknown";
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/i);
    const whereClause = whereMatch?.[1] || "";
    const self = this;
    
    return {
      run: () => ({ changes: 0, lastInsertRowid: 0n }),
      get: (...params: unknown[]) => {
        const tableMap = self.tables.get(table);
        if (!tableMap) return undefined;
        
        if (whereClause) {
          for (const [id, row] of tableMap) {
            if (self.matchWhere(row, whereClause, params)) {
              return row;
            }
          }
        } else {
          return tableMap.values().next().value;
        }
        return undefined;
      },
      all: (...params: unknown[]) => {
        const tableMap = self.tables.get(table);
        if (!tableMap) return [];
        
        const results: Record<string, unknown>[] = [];
        for (const [id, row] of tableMap) {
          if (!whereClause || self.matchWhere(row, whereClause, params)) {
            results.push(row);
          }
        }
        return results;
      },
      iterate: function* (...params: unknown[]) {
        const tableMap = self.tables.get(table);
        if (!tableMap) return;
        
        for (const [id, row] of tableMap) {
          if (!whereClause || self.matchWhere(row, whereClause, params)) {
            yield row;
          }
        }
      },
    };
  }

  private createUpdateStatement(sql: string): PreparedStatement {
    const tableMatch = sql.match(/UPDATE\s+(\w+)/i);
    const table = tableMatch?.[1] || "unknown";
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/i);
    const whereClause = whereMatch?.[1] || "";
    const self = this;
    
    return {
      run: (...params: unknown[]) => {
        const tableMap = self.tables.get(table);
        if (!tableMap) return { changes: 0, lastInsertRowid: 0n };
        
        let changes = 0;
        for (const [id, row] of tableMap) {
          if (!whereClause || self.matchWhere(row, whereClause, params)) {
            const updates = self.paramsToObject(sql, params);
            Object.assign(row, updates);
            changes++;
          }
        }
        return { changes, lastInsertRowid: 0n };
      },
      get: () => undefined,
      all: () => [],
      iterate: () => (function* () {})(),
    };
  }

  private createDeleteStatement(sql: string): PreparedStatement {
    const tableMatch = sql.match(/DELETE\s+FROM\s+(\w+)/i);
    const table = tableMatch?.[1] || "unknown";
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/i);
    const whereClause = whereMatch?.[1] || "";
    const self = this;
    
    return {
      run: (...params: unknown[]) => {
        const tableMap = self.tables.get(table);
        if (!tableMap) return { changes: 0, lastInsertRowid: 0n };
        
        let changes = 0;
        const toDelete: string[] = [];
        for (const [id, row] of tableMap) {
          if (!whereClause || self.matchWhere(row, whereClause, params)) {
            toDelete.push(id);
          }
        }
        for (const id of toDelete) {
          tableMap.delete(id);
          changes++;
        }
        return { changes, lastInsertRowid: 0n };
      },
      get: () => undefined,
      all: () => [],
      iterate: () => (function* () {})(),
    };
  }

  private createDDLStatement(sql: string): PreparedStatement {
    return this.createNoopStatement();
  }

  private paramsToObject(sql: string, params: unknown[]): Record<string, unknown> {
    const columnsMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
    if (!columnsMatch || !columnsMatch[1]) return {};
    
    const columns = columnsMatch[1].split(",").map(c => c.trim()).filter(Boolean) as string[];
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < columns.length && i < params.length; i++) {
      const col = columns[i];
      if (col) {
        obj[col] = params[i];
      }
    }
    return obj;
  }

  private matchWhere(row: Record<string, unknown>, whereClause: string, params: unknown[]): boolean {
    const idMatch = whereClause.match(/id\s*=\s*\?/i);
    if (idMatch && params[0]) {
      return row["id"] === params[0];
    }
    return true;
  }
}

export class FileStorage implements StorageAdapter {
  private basePath: string;

  constructor(basePath: string = "./data") {
    this.basePath = resolve(basePath);
  }

  async initialize(): Promise<void> {
    mkdirSync(this.basePath, { recursive: true });
  }

  async close(): Promise<void> {}

  transaction<T>(fn: () => T): T {
    return fn();
  }

  exec(sql: string): void {}

  prepare(sql: string): PreparedStatement {
    return {
      run: () => ({ changes: 0, lastInsertRowid: 0n }),
      get: () => undefined,
      all: () => [],
      iterate: () => (function* () {})(),
    };
  }

  async writeFile(relativePath: string, content: string): Promise<void> {
    const fullPath = join(this.basePath, relativePath);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content);
  }

  async readFile(relativePath: string): Promise<string | null> {
    const fullPath = join(this.basePath, relativePath);
    if (!existsSync(fullPath)) return null;
    return readFileSync(fullPath, "utf-8");
  }

  async listFiles(prefix: string = ""): Promise<string[]> {
    const fullPath = join(this.basePath, prefix);
    if (!existsSync(fullPath)) return [];
    
    const fs = await import("node:fs/promises");
    const files = await fs.readdir(fullPath, { recursive: true });
    return files.map(f => f.toString());
  }
}

export function createStorage(config?: Partial<StorageConfig>): StorageAdapter {
  const storageType = process.env["SEAI_STORAGE"] || "memory";
  
  switch (storageType) {
    case "file":
      return new FileStorage(config?.path);
    case "memory":
    default:
      return new MemoryStorageImpl();
  }
}

export const storage = createStorage();

export interface Repository<T extends { id: string }> {
  create(entity: T): Promise<T>;
  get(id: string): Promise<T | null>;
  update(entity: T): Promise<T>;
  delete(id: string): Promise<boolean>;
  list(filter?: Partial<T>, limit?: number, offset?: number): Promise<T[]>;
  count(filter?: Partial<T>): Promise<number>;
}

export function createRepository<T extends { id: string }>(
  storage: StorageAdapter,
  tableName: string,
  serializer: (entity: T) => Record<string, unknown>,
  deserializer: (row: Record<string, unknown>) => T
): Repository<T> {
  return {
    async create(entity: T) {
      const data = serializer(entity);
      const columns = Object.keys(data).join(", ");
      const placeholders = Object.keys(data).map(() => "?").join(", ");
      const values = Object.values(data);
      
      storage.prepare(`INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`).run(...values);
      return entity;
    },
    
    async get(id: string) {
      const stmt = storage.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
      const row = stmt.get(id) as Record<string, unknown> | undefined;
      return row ? deserializer(row) : null;
    },
    
    async update(entity: T) {
      const data = serializer(entity);
      const setClause = Object.keys(data).filter(k => k !== "id").map(k => `${k} = ?`).join(", ");
      const values = [...Object.values(data).filter((_, i) => Object.keys(data)[i] !== "id"), entity.id];
      
      storage.prepare(`UPDATE ${tableName} SET ${setClause} WHERE id = ?`).run(...values);
      return entity;
    },
    
    async delete(id: string) {
      const result = storage.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(id);
      return (result.changes as number) > 0;
    },
    
    async list(filter: Partial<T> = {}, limit = 100, offset = 0) {
      const conditions = Object.entries(filter).map(([k]) => `${k} = ?`).join(" AND ");
      const whereClause = conditions ? `WHERE ${conditions}` : "";
      const values = Object.values(filter);
      
      const stmt = storage.prepare(`SELECT * FROM ${tableName} ${whereClause} LIMIT ? OFFSET ?`);
      const rows = stmt.all(...values, limit, offset) as Record<string, unknown>[];
      return rows.map(deserializer);
    },
    
    async count(filter: Partial<T> = {}) {
      const conditions = Object.entries(filter).map(([k]) => `${k} = ?`).join(" AND ");
      const whereClause = conditions ? `WHERE ${conditions}` : "";
      const values = Object.values(filter);
      
      const stmt = storage.prepare(`SELECT COUNT(*) as count FROM ${tableName} ${whereClause}`);
      const row = stmt.get(...values) as { count: number } | undefined;
      return row?.count || 0;
    },
  };
}