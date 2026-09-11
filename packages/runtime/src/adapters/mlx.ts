import { InferenceRuntime, type ModelHandle, type GenerationRequest, type GenerationResponse, type RuntimeHealth, type RuntimeCapabilities } from "../models.js";
import { type Model } from "@seai/core";
import { generateId, nowISO } from "@seai/core";
import { createTelemetry, EventTypes } from "@seai/core";

export class MLXRuntime implements InferenceRuntime {
  name = "mlx";
  version = "1.0.0";
  private telemetry: ReturnType<typeof createTelemetry>;
  private loadedModels: Map<string, ModelHandle> = new Map();
  private mlxAvailable = false;

  capabilities: RuntimeCapabilities = {
    streaming: true,
    structuredOutput: true,
    functionCalling: false,
    vision: false,
    audio: false,
    maxContextWindow: 32768,
    supportedQuantizations: ["4bit", "8bit", "16bit", "fp16", "bf16"],
  };

  constructor(telemetry?: ReturnType<typeof createTelemetry>) {
    this.telemetry = telemetry || createTelemetry();
  }

  async discoverModels(): Promise<Model[]> {
    return [];
  }

  async loadModel(model: Model): Promise<ModelHandle> {
    const handle: ModelHandle = {
      id: generateId(),
      model,
      runtime: this.name,
      loadedAt: nowISO(),
      metadata: { mlxPath: model.name },
    };
    this.loadedModels.set(handle.id, handle);
    this.telemetry.emitEvent(EventTypes.MODEL_SELECTED, "mlx-runtime", { action: "load", modelId: model.id, handleId: handle.id });
    return handle;
  }

  async unloadModel(handle: ModelHandle): Promise<void> {
    this.loadedModels.delete(handle.id);
    this.telemetry.emitEvent(EventTypes.MODEL_SELECTED, "mlx-runtime", { action: "unload", modelId: handle.model.id, handleId: handle.id });
  }

  async generate(handle: ModelHandle, request: GenerationRequest): Promise<GenerationResponse> {
    const startTime = Date.now();
    const latencyMs = Date.now() - startTime;
    const response: GenerationResponse = {
      id: generateId(),
      text: `[MLX] Generated response for: ${request.prompt.substring(0, 50)}...`,
      finishReason: "stop",
      usage: { promptTokens: Math.ceil(request.prompt.length / 4), completionTokens: 100, totalTokens: Math.ceil(request.prompt.length / 4) + 100 },
      latencyMs,
      model: handle.model.name,
    };
    this.telemetry.emitEvent(EventTypes.MODEL_EXECUTED, "mlx-runtime", { handleId: handle.id, modelId: handle.model.id, tokensUsed: response.usage.totalTokens, latencyMs });
    return response;
  }

  async health(): Promise<RuntimeHealth> {
    return { healthy: this.mlxAvailable, version: "0.1.0", modelsLoaded: this.loadedModels.size, memoryUsage: 0, errors: this.mlxAvailable ? [] : ["MLX not installed"] };
  }
}

export function createMLXRuntime(): MLXRuntime {
  return new MLXRuntime();
}
