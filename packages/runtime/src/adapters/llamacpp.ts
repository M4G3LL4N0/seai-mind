import { InferenceRuntime, type ModelHandle, type GenerationRequest, type GenerationResponse, type RuntimeHealth, type RuntimeCapabilities } from "../models.js";
import { type Model } from "@seai/core";
import { generateId, nowISO } from "@seai/core";
import { createTelemetry, EventTypes } from "@seai/core";
import { spawn } from "node:child_process";

export class LlamaCppRuntime implements InferenceRuntime {
  name = "llamacpp";
  version = "1.0.0";
  private llamaCppPath: string;
  private telemetry: ReturnType<typeof createTelemetry>;
  private loadedModels: Map<string, ModelHandle> = new Map();
  private servers: Map<string, { process: any; port: number }> = new Map();

  capabilities: RuntimeCapabilities = {
    streaming: true,
    structuredOutput: true,
    functionCalling: false,
    vision: false,
    audio: false,
    maxContextWindow: 128000,
    supportedQuantizations: ["4bit", "8bit", "16bit", "fp16", "fp32", "q4_k_m", "q5_k_m", "q8_0"],
  };

  constructor(llamaCppPath: string = "llama-server", telemetry?: ReturnType<typeof createTelemetry>) {
    this.llamaCppPath = llamaCppPath;
    this.telemetry = telemetry || createTelemetry();
  }

  async discoverModels(): Promise<Model[]> {
    return [];
  }

  async loadModel(model: Model): Promise<ModelHandle> {
    const port = await this.findFreePort();
    const modelPath = model.name;

    try {
      const process = this.startLlamaServer(modelPath, port);
      await this.waitForServer(port);

      const handle: ModelHandle = {
        id: generateId(),
        model,
        runtime: this.name,
        loadedAt: nowISO(),
        metadata: { port, modelPath },
      };

      this.loadedModels.set(handle.id, handle);
      this.servers.set(handle.id, { process, port });

      this.telemetry.emitEvent(EventTypes.MODEL_SELECTED, "llamacpp-runtime", {
        action: "load", modelId: model.id, handleId: handle.id, port,
      });

      return handle;
    } catch (error) {
      this.telemetry.emitEvent(EventTypes.MODEL_EXECUTED, "llamacpp-runtime", {
        action: "load-error", modelId: model.id, error: String(error),
      });
      throw error;
    }
  }

  private startLlamaServer(modelPath: string, port: number): any {
    const args = ["-m", modelPath, "--port", port.toString(), "--host", "127.0.0.1", "--ctx-size", "4096"];
    return spawn(this.llamaCppPath, args, { stdio: ["ignore", "pipe", "pipe"] });
  }

  private async waitForServer(port: number, maxAttempts: number = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`http://127.0.0.1:${port}/health`);
        if (response.ok) return;
      } catch { /* retry */ }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error(`Server on port ${port} did not become ready`);
  }

  private async findFreePort(): Promise<number> {
    return 8080 + this.servers.size;
  }

  async unloadModel(handle: ModelHandle): Promise<void> {
    const server = this.servers.get(handle.id);
    if (server) {
      server.process.kill();
      this.servers.delete(handle.id);
    }
    this.loadedModels.delete(handle.id);

    this.telemetry.emitEvent(EventTypes.MODEL_SELECTED, "llamacpp-runtime", {
      action: "unload", modelId: handle.model.id, handleId: handle.id,
    });
  }

  async generate(handle: ModelHandle, request: GenerationRequest): Promise<GenerationResponse> {
    const server = this.servers.get(handle.id);
    if (!server) throw new Error("Model not loaded");

    const startTime = Date.now();
    try {
      const payload: any = {
        prompt: request.prompt,
        system_prompt: request.systemPrompt,
        max_tokens: request.maxTokens || 2000,
        temperature: request.temperature ?? 0.7,
        top_p: request.topP ?? 0.9,
      };

      const response = await fetch(`http://127.0.0.1:${server.port}/completion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Generation failed: ${response.statusText}`);

      const data = await response.json() as { content?: string; stop?: boolean; eval_count?: number };
      const latencyMs = Date.now() - startTime;

      const genResponse: GenerationResponse = {
        id: generateId(),
        text: data.content || "",
        finishReason: data.stop ? "stop" : "length",
        usage: { promptTokens: 0, completionTokens: data.eval_count || 0, totalTokens: data.eval_count || 0 },
        latencyMs,
        model: handle.model.name,
      };

      this.telemetry.emitEvent(EventTypes.MODEL_EXECUTED, "llamacpp-runtime", {
        handleId: handle.id, tokensUsed: genResponse.usage.totalTokens, latencyMs,
      });

      return genResponse;
    } catch (error) {
      this.telemetry.emitEvent(EventTypes.MODEL_EXECUTED, "llamacpp-runtime", {
        handleId: handle.id, error: String(error),
      });
      throw error;
    }
  }

  async health(): Promise<RuntimeHealth> {
    let healthy = true;
    const errors: string[] = [];
    for (const [handleId, server] of this.servers) {
      try {
        const response = await fetch(`http://127.0.0.1:${server.port}/health`);
        if (!response.ok) {
          healthy = false;
          errors.push(`Server on port ${server.port} unhealthy`);
        }
      } catch {
        healthy = false;
        errors.push(`Server on port ${server.port} not responding`);
      }
    }
    return { healthy, version: "1.0.0", modelsLoaded: this.loadedModels.size, memoryUsage: 0, errors };
  }
}

export function createLlamaCppRuntime(llamaCppPath?: string): LlamaCppRuntime {
  return new LlamaCppRuntime(llamaCppPath);
}
