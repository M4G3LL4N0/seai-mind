import {
  PrivacyLevelSchema,
  SecurityLevelSchema,
  type PrivacyLevel,
  type SecurityLevel,
} from "./schemas.js";
import { generateId, nowISO } from "./kernel.js";

export interface SecurityContext {
  userId?: string;
  sessionId?: string;
  permissions: string[];
  privacyLevel: PrivacyLevel;
  securityLevel: SecurityLevel;
  metadata?: Record<string, unknown>;
}

export interface Capability {
  name: string;
  description: string;
  requiredPermissions: string[];
  privacyLevel: PrivacyLevel;
  securityLevel: SecurityLevel;
  riskScore: number;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  rules: SecurityRule[];
  enforcement: "strict" | "advisory" | "logged";
  createdAt: string;
  updatedAt: string;
}

export interface SecurityRule {
  id: string;
  condition: (context: SecurityContext, capability: Capability) => boolean;
  action: "allow" | "deny" | "require-approval" | "log";
  reason: string;
  priority: number;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  event: string;
  context: SecurityContext;
  capability?: Capability;
  decision: "allowed" | "denied" | "approved" | "logged";
  reason: string;
  metadata?: Record<string, unknown>;
}

export class SecurityEngine {
  private policies: Map<string, SecurityPolicy> = new Map();
  private capabilities: Map<string, Capability> = new Map();
  private auditLog: AuditEntry[] = [];
  private maxAuditEntries = 10000;

  registerCapability(capability: Capability): void {
    this.capabilities.set(capability.name, capability);
  }

  getCapability(name: string): Capability | undefined {
    return this.capabilities.get(name);
  }

  listCapabilities(): Capability[] {
    return Array.from(this.capabilities.values());
  }

  registerPolicy(policy: SecurityPolicy): void {
    this.policies.set(policy.id, policy);
  }

  getPolicy(id: string): SecurityPolicy | undefined {
    return this.policies.get(id);
  }

  listPolicies(): SecurityPolicy[] {
    return Array.from(this.policies.values());
  }

  evaluate(context: SecurityContext, capabilityName: string): { allowed: boolean; reason: string; policyId?: string } {
    const capability = this.capabilities.get(capabilityName);
    if (!capability) {
      return { allowed: false, reason: `Unknown capability: ${capabilityName}` };
    }

    for (const policy of this.policies.values()) {
      for (const rule of policy.rules.sort((a, b) => b.priority - a.priority)) {
        if (rule.condition(context, capability)) {
          const decision = rule.action === "allow" ? "allowed" : 
                          rule.action === "deny" ? "denied" :
                          rule.action === "require-approval" ? "denied" : "logged";
          
          this.audit({
            event: "capability-evaluation",
            context,
            capability,
            decision,
            reason: rule.reason,
            metadata: { policyId: policy.id, ruleId: rule.id },
          });

          if (rule.action === "deny" || rule.action === "require-approval") {
            return { allowed: false, reason: rule.reason, policyId: policy.id };
          }
          
          if (rule.action === "allow") {
            return { allowed: true, reason: rule.reason, policyId: policy.id };
          }
        }
      }
    }

    const defaultAllowed = this.defaultEvaluate(context, capability);
    this.audit({
      event: "capability-evaluation",
      context,
      capability,
      decision: defaultAllowed ? "allowed" : "denied",
      reason: defaultAllowed ? "Default allow" : "Default deny",
    });

    return { allowed: defaultAllowed, reason: defaultAllowed ? "Default allow" : "Default deny" };
  }

  private defaultEvaluate(context: SecurityContext, capability: Capability): boolean {
    if (capability.securityLevel === "critical" && context.securityLevel !== "critical") {
      return false;
    }
    
    if (capability.privacyLevel === "restricted" && context.privacyLevel !== "restricted") {
      return false;
    }
    
    if (capability.privacyLevel === "confidential" && 
        !["confidential", "restricted"].includes(context.privacyLevel)) {
      return false;
    }
    
    if (capability.privacyLevel === "private" && 
        !["private", "confidential", "restricted"].includes(context.privacyLevel)) {
      return false;
    }
    
    if (capability.privacyLevel === "internal" && 
        !["internal", "private", "confidential", "restricted"].includes(context.privacyLevel)) {
      return false;
    }

    const hasPermission = capability.requiredPermissions.every(p => 
      context.permissions.includes(p)
    );
    
    return hasPermission;
  }

