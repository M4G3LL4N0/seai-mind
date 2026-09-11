import {
  ProviderSchema,
  ProviderLifecycleSchema,
  ModelSchema,
  ModelCapabilitySchema,
  PrivacyLevelSchema,
  type Provider,
  type ProviderLifecycle,
  type Model,
  type ModelCapability,
  type PrivacyLevel,
} from "@seai/core";
import { generateId, nowISO, Result, SEAIBaseError } from "@seai/core";
import { createTelemetry, EventTypes, type Telemetry } from "@seai/core";

export interface ProviderDiscoveryResult {
  provider: Provider;
  models: Model[];
  verificationState: ProviderLifecycle;
}

export interface ProviderVerificationResult {
  providerId: string;
  passed: boolean;
  checks: VerificationCheck[];
  verifiedAt: string;
}

export interface VerificationCheck {
  name: string;
  passed: boolean;
  details?: string;
  severity: "info" | "warning" | "error";
}

export interface ProviderBenchmarkResult {
  providerId: string;
  modelId: string;
  latency: {
    p50Ms: number;
    p95Ms: number;
    p99Ms: number;
  };
  throughput: {
    tokensPerSecond: number;
  };
  reliability: number;
  errors: string[];
  benchmarkedAt: string;
}

export interface ProviderHealth {
  providerId: string;
  healthy: boolean;
  latencyMs: number;
  errorRate: number;
  lastChecked: string;
  details?: Record<string, unknown>;
}

export class ProviderManager {
  private providers: Map<string, Provider> = new Map();
  private telemetry: Telemetry;
  private healthCache: Map<string, ProviderHealth> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(telemetry: Telemetry) {
    this.telemetry = telemetry;
  }

  async discoverProvider(endpoint: string, name?: string): Promise<ProviderDiscoveryResult> {
    try {
      const response = await fetch(`${endpoint}/v1/models`, { method: "GET" });
      if (!response.ok) {
        throw new Error(`Failed to discover provider: ${response.statusText}`);
      }
      
      const data = await response.json();
      const models = this.parseModels(data, endpoint);
      
      const provider: Provider = {
        id: generateId(),
        name: name || new URL(endpoint).hostname,
        endpoint,
        region: this.extractRegion(endpoint),
        pricing: undefined,
        privacy: "internal",
        capabilities: this.extractCapabilities(models),
        latency: undefined,
        reliability: undefined,
        rateLimits: undefined,
        models: models.map(m => m.id),
        verificationState: "discovered",
        verifiedAt: undefined,
      };
      
      return { provider, models, verificationState: "discovered" };
    } catch (error) {
      this.telemetry.emitEvent(
        EventTypes.SECURITY_ALERT,
        "provider-manager",
        { action: "discover", endpoint, error: String(error) }
      );
      throw new SEAIBaseError("PROVIDER_DISCOVERY_FAILED", `Failed to discover provider: ${error}`, { statusCode: 502 });
    }
  }

  private parseModels(data: any, endpoint: string): Model[] {
    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }
    
