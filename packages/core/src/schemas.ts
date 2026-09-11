import { z } from "zod";

export const VersionSchema = z.object({
  major: z.number().int().nonnegative(),
  minor: z.number().int().nonnegative(),
  patch: z.number().int().nonnegative(),
  prerelease: z.string().optional(),
  build: z.string().optional(),
});

export type Version = z.infer<typeof VersionSchema>;

export const IdentitySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(256),
  version: VersionSchema,
  generation: z.string().min(1).max(64),
  codename: z.string().min(1).max(64),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Identity = z.infer<typeof IdentitySchema>;

export const PurposeSchema = z.object({
  primary: z.string().min(1).max(1024),
  secondary: z.array(z.string().max(1024)).optional(),
  constraints: z.array(z.string().max(1024)).optional(),
});

export type Purpose = z.infer<typeof PurposeSchema>;

export const GoalSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1).max(2048),
  priority: z.number().int().min(0).max(100),
  status: z.enum(["pending", "active", "completed", "failed", "archived"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Goal = z.infer<typeof GoalSchema>;

export const ValueSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(128),
  description: z.string().max(1024),
  weight: z.number().min(0).max(1),
});

export type Value = z.infer<typeof ValueSchema>;

export const ConstraintSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["hard", "soft"]),
  description: z.string().max(1024),
  validator: z.string().optional(),
});

export type Constraint = z.infer<typeof ConstraintSchema>;