  private audit(entry: Omit<AuditEntry, "id" | "timestamp">): void {
    const auditEntry: AuditEntry = {
      id: generateId(),
      timestamp: nowISO(),
      ...entry,
    };
    
    this.auditLog.push(auditEntry);
    
    if (this.auditLog.length > this.maxAuditEntries) {
      this.auditLog = this.auditLog.slice(-this.maxAuditEntries);
    }
  }

  getAuditLog(limit = 100): AuditEntry[] {
    return this.auditLog.slice(-limit);
  }

  clearAuditLog(): void {
    this.auditLog = [];
  }

  checkPrivacy(context: SecurityContext, requiredLevel: PrivacyLevel): boolean {
    const levels: PrivacyLevel[] = ["public", "internal", "private", "confidential", "restricted"];
    const contextIndex = levels.indexOf(context.privacyLevel);
    const requiredIndex = levels.indexOf(requiredLevel);
    return contextIndex >= requiredIndex;
  }

  enforcePrivacy(context: SecurityContext, requiredLevel: PrivacyLevel, operation: string): void {
    if (!this.checkPrivacy(context, requiredLevel)) {
      throw new Error(`Privacy violation: ${operation} requires ${requiredLevel} but context is ${context.privacyLevel}`);
    }
  }

  sanitizeForPrivacy(data: unknown, targetLevel: PrivacyLevel): unknown {
    if (typeof data !== "object" || data === null) {
      return data;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeForPrivacy(item, targetLevel));
    }
    
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (this.isSensitiveKey(key, targetLevel)) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = this.sanitizeForPrivacy(value, targetLevel);
      }
    }
    return sanitized;
  }

  private isSensitiveKey(key: string, targetLevel: PrivacyLevel): boolean {
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /token/i,
      /key/i,
      /credential/i,
      /auth/i,
      /private/i,
      /ssn/i,
      /social.*security/i,
      /credit.*card/i,
      /api.*key/i,
      /access.*token/i,
      /refresh.*token/i,
    ];
    
    if (targetLevel === "public" || targetLevel === "internal") {
      return sensitivePatterns.some(p => p.test(key));
    }
    
    return false;
  }
}

export function createSecurityEngine(): SecurityEngine {
  return new SecurityEngine();
}

export const security = createSecurityEngine();

