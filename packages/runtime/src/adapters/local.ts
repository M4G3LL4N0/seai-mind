import { InferenceRuntime, type ModelHandle, type GenerationRequest, type GenerationResponse, type RuntimeHealth, type RuntimeCapabilities } from "../models.js";
import { type Model } from "@seai/core";
import { generateId, nowISO } from "@seai/core";
import { createTelemetry, EventTypes } from "@seai/core";

export class LocalRuntime implements InferenceRuntime {
  name = "local";
  version = "1.0.0";
  private telemetry: ReturnType<typeof createTelemetry>;
  private loadedModels: Map<string, ModelHandle> = new Map();

  capabilities: RuntimeCapabilities = {
    streaming: false,
    structuredOutput: false,
    functionCalling: false,
    vision: false,
    audio: false,
    maxContextWindow: 4096,
    supportedQuantizations: [],
  };

  constructor(telemetry?: ReturnType<typeof createTelemetry>) {
    this.telemetry = telemetry || createTelemetry();
  }

  async discoverModels(): Promise<Model[]> {
    // Local runtime doesn't discover models - they're manually registered
    return [];
  }

  async loadModel(model: Model): Promise<ModelHandle> {
    const handle: ModelHandle = {
      id: generateId(),
      model,
      runtime: this.name,
      loadedAt: nowISO(),
      metadata: { local: true },
    };
    
    this.loadedModels.set(handle.id, handle);
    
    this.telemetry.emitEvent(EventTypes.MODEL_SELECTED, "local-runtime", { 
      action: "load", modelId: model.id, handleId: handle.id 
    });
    
    return handle;
  }

  async unloadModel(handle: ModelHandle): Promise<void> {
    this.loadedModels.delete(handle.id);
    
    this.telemetry.emitEvent(EventTypes.MODEL_SELECTED, "local-runtime", { 
      action: "unload", modelId: handle.model.id, handleId: handle.id 
    });
  }

  async generate(handle: ModelHandle, request: GenerationRequest): Promise<GenerationResponse> {
    const startTime = Date.now();
    
    // Local runtime is a stub - returns a mock response
    // In reality, this would integrate with a local inference engine
    const latencyMs = Date.now() - startTime;
    
    const response: GenerationResponse = {
      id: generateId(),
      text: `[Local Runtime] Mock response for: ${request.prompt.substring(0, 100)}...`,
      finishReason: "stop",
      usage: {
        promptTokens: Math.ceil(request.prompt.length / 4),
        completionTokens: 50,
        totalTokens: Math.ceil(request.prompt.length / 4) + 50,
      },
      latencyMs,
      model: handle.model.name,
      metadata: { local: true, mock: true },
    };
    
    this.telemetry.emitEvent(EventTypes.MODEL_EXECUTED, "local-runtime", { 
      handleId: handle.id, modelId: handle.model.id, tokensUsed: response.usage.totalTokens, latencyMs 
    });
    
    return response;
  }

  async health(): Promise<RuntimeHealth> {
    return {
      healthy: true,
      version: this.version,
      modelsLoaded: this.loadedModels.size,
      memoryUsage: 0,
      errors: [],
    };
  }
}

export function createLocalRuntime(): LocalRuntime {
  return new LocalRuntime();
}