import {
  RoutingPolicySchema,
  RoutingDecisionSchema,
  ModelSchema,
  ProviderSchema,
  HardwareProfileSchema,
  PrivacyLevelSchema,
  type RoutingPolicy,
  type RoutingDecision,
  type Model,
  type Provider,
  type HardwareProfile,
  type PrivacyLevel,
} from "@seai/core";
import { generateId, nowISO, Result } from "@seai/core";
import { createTelemetry, EventTypes, type Telemetry } from "@seai/core";
import { SecurityEngine, type SecurityContext } from "@seai/core";
import { PolicyEngine, type PolicyContext } from "@seai/core";

import { type ModelCapability } from "@seai/core";

export interface RoutingContext {
  task: {
    id: string;
    type: string;
    capability?: ModelCapability;
    privacy: PrivacyLevel;
    qualityTarget?: number;
    latencyBudgetMs?: number;
    costBudget?: number;
  };
  hardware: HardwareProfile;
  availableModels: Model[];
  availableProviders: Provider[];
  securityContext: SecurityContext;
  policyContext: PolicyContext;
}

export interface RoutingRule {
  id: string;
  name: string;
  description: string;
  condition: (context: RoutingContext) => boolean;
  action: RoutingAction;
  priority: number;
}

export interface RoutingAction {
  type: "route" | "escalate" | "fallback" | "reject";
  model?: string;
  runtime?: string;
  provider?: string;
  fallbackChain?: string[];
  reason: string;
}

export interface RoutingResult {
  decision: RoutingDecision;
  appliedRules: string[];
  fallbackOptions: RoutingDecision[];
  confidence: number;
}

export class RoutingEngine {
  private policies: Map<string, RoutingPolicy> = new Map();
  private rules: RoutingRule[] = [];
  private telemetry: Telemetry;
  private securityEngine: SecurityEngine;
  private policyEngine: PolicyEngine;

  constructor(telemetry: Telemetry, securityEngine: SecurityEngine, policyEngine: PolicyEngine) {
    this.telemetry = telemetry;
    this.securityEngine = securityEngine;
    this.policyEngine = policyEngine;
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    this.rules = [
      {
        id: "privacy-gate",
        name: "Privacy Gate",
        description: "Block routing to providers that don't meet privacy requirements",
        condition: (ctx) => {
          if (["confidential", "restricted"].includes(ctx.task.privacy)) {
            return ctx.availableProviders.some(p => 
              ["confidential", "restricted"].includes(p.privacy) && 
              ["approved", "canary", "active"].includes(p.verificationState)
            ) === false;
          }
          return false;
        },
        action: {
          type: "reject",
          reason: "No approved provider meets privacy requirements",
        },
        priority: 100,
      },
      {
        id: "capability-match",
        name: "Capability Match",
        description: "Select model that has required capability",
        condition: (ctx) => !!ctx.task.capability,
        action: {
          type: "route",
          reason: "Filter models by required capability",
        },
        priority: 90,
      },
      {
        id: "quality-target",
        name: "Quality Target",
        description: "Prefer models that meet quality target",
        condition: (ctx) => !!ctx.task.qualityTarget,
        action: {
          type: "route",
          reason: "Select highest quality model within budget",
        },
        priority: 80,
      },
      {
        id: "latency-budget",
        name: "Latency Budget",
        description: "Select model within latency budget",
        condition: (ctx) => !!ctx.task.latencyBudgetMs,
        action: {
          type: "route",
          reason: "Select fastest model within latency budget",
        },
        priority: 70,
      },
      {
        id: "cost-budget",
        name: "Cost Budget",
        description: "Select model within cost budget",
        condition: (ctx) => !!ctx.task.costBudget,
        action: {
          type: "route",
          reason: "Select cheapest model within cost budget",
        },
        priority: 60,
      },
      {
        id: "hardware-compatibility",
        name: "Hardware Compatibility",
        description: "Select model compatible with available hardware",
        condition: () => true,
        action: {
          type: "route",
          reason: "Filter models by hardware compatibility",
        },
        priority: 50,
      },
      {
        id: "provider-health",
        name: "Provider Health",
        description: "Prefer healthy providers",
        condition: () => true,
        action: {
          type: "route",
          reason: "Select model from healthy provider",
        },
        priority: 40,
      },
      {
        id: "benchmark-history",
        name: "Benchmark History",
        description: "Prefer models with good benchmark history",
        condition: () => true,
        action: {
          type: "route",
          reason: "Select model with best benchmark scores",
        },
        priority: 30,
      },
      {
        id: "default-fallback",
        name: "Default Fallback",
        description: "Use default model if no other rules apply",
        condition: () => true,
        action: {
          type: "fallback",
          fallbackChain: [],
          reason: "Default fallback",
        },
        priority: 10,
      },
    ];
  }