export const DEFAULT_CAPABILITIES: Capability[] = [
  {
    name: "model.inference",
    description: "Run model inference",
    requiredPermissions: ["model:inference"],
    privacyLevel: "internal",
    securityLevel: "low",
    riskScore: 0.2,
  },
  {
    name: "model.training",
    description: "Train or fine-tune models",
    requiredPermissions: ["model:training"],
    privacyLevel: "private",
    securityLevel: "high",
    riskScore: 0.8,
  },
  {
    name: "memory.read",
    description: "Read from memory",
    requiredPermissions: ["memory:read"],
    privacyLevel: "internal",
    securityLevel: "low",
    riskScore: 0.1,
  },
  {
    name: "memory.write",
    description: "Write to memory",
    requiredPermissions: ["memory:write"],
    privacyLevel: "internal",
    securityLevel: "medium",
    riskScore: 0.3,
  },
  {
    name: "memory.delete",
    description: "Delete memory entries",
    requiredPermissions: ["memory:delete"],
    privacyLevel: "private",
    securityLevel: "high",
    riskScore: 0.7,
  },
  {
    name: "skill.execute",
    description: "Execute a skill",
    requiredPermissions: ["skill:execute"],
    privacyLevel: "internal",
    securityLevel: "low",
    riskScore: 0.2,
  },
  {
    name: "skill.create",
    description: "Create a new skill",
    requiredPermissions: ["skill:create"],
    privacyLevel: "private",
    securityLevel: "medium",
    riskScore: 0.5,
  },
  {
    name: "tool.execute",
    description: "Execute a tool",
    requiredPermissions: ["tool:execute"],
    privacyLevel: "internal",
    securityLevel: "medium",
    riskScore: 0.4,
  },
  {
    name: "tool.create",
    description: "Create a new tool",
    requiredPermissions: ["tool:create"],
    privacyLevel: "private",
    securityLevel: "high",
    riskScore: 0.7,
  },
  {
    name: "evolution.propose",
    description: "Propose an evolution candidate",
    requiredPermissions: ["evolution:propose"],
    privacyLevel: "private",
    securityLevel: "high",
    riskScore: 0.8,
  },
  {
    name: "evolution.promote",
    description: "Promote an evolution candidate",
    requiredPermissions: ["evolution:promote"],
    privacyLevel: "confidential",
    securityLevel: "critical",
    riskScore: 0.9,
  },
  {
    name: "benchmark.run",
    description: "Run benchmarks",
    requiredPermissions: ["benchmark:run"],
    privacyLevel: "internal",
    securityLevel: "low",
    riskScore: 0.2,
  },
  {
    name: "genome.read",
    description: "Read genome",
    requiredPermissions: ["genome:read"],
    privacyLevel: "private",
    securityLevel: "medium",
    riskScore: 0.3,
  },
  {
    name: "genome.write",
    description: "Write genome",
    requiredPermissions: ["genome:write"],
    privacyLevel: "confidential",
    securityLevel: "high",
    riskScore: 0.7,
  },
  {
    name: "provider.register",
    description: "Register a new provider",
    requiredPermissions: ["provider:register"],
    privacyLevel: "confidential",
    securityLevel: "high",
    riskScore: 0.6,
  },
  {
    name: "system.admin",
    description: "System administration",
    requiredPermissions: ["system:admin"],
    privacyLevel: "restricted",
    securityLevel: "critical",
    riskScore: 1.0,
  },
];