export const PolicySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(128),
  description: z.string().max(1024),
  rules: z.array(z.unknown()),
  enforcement: z.enum(["strict", "advisory", "logged"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Policy = z.infer<typeof PolicySchema>;

export const PrivacyLevelSchema = z.enum([
  "public",
  "internal",
  "private",
  "confidential",
  "restricted",
]);

export type PrivacyLevel = z.infer<typeof PrivacyLevelSchema>;

export const SecurityLevelSchema = z.enum(["low", "medium", "high", "critical"]);

export type SecurityLevel = z.infer<typeof SecurityLevelSchema>;

export const HardwareProfileSchema = z.object({
  cpu: z.object({
    architecture: z.string(),
    cores: z.number().int().positive(),
    threads: z.number().int().positive(),
    model: z.string().optional(),
    frequencyMHz: z.number().optional(),
  }),
  memory: z.object({
    totalBytes: z.number().int().positive(),
    availableBytes: z.number().int().nonnegative().optional(),
    unified: z.boolean().default(false),
  }),
  gpu: z.object({
    present: z.boolean(),
    vendor: z.string().optional(),
    model: z.string().optional(),
    memoryBytes: z.number().int().nonnegative().optional(),
    cores: z.number().int().nonnegative().optional(),
    metalSupport: z.string().optional(),
    cudaSupport: z.boolean().optional(),
    rocmSupport: z.boolean().optional(),
  }),
  accelerator: z.object({
    present: z.boolean(),
    type: z.string().optional(),
    model: z.string().optional(),
    memoryBytes: z.number().int().nonnegative().optional(),
  }).optional(),
  storage: z.object({
    type: z.string(),
    availableBytes: z.number().int().positive(),
    totalBytes: z.number().int().positive(),
  }),
  os: z.object({
    platform: z.string(),
    release: z.string(),
    version: z.string(),
  }),
  battery: z.object({
    present: z.boolean(),
    level: z.number().min(0).max(1).optional(),
    charging: z.boolean().optional(),
  }).optional(),
  thermal: z.object({
    supported: z.boolean(),
    temperatureCelsius: z.number().optional(),
    throttleState: z.string().optional(),
  }).optional(),
  load: z.object({
    average1m: z.number().optional(),
    average5m: z.number().optional(),
    average15m: z.number().optional(),
  }).optional(),
});

export type HardwareProfile = z.infer<typeof HardwareProfileSchema>;

export const ModelCapabilitySchema = z.enum([
  "text-generation",
  "chat",
  "reasoning",
  "coding",
  "extraction",
  "summarization",
  "translation",
  "embedding",
  "reranking",
  "vision",
  "audio",
  "function-calling",
  "structured-output",
  "planning",
]);

export type ModelCapability = z.infer<typeof ModelCapabilitySchema>;

export const ModelSchema = z.object({
  id: z.string().uuid(),
  provider: z.string(),
  name: z.string(),
  version: z.string(),
  parameterCount: z.number().int().positive().optional(),
  contextWindow: z.number().int().positive(),
  modalities: z.array(ModelCapabilitySchema),
  license: z.string().optional(),
  quantization: z.string().optional(),
  hardwareRequirements: z.object({
    minRamBytes: z.number().int().positive().optional(),
    minVramBytes: z.number().int().positive().optional(),
    preferredArchitecture: z.array(z.string()).optional(),
    requiresAccelerator: z.boolean().default(false),
  }).optional(),
  capabilities: z.array(ModelCapabilitySchema),
  benchmarkScores: z.record(z.number()).optional(),
  costPerToken: z.object({
    input: z.number().nonnegative().optional(),
    output: z.number().nonnegative().optional(),
  }).optional(),
  privacy: PrivacyLevelSchema.default("internal"),
  latency: z.object({
    p50Ms: z.number().nonnegative().optional(),
    p95Ms: z.number().nonnegative().optional(),
    p99Ms: z.number().nonnegative().optional(),
  }).optional(),
  reliability: z.number().min(0).max(1).optional(),
  availability: z.number().min(0).max(1).optional(),
});

export type Model = z.infer<typeof ModelSchema>;

export const ProviderSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  endpoint: z.string().url(),
  region: z.string().optional(),
  pricing: z.record(z.unknown()).optional(),
  privacy: PrivacyLevelSchema.default("internal"),
  capabilities: z.array(ModelCapabilitySchema),
  latency: z.object({
    p50Ms: z.number().nonnegative().optional(),
    p95Ms: z.number().nonnegative().optional(),
  }).optional(),
  reliability: z.number().min(0).max(1).optional(),
  rateLimits: z.object({
    requestsPerMinute: z.number().int().positive().optional(),
    tokensPerMinute: z.number().int().positive().optional(),
  }).optional(),
  models: z.array(z.string()),
  verificationState: z.enum([
    "discovered",
    "verified",
    "benchmarked",
    "approved",
    "canary",
    "active",
    "deprecated",
    "blocked",
  ]),
  verifiedAt: z.string().datetime().optional(),
});

export type Provider = z.infer<typeof ProviderSchema>;

export const ProviderLifecycleSchema = z.enum([
  "discovered",
  "verified",
  "benchmarked",
  "approved",
  "canary",
  "active",
  "deprecated",
  "blocked",
]);

export type ProviderLifecycle = z.infer<typeof ProviderLifecycleSchema>;

export const TaskSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  input: z.unknown(),
  context: z.unknown().optional(),
  priority: z.number().int().min(0).max(100).default(50),
  privacy: PrivacyLevelSchema.default("internal"),
  qualityTarget: z.number().min(0).max(1).optional(),
  latencyBudgetMs: z.number().int().positive().optional(),
  costBudget: z.number().nonnegative().optional(),
  createdAt: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  status: z.enum(["pending", "running", "completed", "failed", "cancelled"]),
  result: z.unknown().optional(),
  error: z.string().optional(),
  modelUsed: z.string().optional(),
  toolsUsed: z.array(z.string()).optional(),
  skillsUsed: z.array(z.string()).optional(),
  // How the task was actually executed. Set by the cognition engine.
  executionPath: z.enum(["deterministic", "skill", "tool", "model"]).optional(),
  // verified-deterministic: recomputed from the recorded expression (arithmetic class only).
  // validated: output passed syntactic checks (non-empty / schema match).
  // none: no verification was possible.
  verification: z.enum(["verified-deterministic", "validated", "none"]).optional(),
  tokensUsed: z.number().int().nonnegative().optional(),
  latencyMs: z.number().int().nonnegative().optional(),
});