  addRule(rule: RoutingRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index >= 0) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  getRules(): RoutingRule[] {
    return [...this.rules];
  }

  registerPolicy(policy: RoutingPolicy): void {
    this.policies.set(policy.id, policy);
  }

  getPolicy(id: string): RoutingPolicy | undefined {
    return this.policies.get(id);
  }

  async route(context: RoutingContext): Promise<RoutingResult> {
    const appliedRules: string[] = [];
    let candidateModels = [...context.availableModels];
    let candidateProviders = [...context.availableProviders];
    let decision: RoutingDecision | null = null;
    let fallbackOptions: RoutingDecision[] = [];

    for (const rule of this.rules) {
      if (rule.condition(context)) {
        appliedRules.push(rule.id);
        
        switch (rule.action.type) {
          case "reject":
            this.telemetry.emitEvent(
              EventTypes.POLICY_DENIED,
              "routing-engine",
              { taskId: context.task.id, ruleId: rule.id, reason: rule.action.reason }
            );
            return {
              decision: {
                model: "",
                runtime: "",
                provider: "",
                fallback: [],
                reasoning: rule.action.reason,
                confidence: 0,
              },
              appliedRules,
              fallbackOptions: [],
              confidence: 0,
            };
          
          case "route":
            const filtered = await this.applyRoutingRule(context, rule, candidateModels, candidateProviders);
            candidateModels = filtered.models;
            candidateProviders = filtered.providers;
            break;
          
          case "escalate":
            break;
          
          case "fallback":
            if (rule.action.fallbackChain) {
              fallbackOptions = this.buildFallbackChain(context, rule.action.fallbackChain);
            }
            break;
        }
      }
    }

    if (candidateModels.length === 0) {
      return {
        decision: {
          model: "",
          runtime: "",
          provider: "",
          fallback: fallbackOptions.map(f => f.model),
          reasoning: "No suitable model found",
          confidence: 0,
        },
        appliedRules,
        fallbackOptions,
        confidence: 0,
      };
    }

    const selectedModel = candidateModels[0];
    const selectedProvider = candidateProviders.find(p => p.models.includes(selectedModel.id)) || candidateProviders[0];
    
    decision = {
      model: selectedModel.id,
      runtime: this.selectRuntime(selectedModel, context.hardware),
      provider: selectedProvider?.id || "",
      fallback: fallbackOptions.map(f => f.model),
      reasoning: `Selected ${selectedModel.name} via ${appliedRules.join(", ")}`,
      confidence: this.calculateConfidence(selectedModel, context),
      estimatedCost: this.estimateCost(selectedModel, context.task),
      estimatedLatencyMs: this.estimateLatency(selectedModel, context.task),
    };

    const validated = RoutingDecisionSchema.parse(decision);

    this.telemetry.emitEvent(
      EventTypes.MODEL_SELECTED,
      "routing-engine",
      { taskId: context.task.id, decision: validated, appliedRules }
    );

    return {
      decision: validated,
      appliedRules,
      fallbackOptions,
      confidence: validated.confidence,
    };
  }