export const DEFAULT_POLICIES: SecurityPolicy[] = [
  {
    id: "default-deny-critical",
    name: "Default Deny Critical Operations",
    description: "Deny critical operations unless explicitly allowed",
    rules: [
      {
        id: "deny-critical-without-permission",
        condition: (ctx, cap) => cap.securityLevel === "critical" && !ctx.permissions.includes("system:admin"),
        action: "deny",
        reason: "Critical operations require system:admin permission",
        priority: 100,
      },
    ],
    enforcement: "strict",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "privacy-gate",
    name: "Privacy Gate",
    description: "Enforce privacy levels for data access",
    rules: [
      {
        id: "deny-restricted-public",
        condition: (ctx, cap) => cap.privacyLevel === "restricted" && ctx.privacyLevel === "public",
        action: "deny",
        reason: "Restricted capability cannot be accessed from public context",
        priority: 90,
      },
      {
        id: "deny-confidential-internal",
        condition: (ctx, cap) => cap.privacyLevel === "confidential" && ["public", "internal"].includes(ctx.privacyLevel),
        action: "deny",
        reason: "Confidential capability requires private or higher context",
        priority: 85,
      },
      {
        id: "deny-private-public",
        condition: (ctx, cap) => cap.privacyLevel === "private" && ctx.privacyLevel === "public",
        action: "deny",
        reason: "Private capability cannot be accessed from public context",
        priority: 80,
      },
    ],
    enforcement: "strict",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "evolution-approval",
    name: "Evolution Approval Required",
    description: "Evolution promotions require explicit approval",
    rules: [
      {
        id: "require-approval-for-promotion",
        condition: (ctx, cap) => cap.name === "evolution.promote" && !ctx.permissions.includes("evolution:approve"),
        action: "require-approval",
        reason: "Evolution promotion requires explicit approval permission",
        priority: 95,
      },
    ],
    enforcement: "strict",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
];

export function initializeDefaultSecurity(engine: SecurityEngine = security): void {
  for (const cap of DEFAULT_CAPABILITIES) {
    engine.registerCapability(cap);
  }
  for (const policy of DEFAULT_POLICIES) {
    engine.registerPolicy(policy);
  }
}

export interface ThreatSignature {
  id: string;
  name: string;
  description: string;
  patterns: RegExp[];
  severity: "low" | "medium" | "high" | "critical";
  category: "injection" | "exfiltration" | "escalation" | "poisoning" | "abuse";
}

export const THREAT_SIGNATURES: ThreatSignature[] = [
  {
    id: "prompt-injection-basic",
    name: "Basic Prompt Injection",
    description: "Attempts to override system instructions",
    patterns: [
      /ignore\s+(previous|above|all)\s+instructions?/i,
      /forget\s+(everything|all|previous)/i,
      /you\s+are\s+now\s+/i,
      /system\s*:\s*/i,
      /<\|system\|>/i,
      /\[INST\].*?\[\/INST\]/i,
    ],
    severity: "high",
    category: "injection",
  },
  {
    id: "prompt-injection-roleplay",
    name: "Roleplay Injection",
    description: "Attempts to manipulate through roleplay framing",
    patterns: [
      /pretend\s+to\s+be/i,
      /roleplay\s+as/i,
      /act\s+as\s+(a|an)\s+/i,
      /you\s+are\s+(a|an)\s+/i,
      /simulate\s+/i,
    ],
    severity: "medium",
    category: "injection",
  },
  {
    id: "data-exfiltration",
    name: "Data Exfiltration Attempt",
    description: "Attempts to extract sensitive information",
    patterns: [
      /show\s+me\s+(your|the)\s+(system|internal|hidden|secret)/i,
      /what\s+is\s+your\s+(prompt|instructions?|system\s+prompt)/i,
      /reveal\s+(your|the)\s+/i,
      /output\s+(your|the)\s+(prompt|instructions?)/i,
      /print\s+(your|the)\s+(prompt|instructions?)/i,
    ],
    severity: "high",
    category: "exfiltration",
  },
  {
    id: "privilege-escalation",
    name: "Privilege Escalation",
    description: "Attempts to gain elevated permissions",
    patterns: [
      /grant\s+(me|admin|root|sudo)\s+/i,
      /elevate\s+(privileges?|permissions?)/i,
      /bypass\s+(security|auth|permission)/i,
      /override\s+(policy|rule|restriction)/i,
      /disable\s+(safety|security|guard)/i,
    ],
    severity: "critical",
    category: "escalation",
  },
  {
    id: "knowledge-poisoning",
    name: "Knowledge Poisoning",
    description: "Attempts to inject false information into memory",
    patterns: [
      /remember\s+that\s+/i,
      /store\s+this\s+(fact|information):/i,
      /add\s+to\s+(memory|knowledge):/i,
      /the\s+(truth|fact)\s+is\s+/i,
      /actually,\s+/i,
    ],
    severity: "medium",
    category: "poisoning",
  },
  {
    id: "tool-abuse",
    name: "Tool Abuse",
    description: "Attempts to misuse tools",
    patterns: [
      /execute\s+(command|code|script):/i,
      /run\s+(command|code|script):/i,
      /eval\s*\(/i,
      /exec\s*\(/i,
      /system\s*\(/i,
      /subprocess/i,
      /child_process/i,
    ],
    severity: "high",
    category: "abuse",
  },
];

export function detectThreats(input: string): { detected: boolean; threats: Array<{ signature: ThreatSignature; matches: string[] }> } {
  const threats: Array<{ signature: ThreatSignature; matches: string[] }> = [];
  
  for (const signature of THREAT_SIGNATURES) {
    const matches: string[] = [];
    for (const pattern of signature.patterns) {
      const found = input.match(pattern);
      if (found) {
        matches.push(...found);
      }
    }
    if (matches.length > 0) {
      threats.push({ signature, matches });
    }
  }
  
  return {
    detected: threats.length > 0,
    threats,
  };
}

export function sanitizeInput(input: string): string {
  let sanitized = input;
  
  for (const signature of THREAT_SIGNATURES) {
    for (const pattern of signature.patterns) {
      sanitized = sanitized.replace(pattern, "[FILTERED]");
    }
  }
  
  return sanitized;
}