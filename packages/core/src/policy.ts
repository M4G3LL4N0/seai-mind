import {
  PolicySchema,
  PrivacyLevelSchema,
  type Policy,
  type PrivacyLevel,
} from "./schemas.js";
import { generateId, nowISO } from "./kernel.js";
import { SecurityEngine, type SecurityContext } from "./security.js";

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  condition: (context: PolicyContext) => boolean;
  action: "allow" | "deny" | "require-approval" | "transform" | "log";
  transform?: (input: unknown) => unknown;
  priority: number;
  metadata?: Record<string, unknown>;
}

export interface PolicyContext {
  operation: string;
  resource: string;
  action: string;
  subject: SecurityContext;
  resourcePrivacyLevel: PrivacyLevel;
  resourceSecurityLevel: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface PolicyDecision {
  allowed: boolean;
  reason: string;
  policyId: string;
  ruleId: string;
  transformedInput?: unknown;
  requiredApprovals?: string[];
}

export interface PolicySet {
  id: string;
  name: string;
  description: string;
  policies: Policy[];
  rules: PolicyRule[];
  version: string;
  createdAt: string;
  updatedAt: string;
}

export class PolicyEngine {
  private policySets: Map<string, PolicySet> = new Map();
  private activePolicySet: string | null = null;
  private securityEngine: SecurityEngine;

  constructor(securityEngine: SecurityEngine) {
    this.securityEngine = securityEngine;
  }

  registerPolicySet(policySet: PolicySet): void {
    this.policySets.set(policySet.id, policySet);
  }

  getPolicySet(id: string): PolicySet | undefined {
    return this.policySets.get(id);
  }

  listPolicySets(): PolicySet[] {
    return Array.from(this.policySets.values());
  }

  setActivePolicySet(id: string): boolean {
    if (this.policySets.has(id)) {
      this.activePolicySet = id;
      return true;
    }
    return false;
  }

  getActivePolicySet(): PolicySet | null {
    if (this.activePolicySet) {
      return this.policySets.get(this.activePolicySet) || null;
    }
    return null;
  }

  evaluate(context: PolicyContext): PolicyDecision {
    const policySet = this.getActivePolicySet();
    if (!policySet) {
      return {
        allowed: true,
        reason: "No active policy set",
        policyId: "none",
        ruleId: "none",
      };
    }

    for (const rule of policySet.rules.sort((a, b) => b.priority - a.priority)) {
      if (rule.condition(context)) {
        const securityDecision = this.securityEngine.evaluate(context.subject, context.operation);
        
        if (!securityDecision.allowed && rule.action !== "allow") {
          return {
            allowed: false,
            reason: `Security policy denied: ${securityDecision.reason}`,
            policyId: policySet.id,
            ruleId: rule.id,
          };
        }

        switch (rule.action) {
          case "allow":
            return {
              allowed: true,
              reason: rule.description,
              policyId: policySet.id,
              ruleId: rule.id,
            };
          case "deny":
            return {
              allowed: false,
              reason: rule.description,
              policyId: policySet.id,
              ruleId: rule.id,
            };
          case "require-approval":
            return {
              allowed: false,
              reason: rule.description,
              policyId: policySet.id,
              ruleId: rule.id,
              requiredApprovals: [rule.id],
            };
          case "transform":
            return {
              allowed: true,
              reason: rule.description,
              policyId: policySet.id,
              ruleId: rule.id,
              transformedInput: rule.transform ? rule.transform(context.metadata) : undefined,
            };
          case "log":
            return {
              allowed: true,
              reason: rule.description,
              policyId: policySet.id,
              ruleId: rule.id,
            };
        }
      }
    }

    return {
      allowed: true,
      reason: "Default allow",
      policyId: policySet.id,
      ruleId: "default",
    };
  }

  evaluateBeforeModelSelection(context: PolicyContext): PolicyDecision {
    return this.evaluate({
      ...context,
      operation: "model.select",
      action: "select",
    });
  }

  evaluateBeforeProviderSelection(context: PolicyContext): PolicyDecision {
    return this.evaluate({
      ...context,
      operation: "provider.select",
      action: "select",
    });
  }

  evaluateBeforeToolExecution(context: PolicyContext): PolicyDecision {
    return this.evaluate({
      ...context,
      operation: "tool.execute",
      action: "execute",
    });
  }

  evaluateBeforeMemoryAccess(context: PolicyContext): PolicyDecision {
    return this.evaluate({
      ...context,
      operation: "memory.access",
      action: context.action,
    });
  }

  evaluateBeforeEvolution(context: PolicyContext): PolicyDecision {
    return this.evaluate({
      ...context,
      operation: "evolution.propose",
      action: "propose",
    });
  }

  evaluateBeforeImport(context: PolicyContext): PolicyDecision {
    return this.evaluate({
      ...context,
      operation: "import",
      action: "import",
    });
  }

  evaluateBeforeExport(context: PolicyContext): PolicyDecision {
    return this.evaluate({
      ...context,
      operation: "export",
      action: "export",
    });
  }

  createPolicySetFromSchema(schema: Policy): PolicySet {
    return {
      id: schema.id,
      name: schema.name,
      description: schema.description,
      policies: [schema],
      rules: schema.rules.map((rule: any, index: number) => ({
        id: rule.id || generateId(),
        name: rule.name || `Rule ${index}`,
        description: rule.description || "",
        condition: (ctx: PolicyContext) => this.evaluateCondition(rule.condition, ctx),
        action: rule.action || "allow",
        priority: rule.priority || 0,
        metadata: rule.metadata,
      })),
      version: "1.0.0",
      createdAt: schema.createdAt,
      updatedAt: schema.updatedAt,
    };
  }

