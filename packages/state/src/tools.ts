import { generateId, nowISO, Result } from "@seai/core";
import { createTelemetry, EventTypes, type Telemetry } from "@seai/core";
import { StorageAdapter, createRepository } from "@seai/core";
import { SecurityEngine, type SecurityContext } from "@seai/core";

export interface ToolConfig {
  maxToolsPerMind: number;
  defaultTimeoutMs: number;
  maxRetries: number;
}

const DEFAULT_CONFIG: ToolConfig = {
  maxToolsPerMind: 100,
  defaultTimeoutMs: 30000,
  maxRetries: 3,
};

export interface ToolExecutionContext {
  mindId: string;
  input: unknown;
  context: SecurityContext;
  timeoutMs?: number;
}

export interface ToolExecutionResult {
  success: boolean;
  output?: unknown;
  error?: string;
  latencyMs: number;
  retries: number;
  metadata?: Record<string, unknown>;
}

export interface ToolCapability {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  permissions: string[];
  privacy: string;
  security: string;
  cost: number;
  estimatedLatencyMs: number;
}

export interface Tool {
  id: string;
  name: string;
  capability: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  permissions: string[];
  privacy: string;
  security: string;
  cost: number;
  latency: { p50Ms?: number; p95Ms?: number } | undefined;
  failureModes: Array<{ code: string; description: string; recoverable: boolean; retryable: boolean }> | undefined;
  version: { major: number; minor: number; patch: number };
}

export class ToolEngine {
  private config: ToolConfig;
  private telemetry: Telemetry;
  private capabilityRegistry: Map<string, ToolCapability> = new Map();

  constructor(config: Partial<ToolConfig> = {}, telemetry: Telemetry, storage?: StorageAdapter, security?: SecurityEngine) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.telemetry = telemetry;
    this.registerBuiltinCapabilities();
  }

  async initialize(): Promise<void> {
    // No persistent initialization needed for tool capabilities
  }

  async shutdown(): Promise<void> {
    // No persistent resources to clean up
  }

  private registerBuiltinCapabilities(): void {
    const caps: ToolCapability[] = [
      { name: "web.search", description: "Search the web", inputSchema: { query: "string" }, outputSchema: { results: "array" }, permissions: ["tool:execute"], privacy: "internal", security: "low", cost: 0.001, estimatedLatencyMs: 2000 },
      { name: "web.fetch", description: "Fetch a URL", inputSchema: { url: "string" }, outputSchema: { content: "string" }, permissions: ["tool:execute"], privacy: "internal", security: "low", cost: 0.0005, estimatedLatencyMs: 1000 },
      { name: "code.execute", description: "Execute code in sandbox", inputSchema: { code: "string", language: "string" }, outputSchema: { output: "string", exitCode: "number" }, permissions: ["tool:execute"], privacy: "private", security: "high", cost: 0.01, estimatedLatencyMs: 5000 },
      { name: "file.read", description: "Read a file", inputSchema: { path: "string" }, outputSchema: { content: "string" }, permissions: ["tool:execute"], privacy: "private", security: "medium", cost: 0, estimatedLatencyMs: 100 },
      { name: "file.write", description: "Write a file", inputSchema: { path: "string", content: "string" }, outputSchema: { success: "boolean" }, permissions: ["tool:execute"], privacy: "private", security: "high", cost: 0, estimatedLatencyMs: 100 },
      { name: "shell.execute", description: "Execute a shell command", inputSchema: { command: "string" }, outputSchema: { stdout: "string", stderr: "string", exitCode: "number" }, permissions: ["tool:execute"], privacy: "private", security: "critical", cost: 0, estimatedLatencyMs: 2000 },
    ];
    for (const cap of caps) this.capabilityRegistry.set(cap.name, cap);
  }

  getCapability(name: string): ToolCapability | undefined {
    return this.capabilityRegistry.get(name);
  }

  listCapabilities(): ToolCapability[] {
    return Array.from(this.capabilityRegistry.values());
  }

  async executeTool(toolName: string, input: unknown): Promise<ToolExecutionResult> {
    const capability = this.capabilityRegistry.get(toolName);
    if (!capability) {
      return { success: false, error: `Tool not registered: ${toolName}`, latencyMs: 0, retries: 0 };
    }

    const start = Date.now();
    try {
      const result = await this.runCapability(toolName, input);
      return { success: true, output: result, latencyMs: Date.now() - start, retries: 0 };
    } catch (error) {
      return { success: false, error: String(error), latencyMs: Date.now() - start, retries: 0 };
    }
  }

  private async runCapability(name: string, input: unknown): Promise<unknown> {
    switch (name) {
      case "web.search":
        return { results: [], query: (input as { query: string }).query };
      case "web.fetch":
        try {
          const response = await fetch((input as { url: string }).url);
          return { content: await response.text(), url: (input as { url: string }).url };
        } catch (error) {
          throw new Error(`Fetch failed: ${error}`);
        }
      case "code.execute":
        return { output: "Code execution not implemented", exitCode: 0 };
      case "file.read":
        try {
          const fs = await import("node:fs/promises");
          const content = await fs.readFile((input as { path: string }).path, "utf-8");
          return { content, path: (input as { path: string }).path };
        } catch (error) {
          throw new Error(`File read failed: ${error}`);
        }
      case "file.write":
        try {
          const fs = await import("node:fs/promises");
          const path = await import("node:path");
          const fileInput = input as { path: string; content: string };
          await fs.mkdir(path.default.dirname(fileInput.path), { recursive: true });
          await fs.writeFile(fileInput.path, fileInput.content);
          return { success: true, path: fileInput.path };
        } catch (error) {
          throw new Error(`File write failed: ${error}`);
        }
      case "shell.execute":
        return { stdout: "Shell execution not implemented", stderr: "", exitCode: 1 };
      default:
        throw new Error(`Tool capability not implemented: ${name}`);
    }
  }
}

export function createToolEngine(config: Partial<ToolConfig> = {}): ToolEngine {
  return new ToolEngine(config, createTelemetry());
}

export const toolEngine = createToolEngine();