export type Task = z.infer<typeof TaskSchema>;

export const MemoryTypeSchema = z.enum([
  "working",
  "episodic",
  "semantic",
  "procedural",
  "identity",
  "preference",
  "temporal",
  "relational",
  "negative",
  "reflective",
]);

export type MemoryType = z.infer<typeof MemoryTypeSchema>;

export const MemoryStateSchema = z.enum([
  "active",
  "stale",
  "quarantined",
  "archived",
  "deleted",
]);

export type MemoryState = z.infer<typeof MemoryStateSchema>;

export const MemoryEntrySchema = z.object({
  id: z.string().uuid(),
  // Mind ownership boundary: every persisted memory record belongs to exactly one Mind.
  // Required so retrieval paths can enforce isolation (Mind A can never read Mind B's memory).
  mindId: z.string().min(1),
  type: MemoryTypeSchema,
  content: z.unknown(),
  embedding: z.array(z.number()).optional(),
  metadata: z.record(z.unknown()).optional(),
  provenance: z.object({
    source: z.string(),
    timestamp: z.string().datetime(),
    confidence: z.number().min(0).max(1),
    validated: z.boolean().default(false),
    validator: z.string().optional(),
  }),
  state: MemoryStateSchema.default("active"),
  confidence: z.number().min(0).max(1).default(1),
  utility: z.number().min(0).max(1).default(0),
  recency: z.number().int().nonnegative().default(0),
  frequency: z.number().int().nonnegative().default(0),
  dependencies: z.array(z.string().uuid()).optional(),
  risk: z.number().min(0).max(1).default(0),
  storageCost: z.number().int().nonnegative().default(0),
  validationHistory: z.array(z.object({
    timestamp: z.string().datetime(),
    validator: z.string(),
    result: z.boolean(),
    notes: z.string().optional(),
  })).optional(),
  accessHistory: z.array(z.object({
    timestamp: z.string().datetime(),
    context: z.string().optional(),
  })).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  archivedAt: z.string().datetime().optional(),
  deletedAt: z.string().datetime().optional(),
});

export type MemoryEntry = z.infer<typeof MemoryEntrySchema>;

export const SkillSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(128),
  purpose: z.string().max(1024),
  description: z.string().max(2048).optional(),
  inputs: z.record(z.unknown()),
  outputs: z.record(z.unknown()),
  prerequisites: z.array(z.string().uuid()).optional(),
  procedure: z.unknown(),
  tools: z.array(z.string().uuid()).optional(),
  modelRequirements: z.object({
    capabilities: z.array(ModelCapabilitySchema).optional(),
    minParameterCount: z.number().int().positive().optional(),
    maxLatencyMs: z.number().int().positive().optional(),
  }).optional(),
  evaluator: z.string().uuid().optional(),
  examples: z.array(z.unknown()).optional(),
  version: VersionSchema,
  provenance: z.object({
    createdBy: z.string(),
    createdAt: z.string().datetime(),
    source: z.enum(["human", "evolved", "distilled", "imported"]),
    parentSkill: z.string().uuid().optional(),
  }),
  performance: z.object({
    successRate: z.number().min(0).max(1).optional(),
    averageLatencyMs: z.number().int().nonnegative().optional(),
    averageCost: z.number().nonnegative().optional(),
    lastEvaluated: z.string().datetime().optional(),
  }).optional(),
  failures: z.array(z.object({
    timestamp: z.string().datetime(),
    input: z.unknown(),
    error: z.string(),
    context: z.string().optional(),
  })).optional(),
});

export type Skill = z.infer<typeof SkillSchema>;

