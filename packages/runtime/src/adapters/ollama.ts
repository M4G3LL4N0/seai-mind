import { InferenceRuntime, type ModelHandle, type GenerationRequest, type GenerationResponse, type RuntimeHealth, type RuntimeCapabilities } from "../models.js";
import { type Model, type ModelCapability } from "@seai/core";
import { generateId, nowISO } from "@seai/core";
import { createTelemetry, EventTypes } from "@seai/core";

export class OllamaRuntime implements InferenceRuntime {
  name = "ollama";
  version = "1.0.0";
  private baseUrl: string;
  private telemetry: ReturnType<typeof createTelemetry>;
  private loadedModels: Map<string, ModelHandle> = new Map();

  capabilities: RuntimeCapabilities = {
    streaming: true,
    structuredOutput: true,
    functionCalling: false,
    vision: true,
    audio: false,
    maxContextWindow: 128000,
    supportedQuantizations: ["4bit", "8bit", "16bit", "fp16", "fp32"],
  };

  constructor(baseUrl: string = "http://localhost:11434", telemetry?: ReturnType<typeof createTelemetry>) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.telemetry = telemetry || createTelemetry();
  }

  async discoverModels(): Promise<Model[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) throw new Error(`Ollama API error: ${response.statusText}`);
      
      const data = await response.json() as { models?: Array<{ name: string; details?: { parameter_size?: string; license?: string; quantization_level?: string } }> };
      const models: Model[] = [];
      
      for (const model of data.models || []) {
        models.push({
          id: generateId(),
          provider: "ollama",
          name: model.name,
          version: model.details?.parameter_size || "unknown",
          parameterCount: this.parseParameterCount(model.details?.parameter_size),
          contextWindow: 4096,
          modalities: this.inferModalities(model.name),
          license: model.details?.license,
          quantization: model.details?.quantization_level,
          hardwareRequirements: undefined,
          capabilities: this.inferCapabilities(model.name),
          benchmarkScores: undefined,
          costPerToken: { input: 0, output: 0 },
          privacy: "internal",
          latency: undefined,
          reliability: 0.95,
          availability: 1.0,
        });
      }
      
      return models;
    } catch (error) {
      this.telemetry.emitEvent(EventTypes.SECURITY_ALERT, "ollama-runtime", { 
        action: "discover", error: String(error) 
      });
      return [];
    }
  }

  async loadModel(model: Model): Promise<ModelHandle> {
    try {
      const response = await fetch(`${this.baseUrl}/api/show`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: model.name }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load model: ${response.statusText}`);
      }
      
      const handle: ModelHandle = {
        id: generateId(),
        model,
        runtime: this.name,
        loadedAt: nowISO(),
        metadata: { ollamaName: model.name },
      };
      
      this.loadedModels.set(handle.id, handle);
      
      this.telemetry.emitEvent(EventTypes.MODEL_SELECTED, "ollama-runtime", { 
        action: "load", modelId: model.id, handleId: handle.id 
      });
      
      return handle;
    } catch (error) {
      this.telemetry.emitEvent(EventTypes.MODEL_EXECUTED, "ollama-runtime", { 
        action: "load-error", modelId: model.id, error: String(error) 
      });
      throw error;
    }
  }

  async unloadModel(handle: ModelHandle): Promise<void> {
    this.loadedModels.delete(handle.id);
    this.telemetry.emitEvent(EventTypes.MODEL_SELECTED, "ollama-runtime", { 
      action: "unload", modelId: handle.model.id, handleId: handle.id 
    });
  }

  async generate(handle: ModelHandle, request: GenerationRequest): Promise<GenerationResponse> {
    const startTime = Date.now();
    
    try {
      const payload: Record<string, unknown> = {
        model: handle.model.name,
        prompt: request.prompt,
        system: request.systemPrompt,
        stream: request.stream || false,
        options: {
          num_predict: request.maxTokens || 2000,
          temperature: request.temperature ?? 0.7,
          top_p: request.topP ?? 0.9,
          top_k: request.topK ?? 40,
          stop: request.stopSequences,
          seed: request.seed,
        },
      };
      
      if (request.messages && request.messages.length > 0) {
        payload["messages"] = request.messages;
        delete payload["prompt"];
        delete payload["system"];
      }
      
      if (request.responseFormat === "json") {
        payload["format"] = "json";
      }
      
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }
      
      const data = await response.json() as { response?: string; done?: boolean; prompt_eval_count?: number; eval_count?: number };
      const latencyMs = Date.now() - startTime;
      
      const genResponse: GenerationResponse = {
        id: generateId(),
        text: data.response || "",
        finishReason: data.done ? "stop" : "length",
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
        latencyMs,
        model: handle.model.name,
        metadata: { ollamaModel: handle.model.name },
      };
      
      this.telemetry.emitEvent(EventTypes.MODEL_EXECUTED, "ollama-runtime", { 
        handleId: handle.id, modelId: handle.model.id, tokensUsed: genResponse.usage.totalTokens, latencyMs 
      });
      
      return genResponse;
    } catch (error) {
      this.telemetry.emitEvent(EventTypes.MODEL_EXECUTED, "ollama-runtime", { 
        handleId: handle.id, modelId: handle.model.id, error: String(error) 
      });
      throw error;
    }
  }

  async health(): Promise<RuntimeHealth> {
    try {
      const response = await fetch(`${this.baseUrl}/api/version`);
      const healthy = response.ok;
      const data = await response.json().catch(() => ({})) as { version?: string };
      
      return {
        healthy,
        version: data.version || "unknown",
        modelsLoaded: this.loadedModels.size,
        memoryUsage: 0,
        gpuUsage: undefined,
        errors: healthy ? [] : ["Ollama not responding"],
      };
    } catch (error) {
      return {
        healthy: false,
        version: "unknown",
        modelsLoaded: 0,
        memoryUsage: 0,
        errors: [String(error)],
      };
    }
  }

  private parseParameterCount(size?: string): number | undefined {
    if (!size) return undefined;
    const match = size.match(/(\d+(?:\.\d+)?)\s*([BKMGT]?)/i);
    if (!match || !match[1]) return undefined;
    const value = parseFloat(match[1]);
    const unit = (match[2] || "").toUpperCase();
    const multipliers: Record<string, number> = { "": 1, "K": 1e3, "M": 1e6, "B": 1e9, "T": 1e12 };
    return Math.round(value * (multipliers[unit] || 1));
  }

  private inferModalities(modelName: string): ModelCapability[] {
    const modalities: ModelCapability[] = ["text-generation", "chat"];
    const name = modelName.toLowerCase();
    if (name.includes("vision") || name.includes("vl") || name.includes("llava") || name.includes("bakllava")) {
      modalities.push("vision");
    }
    if (name.includes("code") || name.includes("coder")) {
      modalities.push("coding");
    }
    return modalities;
  }

  private inferCapabilities(modelName: string): ModelCapability[] {
    return this.inferModalities(modelName);
  }
}

export function createOllamaRuntime(baseUrl?: string): OllamaRuntime {
  return new OllamaRuntime(baseUrl);
}
