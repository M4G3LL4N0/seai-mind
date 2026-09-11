import {
  ModelSchema,
  ModelCapabilitySchema,
  ProviderSchema,
  HardwareProfileSchema,
  type Model,
  type Provider,
  type HardwareProfile,
  type ModelCapability,
} from "@seai/core";
import { generateId, nowISO, Result, SEAIBaseError } from "@seai/core";
import { createTelemetry, EventTypes, type Telemetry } from "@seai/core";

export interface InferenceRuntime {
  name: string;
  version: string;
  discoverModels(): Promise<Model[]>;
  loadModel(model: Model): Promise<ModelHandle>;
  unloadModel(handle: ModelHandle): Promise<void>;
  generate(handle: ModelHandle, request: GenerationRequest): Promise<GenerationResponse>;
  health(): Promise<RuntimeHealth>;
  capabilities: RuntimeCapabilities;
}

export interface ModelHandle {
  id: string;
  model: Model;
  runtime: string;
  loadedAt: string;
  metadata?: Record<string, unknown>;
}

export interface GenerationRequest {
  prompt: string;
  systemPrompt?: string;
  messages?: Array<{ role: string; content: string }>;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
  stream?: boolean;
  responseFormat?: "text" | "json" | "structured";
  schema?: Record<string, unknown>;
  seed?: number;
  metadata?: Record<string, unknown>;
}

export interface GenerationResponse {
  id: string;
  text: string;
  finishReason: "stop" | "length" | "error" | "content_filter";
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  model: string;
  metadata?: Record<string, unknown>;
}

export interface RuntimeHealth {
  healthy: boolean;
  version: string;
  modelsLoaded: number;
  memoryUsage: number;
  gpuUsage?: number;
  errors: string[];
}

export interface RuntimeCapabilities {
  streaming: boolean;
  structuredOutput: boolean;
  functionCalling: boolean;
  vision: boolean;
  audio: boolean;
  maxContextWindow: number;
  supportedQuantizations: string[];
}

export interface ModelRegistry {
  register(model: Model): Promise<Model>;
  unregister(modelId: string): Promise<boolean>;
  get(modelId: string): Promise<Model | null>;
  list(filters?: ModelFilters): Promise<Model[]>;
  findByCapability(capability: ModelCapability): Promise<Model[]>;
  findByProvider(provider: string): Promise<Model[]>;
  findCompatible(hardware: HardwareProfile): Promise<Model[]>;
}

export interface ModelFilters {
  provider?: string;
  capability?: ModelCapability;
  minParameterCount?: number;
  maxParameterCount?: number;
  quantization?: string;
  privacyLevel?: string;
  verifiedOnly?: boolean;
}

export interface ProviderRegistry {
  register(provider: Provider): Promise<Provider>;
  unregister(providerId: string): Promise<boolean>;
  get(providerId: string): Promise<Provider | null>;
  list(filters?: ProviderFilters): Promise<Provider[]>;
  getByLifecycle(state: string): Promise<Provider[]>;
}

export interface ProviderFilters {
  region?: string;
  capability?: ModelCapability;
  verifiedOnly?: boolean;
}

export class ModelRegistryImpl implements ModelRegistry {
  private models: Map<string, Model> = new Map();
  private telemetry: Telemetry;

  constructor(telemetry: Telemetry) {
    this.telemetry = telemetry;
  }

  async register(model: Model): Promise<Model> {
    const validated = ModelSchema.parse(model);
    this.models.set(validated.id, validated);
    
    this.telemetry.emitEvent(
      EventTypes.MODEL_SELECTED,
      "model-registry",
      { action: "register", modelId: validated.id, modelName: validated.name }
    );
    
    return validated;
  }

  async unregister(modelId: string): Promise<boolean> {
    const deleted = this.models.delete(modelId);
    if (deleted) {
      this.telemetry.emitEvent(
        EventTypes.MODEL_SELECTED,
        "model-registry",
        { action: "unregister", modelId }
      );
    }
    return deleted;
  }