export const ToolSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(128),
  capability: z.string(),
  description: z.string().max(1024),
  inputSchema: z.record(z.unknown()),
  outputSchema: z.record(z.unknown()),
  permissions: z.array(z.string()),
  privacy: PrivacyLevelSchema.default("internal"),
  security: SecurityLevelSchema.default("low"),
  cost: z.number().nonnegative().default(0),
  latency: z.object({
    p50Ms: z.number().nonnegative().optional(),
    p95Ms: z.number().nonnegative().optional(),
  }).optional(),
  failureModes: z.array(z.object({
    code: z.string(),
    description: z.string(),
    recoverable: z.boolean(),
    retryable: z.boolean(),
  })).optional(),
  version: VersionSchema,
});

export type Tool = z.infer<typeof ToolSchema>;

export const RoutingPolicySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  rules: z.array(z.object({
    condition: z.unknown(),
    action: z.enum(["route", "escalate", "fallback", "reject"]),
    target: z.string().optional(),
    priority: z.number().int().min(0).max(100),
  })),
  defaultRoute: z.string().optional(),
  fallbackChain: z.array(z.string()).optional(),
});

export type RoutingPolicy = z.infer<typeof RoutingPolicySchema>;

export const RoutingDecisionSchema = z.object({
  model: z.string(),
  runtime: z.string(),
  provider: z.string().optional(),
  fallback: z.array(z.string()).optional(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
  estimatedCost: z.number().nonnegative().optional(),
  estimatedLatencyMs: z.number().int().nonnegative().optional(),
});

export type RoutingDecision = z.infer<typeof RoutingDecisionSchema>;

export const EventSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  source: z.string(),
  timestamp: z.string().datetime(),
  payload: z.unknown(),
  correlationId: z.string().uuid().optional(),
  causationId: z.string().uuid().optional(),
  version: z.number().int().positive().default(1),
});

export type Event = z.infer<typeof EventSchema>;

export const EventTypeSchema = z.enum([
  "mind.created",
  "mind.started",
  "mind.stopped",
  "task.created",
  "task.started",
  "task.completed",
  "task.failed",
  "memory.created",
  "memory.retrieved",
  "memory.consolidated",
  "memory.archived",
  "skill.created",
  "skill.used",
  "skill.evolved",
  "model.selected",
  "model.executed",
  "evolution.started",
  "evolution.candidate.created",
  "evolution.candidate.evaluated",
  "evolution.promoted",
  "evolution.rejected",
  "evolution.rollback",
  "benchmark.started",
  "benchmark.completed",
  "security.alert",
  "policy.denied",
  "privacy.blocked",
]);

export type EventType = z.infer<typeof EventTypeSchema>;

export const EvolutionLayerSchema = z.enum([
  "configuration",
  "prompts",
  "memory",
  "skills",
  "knowledge",
  "routing",
  "model-selection",
  "adapters",
  "distilled-models",
  "architecture",
]);

export type EvolutionLayer = z.infer<typeof EvolutionLayerSchema>;

export const EvolutionCandidateSchema = z.object({
  id: z.string().uuid(),
  layer: EvolutionLayerSchema,
  description: z.string().max(2048),
  changes: z.record(z.unknown()),
  generatedBy: z.string(),
  generatedAt: z.string().datetime(),
  status: z.enum([
    "proposed",
    "sandboxed",
    "benchmarked",
    "regression-tested",
    "security-reviewed",
    "privacy-reviewed",
    "cost-reviewed",
    "compared",
    "promoted",
    "rejected",
    "rolled-back",
  ]),
  benchmarkResults: z.record(z.unknown()).optional(),
  regressionResults: z.record(z.unknown()).optional(),
  securityReview: z.object({
    passed: z.boolean(),
    reviewer: z.string(),
    timestamp: z.string().datetime(),
    notes: z.string().optional(),
  }).optional(),
  privacyReview: z.object({
    passed: z.boolean(),
    reviewer: z.string(),
    timestamp: z.string().datetime(),
    notes: z.string().optional(),
  }).optional(),
  costReview: z.object({
    passed: z.boolean(),
    deltaCost: z.number().optional(),
    reviewer: z.string(),
    timestamp: z.string().datetime(),
    notes: z.string().optional(),
  }).optional(),
  comparison: z.object({
    baselineId: z.string().uuid(),
    better: z.boolean(),
    metrics: z.record(z.number()).optional(),
  }).optional(),
  promotedAt: z.string().datetime().optional(),
  rolledBackAt: z.string().datetime().optional(),
  rollbackReason: z.string().optional(),
});

