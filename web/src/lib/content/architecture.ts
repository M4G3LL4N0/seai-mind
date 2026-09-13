import type { FeatureStatus } from "./types";

export interface ArchitectureModule {
  slug: string;
  name: string;
  path: string;
  layer: "kernel" | "interface";
  role: string;
  dependsOn: string[];
  responsibilities: string[];
}

// Exactly mirrors the 7 build units and their dependency direction as
// documented in docs/architecture/MINIMAL_KERNEL.md and AGENTS.md.
// core ← runtime/state ← mind (kernel); sdk ← cli (interfaces); web standalone.
export const architectureModules: ArchitectureModule[] = [
  {
    slug: "core",
    name: "core",
    path: "packages/core",
    layer: "kernel",
    role: "Foundation primitives every other unit builds on.",
    dependsOn: [],
    responsibilities: [
      "Result/error types and SEAI error classes",
      "Zod schemas for every domain object",
      "Event telemetry with persistence",
      "Capability-based security, threat detection, privacy gates",
      "Policy engine for routing, tools, memory, evolution",
      "Storage abstraction (SQLite + memory + file adapters)",
      "Hardware detection (CPU, GPU, RAM, thermal, battery)",
    ],
  },
  {
    slug: "runtime",
    name: "runtime",
    path: "packages/runtime",
    layer: "kernel",
    role: "Provider-neutral execution: run the same Mind on any model runtime.",
    dependsOn: ["core"],
    responsibilities: [
      "Model/provider registries with lifecycle",
      "Routing engine over healthy runtimes",
      "Availability probing and local discovery",
      "Adapter contract — ollama (REAL reference), llamacpp (mostly real), mlx (STUB), local (intentional test fixture, never auto-registered)",
    ],
  },
  {
    slug: "state",
    name: "state",
    path: "packages/state",
    layer: "kernel",
    role: "Persistent, Mind-scoped mind state.",
    dependsOn: ["core"],
    responsibilities: [
      "Memory — multi-type, always scoped by a required mindId",
      "Skills engine with composition and validation",
      "Tools registry (capability-scoped)",
      "Genome — versioning, branching, diff, rollback",
    ],
  },
  {
    slug: "mind",
    name: "mind",
    path: "packages/mind",
    layer: "kernel",
    role: "Central orchestrator — the runtime wrapper around a Mind.",
    dependsOn: ["core", "runtime", "state"],
    responsibilities: [
      "Mind runtime: task execution end to end",
      "Cognition pipeline: deterministic → skill → tool → model, honest failure otherwise",
      "Goal compiler: goal → task graph with optimization",
      "Evaluation: suites with deterministic criteria",
      "Evolution: candidate generation, sandbox, gates, promotion, rollback",
      "Benchmark: MindBench experiment runner",
    ],
  },
  {
    slug: "sdk",
    name: "sdk",
    path: "packages/sdk",
    layer: "interface",
    role: "High-level client API and composition-root bootstrap.",
    dependsOn: ["core", "state", "mind"],
    responsibilities: [
      "MindRuntime / evolve() / runExperiment() high-level API",
      "Local runtime bootstrap via enableLocalRuntimes()",
      "Typed access to the kernel without touching internals",
    ],
  },
  {
    slug: "cli",
    name: "cli",
    path: "packages/cli",
    layer: "interface",
    role: "Command-line interface: seai --help/init/run/doctor/status/evolve.",
    dependsOn: ["core", "sdk"],
    responsibilities: [
      "Local Mind lifecycle: init, run, status, doctor",
      "Evolution: propose, history, compare, promote, rollback, verify",
      "Benchmark and memory/skill/model/provider commands",
    ],
  },
  {
    slug: "web",
    name: "web",
    path: "web",
    layer: "interface",
    role: "Standalone documentation and marketing site.",
    dependsOn: [],
    responsibilities: [
      "Public product/research/developer experience",
      "Zero @seai/* runtime dependencies — it documents, it does not execute",
    ],
  },
];

export const dependencyChain = ["core", "runtime", "state", "mind", "sdk", "cli"];

export const architectureFacts = [
  "Runtime adapters are optional — the kernel talks to a contract, not to Ollama or any vendor.",
  "Provider neutrality — models and providers are registered, discovered, verified, and routed; nothing is hardwired.",
  "Memory isolation — every memory entry is scoped by a required mindId; no cross-Mind leakage.",
  "Cognition — tasks run deterministic → skill → tool → model, and fail honestly when nothing can handle them.",
  "Evolution — everything below the promotion step is reversible: promote, monitor, roll back.",
] as const;