    return data.data.map((model: any) => ({
      id: generateId(),
      provider: endpoint,
      name: model.id,
      version: model.version || "1.0.0",
      parameterCount: model.parameter_count,
      contextWindow: model.context_window || 4096,
      modalities: this.inferModalities(model.id),
      license: model.license,
      quantization: model.quantization,
      hardwareRequirements: undefined,
      capabilities: this.inferCapabilities(model.id),
      benchmarkScores: undefined,
      costPerToken: undefined,
      privacy: "internal",
      latency: undefined,
      reliability: undefined,
      availability: undefined,
    }));
  }

  private inferModalities(modelId: string): ModelCapability[] {
    const modalities: ModelCapability[] = ["text-generation", "chat"];
    const id = modelId.toLowerCase();
    
    if (id.includes("code") || id.includes("coder")) {
      modalities.push("coding");
    }
    if (id.includes("vision") || id.includes("vl") || id.includes("multimodal")) {
      modalities.push("vision");
    }
    if (id.includes("embed")) {
      modalities.push("embedding");
    }
    if (id.includes("rerank")) {
      modalities.push("reranking");
    }
    if (id.includes("function") || id.includes("tool")) {
      modalities.push("function-calling");
    }
    if (id.includes("struct") || id.includes("json")) {
      modalities.push("structured-output");
    }
    
    return modalities;
  }

  private inferCapabilities(modelId: string): ModelCapability[] {
    return this.inferModalities(modelId);
  }

  private extractCapabilities(models: Model[]): ModelCapability[] {
    const capabilities = new Set<ModelCapability>();
    for (const model of models) {
      for (const cap of model.capabilities) {
        capabilities.add(cap);
      }
    }
    return Array.from(capabilities);
  }

  private extractRegion(endpoint: string): string | undefined {
    try {
      const url = new URL(endpoint);
      const hostname = url.hostname;
      if (hostname.includes("us-east")) return "us-east-1";
      if (hostname.includes("us-west")) return "us-west-2";
      if (hostname.includes("eu-west")) return "eu-west-1";
      if (hostname.includes("eu-central")) return "eu-central-1";
      if (hostname.includes("ap-south")) return "ap-south-1";
      if (hostname.includes("ap-northeast")) return "ap-northeast-1";
      return "unknown";
    } catch {
      return undefined;
    }
  }

  registerProvider(provider: Provider): Provider {
    const validated = ProviderSchema.parse(provider);
    this.providers.set(validated.id, validated);
    
    this.telemetry.emitEvent(
      EventTypes.MODEL_SELECTED,
      "provider-manager",
      { action: "register", providerId: validated.id, providerName: validated.name }
    );
    
    return validated;
  }

  unregisterProvider(providerId: string): boolean {
    const deleted = this.providers.delete(providerId);
    this.healthCache.delete(providerId);
    return deleted;
  }

  getProvider(providerId: string): Provider | undefined {
    return this.providers.get(providerId);
  }

  listProviders(filters?: { lifecycle?: ProviderLifecycle; region?: string }): Provider[] {
    let providers = Array.from(this.providers.values());
    
    if (filters?.lifecycle) {
      providers = providers.filter(p => p.verificationState === filters.lifecycle);
    }
    
    if (filters?.region) {
      providers = providers.filter(p => p.region === filters.region);
    }
    
    return providers;
  }

  async verifyProvider(providerId: string): Promise<ProviderVerificationResult> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new SEAIBaseError("PROVIDER_NOT_FOUND", `Provider not found: ${providerId}`, { statusCode: 404 });
    }

    const checks: VerificationCheck[] = [];
    
    const connectivity = await this.checkConnectivity(provider);
    checks.push(connectivity);
    
    const modelAvailability = await this.checkModelAvailability(provider);
    checks.push(modelAvailability);
    
    const latency = await this.checkLatency(provider);
    checks.push(latency);
    
    const privacy = this.checkPrivacy(provider);
    checks.push(privacy);
    
    const passed = checks.every(c => c.passed || c.severity === "info" || c.severity === "warning");
    
    if (passed) {
      provider.verificationState = "verified";
      provider.verifiedAt = nowISO();
      this.providers.set(providerId, provider);
    }
    
    const result: ProviderVerificationResult = {
      providerId,
      passed,
      checks,
      verifiedAt: nowISO(),
    };
    
    this.telemetry.emitEvent(
      EventTypes.MODEL_SELECTED,
      "provider-manager",
      { action: "verify", providerId, passed, checks: checks.length }
    );
    
    return result;
  }

  private async checkConnectivity(provider: Provider): Promise<VerificationCheck> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${provider.endpoint}/health`, { 
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      
      return {
        name: "connectivity",
        passed: response.ok,
        details: response.ok ? "Health endpoint reachable" : `Health check failed: ${response.status}`,
        severity: response.ok ? "info" : "error",
      };
    } catch (error) {
      return {
        name: "connectivity",
        passed: false,
        details: `Connection failed: ${error}`,
        severity: "error",
      };
    }
  }

  private async checkModelAvailability(provider: Provider): Promise<VerificationCheck> {
    try {
      const response = await fetch(`${provider.endpoint}/v1/models`, { method: "GET" });
      if (!response.ok) {
        return {
          name: "model-availability",
          passed: false,
          details: `Models endpoint failed: ${response.status}`,
          severity: "error",
        };
      }
      
      const data = await response.json() as { data?: unknown[] };
      const modelCount = data.data?.length || 0;
      
      return {
        name: "model-availability",
        passed: modelCount > 0,
        details: `${modelCount} models available`,
        severity: modelCount > 0 ? "info" : "warning",
      };
    } catch (error) {
      return {
        name: "model-availability",
        passed: false,
        details: `Model check failed: ${error}`,
        severity: "error",
      };
    }
  }

  private async checkLatency(provider: Provider): Promise<VerificationCheck> {
    const latencies: number[] = [];
    const attempts = 3;
    
    for (let i = 0; i < attempts; i++) {
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        await fetch(`${provider.endpoint}/health`, { method: "GET", signal: controller.signal });
        clearTimeout(timeout);
        latencies.push(Date.now() - start);
      } catch {
        latencies.push(10000);
      }
    }
    
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const passed = avgLatency < 5000;
    
    return {
      name: "latency",
      passed,
      details: `Average latency: ${avgLatency.toFixed(0)}ms`,
      severity: passed ? "info" : "warning",
    };
  }

  private checkPrivacy(provider: Provider): VerificationCheck {
    const privacyLevels: PrivacyLevel[] = ["public", "internal", "private", "confidential", "restricted"];
    const providerLevel = privacyLevels.indexOf(provider.privacy);
    const minRequired = privacyLevels.indexOf("internal");
    
    return {
      name: "privacy",
      passed: providerLevel >= minRequired,
      details: `Provider privacy level: ${provider.privacy}`,
      severity: providerLevel >= minRequired ? "info" : "warning",
    };
  }

  async benchmarkProvider(providerId: string, modelId: string): Promise<ProviderBenchmarkResult> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new SEAIBaseError("PROVIDER_NOT_FOUND", `Provider not found: ${providerId}`, { statusCode: 404 });
    }

    const testPrompts = [
      "Hello, how are you?",
      "Explain quantum computing in simple terms.",
      "Write a Python function to calculate fibonacci numbers.",
    ];

    const latencies: number[] = [];
    let totalTokens = 0;
    let successfulRequests = 0;
    const errors: string[] = [];

    for (const prompt of testPrompts) {
      const start = Date.now();
      try {
        const response = await fetch(`${provider.endpoint}/v1/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: modelId,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 100,
            temperature: 0.7,
          }),
        });
        
        if (response.ok) {
          const data = await response.json() as { usage?: { completion_tokens?: number } };
          const latency = Date.now() - start;
          latencies.push(latency);
          totalTokens += data.usage?.completion_tokens || 50;
          successfulRequests++;
        } else {
          errors.push(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        errors.push(String(error));
      }
    }

    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
    const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
    const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
    
    const totalTime = latencies.reduce((a, b) => a + b, 0) / 1000;
    const tokensPerSecond = totalTime > 0 ? totalTokens / totalTime : 0;
    const reliability = testPrompts.length > 0 ? successfulRequests / testPrompts.length : 0;

    const result: ProviderBenchmarkResult = {
      providerId,
      modelId,
      latency: { p50Ms: p50, p95Ms: p95, p99Ms: p99 },
      throughput: { tokensPerSecond },
      reliability,
      errors,
      benchmarkedAt: nowISO(),
    };

    if (reliability > 0.8 && p95 < 5000) {
      provider.verificationState = "benchmarked";
      this.providers.set(providerId, provider);
    }

    this.telemetry.emitEvent(
      EventTypes.BENCHMARK_COMPLETED,
      "provider-manager",
      { action: "benchmark", providerId, modelId, reliability, p95 }
    );

    return result;
  }

  async approveProvider(providerId: string): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) return false;
    
    if (!["verified", "benchmarked"].includes(provider.verificationState)) {
      return false;
    }
    
    provider.verificationState = "approved";
    this.providers.set(providerId, provider);
    
    this.telemetry.emitEvent(
      EventTypes.MODEL_SELECTED,
      "provider-manager",
      { action: "approve", providerId }
    );
    
    return true;
  }

  async promoteToCanary(providerId: string): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) return false;
    
    if (provider.verificationState !== "approved") return false;
    
    provider.verificationState = "canary";
    this.providers.set(providerId, provider);
    
    this.telemetry.emitEvent(
      EventTypes.MODEL_SELECTED,
      "provider-manager",
      { action: "canary", providerId }
    );
    
    return true;
  }

  async activateProvider(providerId: string): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) return false;
    
    if (provider.verificationState !== "canary") return false;
    
    provider.verificationState = "active";
    this.providers.set(providerId, provider);
    
    this.telemetry.emitEvent(
      EventTypes.MODEL_SELECTED,
      "provider-manager",
      { action: "activate", providerId }
    );
    
    return true;
  }

  async deprecateProvider(providerId: string): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) return false;
    
    provider.verificationState = "deprecated";
    this.providers.set(providerId, provider);
    
    this.telemetry.emitEvent(
      EventTypes.MODEL_SELECTED,
      "provider-manager",
      { action: "deprecate", providerId }
    );
    
    return true;
  }

  async blockProvider(providerId: string): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) return false;
    
    provider.verificationState = "blocked";
    this.providers.set(providerId, provider);
    
    this.telemetry.emitEvent(
      EventTypes.SECURITY_ALERT,
      "provider-manager",
      { action: "block", providerId }
    );
    
    return true;
  }

  startHealthChecks(intervalMs: number = 60000): void {
    if (this.healthCheckInterval) return;
    
    this.healthCheckInterval = setInterval(async () => {
      for (const provider of this.providers.values()) {
        if (["canary", "active"].includes(provider.verificationState)) {
          await this.checkProviderHealth(provider.id);
        }
      }
    }, intervalMs);
    
    this.healthCheckInterval.unref();
  }

  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  private async checkProviderHealth(providerId: string): Promise<ProviderHealth> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return { providerId, healthy: false, latencyMs: 0, errorRate: 1, lastChecked: nowISO() };
    }

    const start = Date.now();
    let healthy = false;
    let errorRate = 0;
    
    try {
      const response = await fetch(`${provider.endpoint}/health`, { method: "GET" });
      healthy = response.ok;
      errorRate = response.ok ? 0 : 1;
    } catch {
      healthy = false;
      errorRate = 1;
    }

    const health: ProviderHealth = {
      providerId,
      healthy,
      latencyMs: Date.now() - start,
      errorRate,
      lastChecked: nowISO(),
    };

    this.healthCache.set(providerId, health);
    
    if (!healthy) {
      this.telemetry.emitEvent(
        EventTypes.SECURITY_ALERT,
        "provider-manager",
        { action: "health-check", providerId, healthy: false }
      );
    }
    
    return health;
  }

  getProviderHealth(providerId: string): ProviderHealth | undefined {
    return this.healthCache.get(providerId);
  }

  getAllProviderHealth(): ProviderHealth[] {
    return Array.from(this.healthCache.values());
  }
}