export type EvolutionCandidate = z.infer<typeof EvolutionCandidateSchema>;

export const GenomeSchema = z.object({
  id: z.string().uuid(),
  mindId: z.string().uuid(),
  version: VersionSchema,
  baseModels: z.array(z.object({
    modelId: z.string().uuid(),
    role: z.string(),
    adapter: z.string().optional(),
  })),
  adapters: z.array(z.object({
    id: z.string().uuid(),
    baseModel: z.string().uuid(),
    path: z.string(),
    version: VersionSchema,
  })).optional(),
  prompts: z.record(z.string()).optional(),
  memoryConfig: z.record(z.unknown()).optional(),
  memorySnapshots: z.array(z.string().uuid()).optional(),
  skills: z.array(z.string().uuid()),
  tools: z.array(z.string().uuid()),
  policies: z.array(z.string().uuid()),
  routing: z.array(z.string().uuid()),
  evaluators: z.array(z.string().uuid()),
  knowledge: z.array(z.string().uuid()).optional(),
  benchmarkResults: z.record(z.unknown()).optional(),
  evolutionHistory: z.array(z.object({
    candidateId: z.string().uuid(),
    action: z.enum(["promoted", "rejected", "rolled-back"]),
    timestamp: z.string().datetime(),
    reason: z.string().optional(),
  })).optional(),
  parentGenome: z.string().uuid().optional(),
  branch: z.string().optional(),
  lineage: z.array(z.string().uuid()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Genome = z.infer<typeof GenomeSchema>;

export const BenchmarkResultSchema = z.object({
  id: z.string().uuid(),
  experimentId: z.string().uuid(),
  mindId: z.string().uuid(),
  genomeId: z.string().uuid().optional(),
  hardware: HardwareProfileSchema,
  software: z.object({
    nodeVersion: z.string(),
    pnpmVersion: z.string(),
    pythonVersion: z.string().optional(),
    seaiVersion: z.string(),
  }),
  model: ModelSchema,
  modelVersion: z.string(),
  configuration: z.record(z.unknown()),
  promptVersion: z.string().optional(),
  memoryVersion: z.string().optional(),
  skillVersion: z.string().optional(),
  dataset: z.string(),
  evaluator: z.string(),
  timestamp: z.string().datetime(),
  result: z.object({
    taskSuccess: z.number().min(0).max(1),
    accuracy: z.number().min(0).max(1).optional(),
    factuality: z.number().min(0).max(1).optional(),
    hallucination: z.number().min(0).max(1).optional(),
    latency: z.object({
      meanMs: z.number().nonnegative(),
      p50Ms: z.number().nonnegative(),
      p95Ms: z.number().nonnegative(),
      p99Ms: z.number().nonnegative(),
    }),
    tokensPerSecond: z.number().nonnegative().optional(),
    ram: z.object({
      peakBytes: z.number().int().nonnegative(),
      averageBytes: z.number().int().nonnegative(),
    }),
    cpu: z.object({
      peakPercent: z.number().min(0).max(100),
      averagePercent: z.number().min(0).max(100),
    }),
    accelerator: z.object({
      peakUtilization: z.number().min(0).max(1).optional(),
      averageUtilization: z.number().min(0).max(1).optional(),
    }).optional(),
    modelLoadingTimeMs: z.number().int().nonnegative().optional(),
    compute: z.number().nonnegative().optional(),
    energy: z.number().nonnegative().optional(),
    cost: z.number().nonnegative().optional(),
    toolCalls: z.number().int().nonnegative().optional(),
    escalationFrequency: z.number().min(0).max(1).optional(),
    memoryRetrieval: z.number().int().nonnegative().optional(),
    skillReuse: z.number().int().nonnegative().optional(),
    adaptation: z.number().min(0).max(1).optional(),
    forgetting: z.number().min(0).max(1).optional(),
    regression: z.number().min(0).max(1).optional(),
    reliability: z.number().min(0).max(1).optional(),
  }),
  label: z.enum(["planned", "simulated", "experimental", "measured", "verified", "production"]),
});

export type BenchmarkResult = z.infer<typeof BenchmarkResultSchema>;

export const ResultLabelSchema = z.enum(["planned", "simulated", "experimental", "measured", "verified", "production"]);

export type ResultLabel = z.infer<typeof ResultLabelSchema>;

export const CodenameSchema = z.object({
  candidate: z.string(),
  theme: z.string(),
  reason: z.string(),
  status: z.enum(["candidate", "evaluated", "assigned", "rejected"]),
  risk: z.object({
    trademark: z.boolean().default(false),
    cultural: z.boolean().default(false),
    confusion: z.boolean().default(false),
    international: z.boolean().default(false),
  }).optional(),
  decision: z.string().optional(),
  assignedAt: z.string().datetime().optional(),
  generation: z.string().optional(),
});

export type Codename = z.infer<typeof CodenameSchema>;

export const ProjectManifestSchema = z.object({
  project: z.string(),
  fullName: z.string(),
  product: z.string(),
  generation: z.string(),
  version: VersionSchema,
  publicDisplayFormat: z.string(),
  internalVersion: z.string(),
  projectRoot: z.string(),
  mission: z.string(),
  coreDistinction: z.string(),
  firstPrinciple: z.string(),
  initialExperiment: z.string(),
  measurement: z.string(),
});

export type ProjectManifest = z.infer<typeof ProjectManifestSchema>;

export const SEAIEventTypes = {
  MIND_CREATED: "mind.created",
  MIND_STARTED: "mind.started",
  MIND_STOPPED: "mind.stopped",
  TASK_CREATED: "task.created",
  TASK_STARTED: "task.started",
  TASK_COMPLETED: "task.completed",
  TASK_FAILED: "task.failed",
  MEMORY_CREATED: "memory.created",
  MEMORY_RETRIEVED: "memory.retrieved",
  MEMORY_CONSOLIDATED: "memory.consolidated",
  MEMORY_ARCHIVED: "memory.archived",
  SKILL_CREATED: "skill.created",
  SKILL_USED: "skill.used",
  SKILL_EVOLVED: "skill.evolved",
  MODEL_SELECTED: "model.selected",
  MODEL_EXECUTED: "model.executed",
  EVOLUTION_STARTED: "evolution.started",
  EVOLUTION_CANDIDATE_CREATED: "evolution.candidate.created",
  EVOLUTION_CANDIDATE_EVALUATED: "evolution.candidate.evaluated",
  EVOLUTION_PROMOTED: "evolution.promoted",
  EVOLUTION_REJECTED: "evolution.rejected",
  EVOLUTION_ROLLBACK: "evolution.rollback",
  BENCHMARK_STARTED: "benchmark.started",
  BENCHMARK_COMPLETED: "benchmark.completed",
  SECURITY_ALERT: "security.alert",
  POLICY_DENIED: "policy.denied",
  PRIVACY_BLOCKED: "privacy.blocked",
} as const;

export type SEAIEventType = typeof SEAIEventTypes[keyof typeof SEAIEventTypes];