  private async applyRoutingRule(
    context: RoutingContext,
    rule: RoutingRule,
    models: Model[],
    providers: Provider[]
  ): Promise<{ models: Model[]; providers: Provider[] }> {
    let filteredModels = [...models];
    let filteredProviders = [...providers];

    switch (rule.id) {
      case "capability-match":
        if (context.task.capability) {
          filteredModels = filteredModels.filter(m => m.capabilities.includes(context.task.capability!));
          filteredProviders = filteredProviders.filter(p => p.capabilities.includes(context.task.capability!));
        }
        break;

      case "quality-target":
        if (context.task.qualityTarget) {
          filteredModels = filteredModels.filter(m => {
            if (!m.benchmarkScores) return true;
            const avgScore = Object.values(m.benchmarkScores).reduce((a, b) => a + b, 0) / Object.values(m.benchmarkScores).length;
            return avgScore >= context.task.qualityTarget!;
          });
        }
        break;

      case "latency-budget":
        if (context.task.latencyBudgetMs) {
          filteredModels = filteredModels.filter(m => 
            !m.latency?.p50Ms || m.latency.p50Ms <= context.task.latencyBudgetMs!
          );
        }
        break;

      case "cost-budget":
        if (context.task.costBudget) {
          filteredModels = filteredModels.filter(m => {
            if (!m.costPerToken?.input || !m.costPerToken?.output) return true;
            return (m.costPerToken.input + m.costPerToken.output) <= context.task.costBudget!;
          });
        }
        break;

      case "hardware-compatibility":
        filteredModels = filteredModels.filter(m => this.isHardwareCompatible(m, context.hardware));
        break;

      case "provider-health":
        filteredProviders = filteredProviders.filter(p => ["canary", "active"].includes(p.verificationState));
        filteredModels = filteredModels.filter(m => filteredProviders.some(p => p.models.includes(m.id)));
        break;

      case "benchmark-history":
        filteredModels.sort((a, b) => {
          const aScore = a.benchmarkScores ? Object.values(a.benchmarkScores).reduce((x, y) => x + y, 0) / Object.values(a.benchmarkScores).length : 0;
          const bScore = b.benchmarkScores ? Object.values(b.benchmarkScores).reduce((x, y) => x + y, 0) / Object.values(b.benchmarkScores).length : 0;
          return bScore - aScore;
        });
        break;
    }

    return { models: filteredModels, providers: filteredProviders };
  }

  private isHardwareCompatible(model: Model, hardware: HardwareProfile): boolean {
    if (!model.hardwareRequirements) return true;
    
    const req = model.hardwareRequirements;
    
    if (req.minRamBytes && hardware.memory.totalBytes < req.minRamBytes) return false;
    if (req.minVramBytes && hardware.gpu.present && hardware.gpu.memoryBytes && hardware.gpu.memoryBytes < req.minVramBytes) return false;
    if (req.requiresAccelerator && !hardware.gpu.present && !hardware.accelerator?.present) return false;
    if (req.preferredArchitecture && req.preferredArchitecture.length > 0 && !req.preferredArchitecture.includes(hardware.cpu.architecture)) return false;
    
    return true;
  }

  private selectRuntime(model: Model, hardware: HardwareProfile): string {
    if (hardware.gpu.present && hardware.gpu.vendor === "Apple") {
      return "mlx";
    }
    if (hardware.gpu.present && hardware.gpu.vendor === "NVIDIA") {
      return "llamacpp";
    }
    if (hardware.accelerator?.present) {
      return "llamacpp";
    }
    return "ollama";
  }

  private calculateConfidence(model: Model, context: RoutingContext): number {
    let confidence = 0.5;
    
    if (model.benchmarkScores && Object.keys(model.benchmarkScores).length > 0) {
      confidence += 0.2;
    }
    
    if (model.latency?.p50Ms && context.task.latencyBudgetMs && model.latency.p50Ms < context.task.latencyBudgetMs) {
      confidence += 0.1;
    }
    
    if (model.costPerToken && context.task.costBudget) {
      const cost = (model.costPerToken.input || 0) + (model.costPerToken.output || 0);
      if (cost < context.task.costBudget) {
        confidence += 0.1;
      }
    }
    
    if (this.isHardwareCompatible(model, context.hardware)) {
      confidence += 0.1;
    }
    
    return Math.min(1, confidence);
  }