  async get(modelId: string): Promise<Model | null> {
    return this.models.get(modelId) || null;
  }

  async list(filters: ModelFilters = {}): Promise<Model[]> {
    let models = Array.from(this.models.values());
    
    if (filters.provider) {
      models = models.filter(m => m.provider === filters.provider);
    }
    
    if (filters.capability) {
      models = models.filter(m => m.capabilities.includes(filters.capability!));
    }
    
    if (filters.minParameterCount) {
      models = models.filter(m => (m.parameterCount || 0) >= filters.minParameterCount!);
    }
    
    if (filters.maxParameterCount) {
      models = models.filter(m => (m.parameterCount || Infinity) <= filters.maxParameterCount!);
    }
    
    if (filters.quantization) {
      models = models.filter(m => m.quantization === filters.quantization);
    }
    
    if (filters.privacyLevel) {
      models = models.filter(m => m.privacy === filters.privacyLevel);
    }
    
    if (filters.verifiedOnly) {
      models = models.filter(m => m.benchmarkScores && Object.keys(m.benchmarkScores).length > 0);
    }
    
    return models;
  }

  async findByCapability(capability: ModelCapability): Promise<Model[]> {
    return this.list({ capability });
  }

  async findByProvider(provider: string): Promise<Model[]> {
    return this.list({ provider });
  }

  async findCompatible(hardware: HardwareProfile): Promise<Model[]> {
    const models = await this.list();
    return models.filter(model => {
      if (!model.hardwareRequirements) return true;
      
      const req = model.hardwareRequirements;
      
      if (req.minRamBytes && hardware.memory.totalBytes < req.minRamBytes) return false;
      if (req.minVramBytes && hardware.gpu.present && hardware.gpu.memoryBytes && hardware.gpu.memoryBytes < req.minVramBytes) return false;
      if (req.requiresAccelerator && !hardware.gpu.present && !hardware.accelerator?.present) return false;
      if (req.preferredArchitecture && req.preferredArchitecture.length > 0 && !req.preferredArchitecture.includes(hardware.cpu.architecture)) return false;
      
      return true;
    });
  }
}

export class ProviderRegistryImpl implements ProviderRegistry {
  private providers: Map<string, Provider> = new Map();
  private telemetry: Telemetry;

  constructor(telemetry: Telemetry) {
    this.telemetry = telemetry;
  }

  async register(provider: Provider): Promise<Provider> {
    const validated = ProviderSchema.parse(provider);
    this.providers.set(validated.id, validated);
    
    this.telemetry.emitEvent(
      EventTypes.MODEL_SELECTED,
      "provider-registry",
      { action: "register", providerId: validated.id, providerName: validated.name }
    );
    
    return validated;
  }

  async unregister(providerId: string): Promise<boolean> {
    const deleted = this.providers.delete(providerId);
    if (deleted) {
      this.telemetry.emitEvent(
        EventTypes.MODEL_SELECTED,
        "provider-registry",
        { action: "unregister", providerId }
      );
    }
    return deleted;
  }

  async get(providerId: string): Promise<Provider | null> {
    return this.providers.get(providerId) || null;
  }

  async list(filters: ProviderFilters = {}): Promise<Provider[]> {
    let providers = Array.from(this.providers.values());
    
    if (filters.region) {
      providers = providers.filter(p => p.region === filters.region);
    }
    
    if (filters.capability) {
      providers = providers.filter(p => p.capabilities.includes(filters.capability!));
    }
    
    if (filters.verifiedOnly) {
      providers = providers.filter(p => ["approved", "canary", "active"].includes(p.verificationState));
    }
    
    return providers;
  }

  async getByLifecycle(state: string): Promise<Provider[]> {
    return Array.from(this.providers.values()).filter(p => p.verificationState === state);
  }
}

export abstract class BaseRuntime implements InferenceRuntime {
  abstract name: string;
  abstract version: string;
  abstract capabilities: RuntimeCapabilities;

