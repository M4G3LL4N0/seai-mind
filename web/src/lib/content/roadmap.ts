import type { FeatureStatus } from "./types";

export interface RoadmapArea {
  code: string;
  title: string;
  status: FeatureStatus;
  description: string;
}

export interface Generation {
  code: string;
  name: string;
  version: string;
  target: string;
  focus: string;
  status: FeatureStatus;
  detail: string;
}

// Honest statuses for the near-term areas, mirroring the current snapshot
// (README "honest status", AGENTS.md, docs/audit/*).
export const roadmapAreas: RoadmapArea[] = [
  { code: "mind-runtime", title: "Mind runtime", status: "complete", description: "Persistent Mind lifecycle, cognition pipeline, task execution end to end." },
  { code: "memory", title: "Memory", status: "complete", description: "Multi-type, Mind-scoped memory with lifecycle and isolation." },
  { code: "skills", title: "Skills", status: "partial", description: "Skill engine with composition and validation; some executors are stubbed." },
  { code: "cognitive-compiler", title: "Cognitive Compiler", status: "partial", description: "Goal → task graph compiler exists; optimization is partial." },
  { code: "provider-model", title: "Provider / Model Intelligence", status: "partial", description: "Registries, lifecycle, and routing engine are real; multi-runtime coverage is partial (Ollama is the live reference)." },
  { code: "evolution-lab", title: "Evolution Lab", status: "complete", description: "Candidate generation, sandbox, gates, evidence hashing, promotion, rollback — exercised live twice." },
  { code: "model-foundry", title: "Model Foundry", status: "future", description: "Weight-level adaptation (LoRA/QLoRA) and distillation. Future work; prompt/skill layers first." },
  { code: "genome", title: "Genome", status: "partial", description: "Versioning, lineage, and rollback are real; branching/diff are partial." },
  { code: "multi-mind", title: "Multi-Mind", status: "partial", description: "Mind-scoped isolation is real and tested; cross-mind coordination is future." },
  { code: "sdk", title: "SDK", status: "complete", description: "High-level client API and composition-root bootstrap." },
  { code: "marketplace", title: "Mind Marketplace", status: "future", description: "Planned distribution surface for Minds and skills. Future work." },
  { code: "enterprise", title: "Enterprise", status: "future", description: "Hosted/enterprise platform. Future work." },
];

export const generations: Generation[] = [
  { code: "G1", name: "Darwin", version: "0.1.x", target: "Q4 2025", focus: "Evolution infrastructure", status: "in-progress", detail: "Kernel, Mind runtime, memory, evaluation, evolution, genome, SDK, CLI and PAIOS reference Mind; live evolution experiments executed with gates." },
  { code: "G2", name: "Woz", version: "0.2.x", target: "Q2 2026", focus: "Developer experience", status: "future", detail: "Developer tools, observability surfaces, testing frameworks, skill marketplace." },
  { code: "G3", name: "Turing", version: "0.3.x", target: "Q4 2026", focus: "Reasoning & planning", status: "future", detail: "Advanced cognition, knowledge systems, meta-learning." },
  { code: "G4", name: "Tesla", version: "0.4.x", target: "Q2 2027", focus: "Real-world agency", status: "future", detail: "Tool mastery, long-horizon tasks, multi-agent coordination." },
  { code: "G5", name: "Einstein", version: "0.5.x", target: "Q4 2027", focus: "Scientific discovery", status: "future", detail: "Hypothesis generation, verification pipelines, research assistance." },
];

export const roadmapNote =
  "Dates are targets, not commitments. Statuses reflect the current verified snapshot — a status of FUTURE means designed, not built.";