  private estimateCost(model: Model, task: RoutingContext["task"]): number | undefined {
    if (!model.costPerToken?.input || !model.costPerToken?.output) return undefined;
    const estimatedTokens = 1000;
    return estimatedTokens * (model.costPerToken.input + model.costPerToken.output);
  }

  private estimateLatency(model: Model, task: RoutingContext["task"]): number | undefined {
    if (!model.latency?.p50Ms) return undefined;
    return model.latency.p50Ms;
  }

  private buildFallbackChain(context: RoutingContext, chain: string[]): RoutingDecision[] {
    return chain.map((modelId, index) => {
      const model = context.availableModels.find(m => m.id === modelId);
      if (!model) return null;
      
      return {
        model: model.id,
        runtime: this.selectRuntime(model, context.hardware),
        provider: context.availableProviders.find(p => p.models.includes(model.id))?.id || "",
        fallback: chain.slice(index + 1),
        reasoning: `Fallback ${index + 1}: ${model.name}`,
        confidence: 0.5 - index * 0.1,
      };
    }).filter(Boolean) as RoutingDecision[];
  }
}

export function createRoutingEngine(
  telemetry: Telemetry,
  securityEngine: SecurityEngine,
  policyEngine: PolicyEngine
): RoutingEngine {
  return new RoutingEngine(telemetry, securityEngine, policyEngine);
}

export const routingEngine = createRoutingEngine(
  createTelemetry(),
  new SecurityEngine(),
  new PolicyEngine(new SecurityEngine())
);

export interface ModelSelector {
  select(context: RoutingContext): Promise<RoutingResult>;
}

export class CompositeModelSelector implements ModelSelector {
  private engines: Map<string, RoutingEngine> = new Map();
  private defaultEngine: string;

  constructor(defaultEngine: string) {
    this.defaultEngine = defaultEngine;
  }

  addEngine(name: string, engine: RoutingEngine): void {
    this.engines.set(name, engine);
  }

  async select(context: RoutingContext): Promise<RoutingResult> {
    const engine = this.engines.get(this.defaultEngine);
    if (!engine) {
      throw new Error(`Routing engine not found: ${this.defaultEngine}`);
    }
    return engine.route(context);
  }
}

export function createCompositeSelector(defaultEngine: string): CompositeModelSelector {
  return new CompositeModelSelector(defaultEngine);
}

export const DEFAULT_ROUTING_POLICY: RoutingPolicy = {
  id: "default",
  name: "Default Routing Policy",
  rules: [
    {
      condition: { operation: "model.select", privacyLevel: "restricted" },
      action: "reject",
      target: undefined,
      priority: 100,
    },
    {
      condition: { operation: "model.select", privacyLevel: "confidential" },
      action: "reject",
      target: undefined,
      priority: 95,
    },
    {
      condition: { operation: "model.select" },
      action: "route",
      target: "best-match",
      priority: 50,
    },
  ],
  defaultRoute: "best-match",
  fallbackChain: [],
};

export function createDefaultRoutingContext(
  taskId: string,
  taskType: string,
  privacy: PrivacyLevel,
  hardware: HardwareProfile,
  availableModels: Model[],
  availableProviders: Provider[],
  securityContext: SecurityContext,
  policyContext: PolicyContext,
  options?: {
    capability?: string;
    qualityTarget?: number;
    latencyBudgetMs?: number;
    costBudget?: number;
  }
): RoutingContext {
  return {
    task: {
      id: taskId,
      type: taskType,
      capability: options?.capability as ModelCapability | undefined,
      privacy,
      qualityTarget: options?.qualityTarget,
      latencyBudgetMs: options?.latencyBudgetMs,
      costBudget: options?.costBudget,
    },
    hardware,
    availableModels,
    availableProviders,
    securityContext,
    policyContext,
  };
}