  protected telemetry: Telemetry;
  protected loadedModels: Map<string, ModelHandle> = new Map();

  constructor(telemetry: Telemetry) {
    this.telemetry = telemetry;
  }

  abstract discoverModels(): Promise<Model[]>;
  abstract loadModel(model: Model): Promise<ModelHandle>;
  abstract unloadModel(handle: ModelHandle): Promise<void>;
  abstract generate(handle: ModelHandle, request: GenerationRequest): Promise<GenerationResponse>;
  abstract health(): Promise<RuntimeHealth>;

  protected createHandle(model: Model, metadata?: Record<string, unknown>): ModelHandle {
    return {
      id: generateId(),
      model,
      runtime: this.name,
      loadedAt: nowISO(),
      metadata,
    };
  }

  protected emitModelEvent(type: string, handle: ModelHandle, payload: Record<string, unknown>): void {
    this.telemetry.emitEvent(
      type as any,
      this.name,
      { handleId: handle.id, modelId: handle.model.id, ...payload }
    );
  }
}

export class RuntimeManager {
  private runtimes: Map<string, InferenceRuntime> = new Map();
  private modelRegistry: ModelRegistryImpl;
  private providerRegistry: ProviderRegistryImpl;
  private telemetry: Telemetry;
  private defaultRuntime: string | null = null;

  constructor(telemetry?: Telemetry) {
    this.telemetry = telemetry || createTelemetry();
    this.modelRegistry = new ModelRegistryImpl(this.telemetry);
    this.providerRegistry = new ProviderRegistryImpl(this.telemetry);
  }

  registerRuntime(runtime: InferenceRuntime): void {
    this.runtimes.set(runtime.name, runtime);
    if (!this.defaultRuntime) {
      this.defaultRuntime = runtime.name;
    }
  }

  unregisterRuntime(name: string): boolean {
    const deleted = this.runtimes.delete(name);
    if (deleted && this.defaultRuntime === name) {
      this.defaultRuntime = this.runtimes.keys().next().value || null;
    }
    return deleted;
  }

  getRuntime(name: string): InferenceRuntime | undefined {
    return this.runtimes.get(name);
  }

  getDefaultRuntime(): InferenceRuntime | undefined {
    return this.defaultRuntime ? this.runtimes.get(this.defaultRuntime) : undefined;
  }

  setDefaultRuntime(name: string): boolean {
    if (this.runtimes.has(name)) {
      this.defaultRuntime = name;
      return true;
    }
    return false;
  }

  listRuntimes(): InferenceRuntime[] {
    return Array.from(this.runtimes.values());
  }

  getModelRegistry(): ModelRegistryImpl {
    return this.modelRegistry;
  }

  getProviderRegistry(): ProviderRegistryImpl {
    return this.providerRegistry;
  }

  async discoverAllModels(): Promise<Model[]> {
    const allModels: Model[] = [];
    for (const runtime of this.runtimes.values()) {
      try {
        const models = await runtime.discoverModels();
        allModels.push(...models);
      } catch (error) {
        this.telemetry.emitEvent(
          EventTypes.SECURITY_ALERT,
          "runtime-manager",
          { action: "discover-models", runtime: runtime.name, error: String(error) }
        );
      }
    }
    return allModels;
  }

  async loadModel(model: Model, runtimeName?: string): Promise<ModelHandle> {
    const runtime = runtimeName ? this.runtimes.get(runtimeName) : this.getDefaultRuntime();
    if (!runtime) {
      throw new SEAIBaseError("RUNTIME_NOT_FOUND", `Runtime not found: ${runtimeName || "default"}`, { statusCode: 404 });
    }
    
    const handle = await runtime.loadModel(model);
    this.emitModelEvent(EventTypes.MODEL_SELECTED, handle, { action: "load" });
    return handle;
  }

  async unloadModel(handle: ModelHandle): Promise<void> {
    const runtime = this.runtimes.get(handle.runtime);
    if (runtime) {
      await runtime.unloadModel(handle);
      this.emitModelEvent(EventTypes.MODEL_SELECTED, handle, { action: "unload" });
    }
  }