export function createProviderManager(telemetry?: Telemetry): ProviderManager {
  return new ProviderManager(telemetry || createTelemetry());
}

export const providerManager = createProviderManager();

export const WELL_KNOWN_PROVIDERS = {
  ollama: {
    name: "Ollama",
    endpoint: "http://localhost:11434",
    capabilities: ["text-generation", "chat", "embedding", "vision"] as ModelCapability[],
  },
  lmstudio: {
    name: "LM Studio",
    endpoint: "http://localhost:1234",
    capabilities: ["text-generation", "chat", "embedding"] as ModelCapability[],
  },
  vllm: {
    name: "vLLM",
    endpoint: "http://localhost:8000",
    capabilities: ["text-generation", "chat", "embedding", "function-calling"] as ModelCapability[],
  },
  openai: {
    name: "OpenAI",
    endpoint: "https://api.openai.com",
    capabilities: ["text-generation", "chat", "embedding", "vision", "function-calling", "structured-output"] as ModelCapability[],
  },
  anthropic: {
    name: "Anthropic",
    endpoint: "https://api.anthropic.com",
    capabilities: ["text-generation", "chat", "vision", "function-calling"] as ModelCapability[],
  },
  together: {
    name: "Together AI",
    endpoint: "https://api.together.xyz",
    capabilities: ["text-generation", "chat", "embedding", "function-calling"] as ModelCapability[],
  },
  replicate: {
    name: "Replicate",
    endpoint: "https://api.replicate.com",
    capabilities: ["text-generation", "chat", "embedding", "vision"] as ModelCapability[],
  },
} as const;

export async function discoverWellKnownProviders(telemetry?: Telemetry): Promise<ProviderDiscoveryResult[]> {
  const manager = createProviderManager(telemetry);
  const results: ProviderDiscoveryResult[] = [];
  
  for (const [key, config] of Object.entries(WELL_KNOWN_PROVIDERS)) {
    try {
      const result = await manager.discoverProvider(config.endpoint, config.name);
      results.push(result);
    } catch {
      // Provider not available, skip
    }
  }
  
  return results;
}