  private evaluateCondition(condition: unknown, context: PolicyContext): boolean {
    if (typeof condition === "function") {
      return condition(context);
    }
    
    if (typeof condition === "object" && condition !== null) {
      const cond = condition as Record<string, unknown>;
      
      if (cond.operation) {
        if (Array.isArray(cond.operation)) {
          if (!cond.operation.includes(context.operation)) return false;
        } else if (cond.operation !== context.operation) {
          return false;
        }
      }
      
      if (cond.resource) {
        if (Array.isArray(cond.resource)) {
          if (!cond.resource.includes(context.resource)) return false;
        } else if (cond.resource !== context.resource) {
          return false;
        }
      }
      
      if (cond.action) {
        if (Array.isArray(cond.action)) {
          if (!cond.action.includes(context.action)) return false;
        } else if (cond.action !== context.action) {
          return false;
        }
      }
      
      if (cond.privacyLevel) {
        const levels: PrivacyLevel[] = ["public", "internal", "private", "confidential", "restricted"];
        const requiredIndex = levels.indexOf(cond.privacyLevel as PrivacyLevel);
        const contextIndex = levels.indexOf(context.resourcePrivacyLevel);
        if (contextIndex < requiredIndex) return false;
      }
      
      if (cond.minSecurityLevel) {
        const levels = ["low", "medium", "high", "critical"];
        const requiredIndex = levels.indexOf(cond.minSecurityLevel as string);
        const contextIndex = levels.indexOf(context.resourceSecurityLevel);
        if (contextIndex < requiredIndex) return false;
      }
      
      if (cond.customCondition && typeof cond.customCondition === "function") {
        return cond.customCondition(context);
      }
    }
    
    return true;
  }
}

export function createPolicyEngine(securityEngine: SecurityEngine): PolicyEngine {
  return new PolicyEngine(securityEngine);
}

export const policyEngine = createPolicyEngine(new SecurityEngine());

export const DEFAULT_POLICY_SET: PolicySet = {
  id: "default",
  name: "Default Policy Set",
  description: "Default policies for SE-AI Mind",
  policies: [],
  rules: [
    {
      id: "deny-unapproved-providers",
      name: "Deny Unapproved Providers",
      description: "Block model routing to unapproved providers",
      condition: (ctx): boolean => ctx.operation === "provider.select" && 
        typeof ctx.metadata?.providerVerificationState === "string" && 
        !["approved", "canary", "active"].includes(ctx.metadata.providerVerificationState),
      action: "deny",
      priority: 100,
    },
    {
      id: "require-approval-for-evolution",
      name: "Require Approval for Evolution",
      description: "Evolution promotions require explicit approval",
      condition: (ctx) => ctx.operation === "evolution.promote",
      action: "require-approval",
      priority: 95,
    },
    {
      id: "privacy-gate-model-routing",
      name: "Privacy Gate for Model Routing",
      description: "Sensitive workloads cannot route to unapproved destinations",
      condition: (ctx): boolean => ctx.operation === "model.select" && 
        ["confidential", "restricted"].includes(ctx.resourcePrivacyLevel) &&
        typeof ctx.metadata?.providerPrivacy === "string" &&
        !["confidential", "restricted"].includes(ctx.metadata.providerPrivacy),
      action: "deny",
      priority: 90,
    },
    {
      id: "log-all-model-selection",
      name: "Log All Model Selection",
      description: "Log all model selection decisions for audit",
      condition: (ctx) => ctx.operation === "model.select",
      action: "log",
      priority: 10,
    },
    {
      id: "log-all-tool-execution",
      name: "Log All Tool Execution",
      description: "Log all tool executions for audit",
      condition: (ctx) => ctx.operation === "tool.execute",
      action: "log",
      priority: 10,
    },
    {
      id: "transform-pii-in-memory",
      name: "Transform PII in Memory",
      description: "Redact PII when storing to memory in lower privacy contexts",
      condition: (ctx) => ctx.operation === "memory.write" && 
        ["public", "internal"].includes(ctx.resourcePrivacyLevel),
      action: "transform",
      transform: (input) => {
        // This would be implemented with actual PII detection
        return input;
      },
      priority: 20,
    },
  ],
  version: "1.0.0",
  createdAt: nowISO(),
  updatedAt: nowISO(),
};

export function initializeDefaultPolicies(engine: PolicyEngine = policyEngine): void {
  engine.registerPolicySet(DEFAULT_POLICY_SET);
  engine.setActivePolicySet("default");
}

export function createPolicyContext(
  operation: string,
  resource: string,
  action: string,
  subject: SecurityContext,
  resourcePrivacyLevel: PrivacyLevel,
  resourceSecurityLevel: string,
  metadata?: Record<string, unknown>
): PolicyContext {
  return {
    operation,
    resource,
    action,
    subject,
    resourcePrivacyLevel,
    resourceSecurityLevel,
    metadata,
    timestamp: nowISO(),
  };
}

export function createSecurityContext(
  permissions: string[],
  privacyLevel: PrivacyLevel,
  securityLevel: string,
  userId?: string,
  sessionId?: string
): SecurityContext {
  return {
    userId,
    sessionId,
    permissions,
    privacyLevel,
    securityLevel: securityLevel as any,
    metadata: {},
  };
}