  async generate(handle: ModelHandle, request: GenerationRequest): Promise<GenerationResponse> {
    const runtime = this.runtimes.get(handle.runtime);
    if (!runtime) {
      throw new SEAIBaseError("RUNTIME_NOT_FOUND", `Runtime not found: ${handle.runtime}`, { statusCode: 404 });
    }
    
    this.emitModelEvent(EventTypes.MODEL_EXECUTED, handle, { action: "generate-start" });
    
    try {
      const response = await runtime.generate(handle, request);
      this.emitModelEvent(EventTypes.MODEL_EXECUTED, handle, { 
        action: "generate-complete", 
        tokensUsed: response.usage.totalTokens,
        latencyMs: response.latencyMs 
      });
      return response;
    } catch (error) {
      this.emitModelEvent(EventTypes.MODEL_EXECUTED, handle, { 
        action: "generate-error", 
        error: String(error) 
      });
      throw error;
    }
  }

  async healthCheck(): Promise<Map<string, RuntimeHealth>> {
    const results = new Map<string, RuntimeHealth>();
    for (const [name, runtime] of this.runtimes) {
      try {
        const health = await runtime.health();
        results.set(name, health);
      } catch (error) {
        results.set(name, {
          healthy: false,
          version: runtime.version,
          modelsLoaded: 0,
          memoryUsage: 0,
          errors: [String(error)],
        });
      }
    }
    return results;
  }

  private emitModelEvent(type: string, handle: ModelHandle, payload: Record<string, unknown>): void {
    this.telemetry.emitEvent(type as any, "runtime-manager", { handleId: handle.id, modelId: handle.model.id, ...payload });
  }
}

export function createRuntimeManager(telemetry?: Telemetry): RuntimeManager {
  return new RuntimeManager(telemetry);
}

export const runtimeManager = createRuntimeManager();

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function estimateCost(usage: { promptTokens: number; completionTokens: number }, costPerToken: { input: number; output: number }): number {
  return usage.promptTokens * costPerToken.input + usage.completionTokens * costPerToken.output;
}

export function selectOptimalModel(
  models: Model[],
  criteria: {
    capability?: ModelCapability;
    maxLatencyMs?: number;
    maxCost?: number;
    minQuality?: number;
    privacyLevel?: string;
  }
): Model | null {
  let candidates = models;
  
  if (criteria.capability) {
    candidates = candidates.filter(m => m.capabilities.includes(criteria.capability!));
  }
  
  if (criteria.privacyLevel) {
    candidates = candidates.filter(m => m.privacy === criteria.privacyLevel);
  }
  
  if (criteria.maxLatencyMs) {
    candidates = candidates.filter(m => 
      m.latency?.p50Ms && m.latency.p50Ms <= criteria.maxLatencyMs!
    );
  }
  
  if (criteria.maxCost) {
    candidates = candidates.filter(m => 
      m.costPerToken?.input && m.costPerToken.output &&
      (m.costPerToken.input + m.costPerToken.output) <= criteria.maxCost!
    );
  }
  
  if (criteria.minQuality) {
    candidates = candidates.filter(m => {
      const avgScore = m.benchmarkScores ? Object.values(m.benchmarkScores).reduce((a, b) => a + b, 0) / Object.values(m.benchmarkScores).length : 0;
      return avgScore >= criteria.minQuality!;
    });
  }
  
  if (candidates.length === 0) return null;
  
  return candidates.sort((a, b) => {
    const aScore = a.benchmarkScores ? Object.values(a.benchmarkScores).reduce((x, y) => x + y, 0) / Object.values(a.benchmarkScores).length : 0;
    const bScore = b.benchmarkScores ? Object.values(b.benchmarkScores).reduce((x, y) => x + y, 0) / Object.values(b.benchmarkScores).length : 0;
    return bScore - aScore;
  })[0];
}