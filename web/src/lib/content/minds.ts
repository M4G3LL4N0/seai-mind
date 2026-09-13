import type { FeatureStatus } from "./types";

export interface Mind {
  slug: string;
  name: string;
  kind: string;
  generation: string;
  status: FeatureStatus;
  statusNote: string;
  summary: string;
  capabilities: string[];
  layers: { label: string; value: string }[];
}

export const minds: Mind[] = [
  {
    slug: "paios",
    name: "PAIOS",
    kind: "Personal AI Operating System",
    generation: "Darwin 0.1",
    status: "complete",
    statusNote: "First real reference SE-AI Mind — specification implemented and exercised by live experiments.",
    summary:
      "PAIOS is the first real SE-AI Mind: a local-first personal assistant that persists across sessions, learns from interactions, and evolves its capabilities while keeping data private by default. It is a reference implementation of the platform — not a separate product.",
    capabilities: [
      "Personal intelligence with persistent memory",
      "Local-first: processes PRIVATE data locally by default",
      "Explicit, governed evolution with rollback",
      "Mind-scoped memory with multi-type storage",
      "Deterministic evaluation instead of an LLM judge",
      "Provider-neutral model routing, local models primary",
    ],
    layers: [
      { label: "Identity", value: "PAIOS — Personal AI Operating System" },
      { label: "Goals", value: "Persist memory · learn preferences · self-improve · protect privacy" },
      { label: "Memory", value: "working, episodic, semantic, procedural, identity, preference, temporal, relational" },
      { label: "Skills", value: "reasoning · code-generation · summarization · extraction · planning" },
      { label: "Models", value: "local primary (0.5B-7B), external fallback only with user consent" },
      { label: "Evolution", value: "prompts → routing → memory → skills → config → … → architects (priority order)" },
      { label: "Governance", value: "auto-promote OFF; security/privacy/cost review required; min improvement 5%" },
    ],
  },
  {
    slug: "legalone",
    name: "Legalone",
    kind: "Legal assistant Mind",
    generation: "Darwin 0.1",
    status: "future",
    statusNote: "Illustrative example of a specialized Mind — not yet built.",
    summary:
      "A specialized legal Mind concept: document review, contract analysis, and legal research with strict provenance and privacy. Shown as an example of what Minds can become; it is not implemented.",
    capabilities: ["Document analysis", "Contract review", "Private by default"],
    layers: [],
  },
  {
    slug: "trillionx",
    name: "Trillionx",
    kind: "Financial analysis Mind",
    generation: "Darwin 0.1",
    status: "future",
    statusNote: "Illustrative example of a specialized Mind — not yet built.",
    summary:
      "A financial analysis Mind concept: data aggregation, forecasting, and reporting specialized for a domain. Shown as an example; not implemented.",
    capabilities: ["Data aggregation", "Forecasting", "Reporting"],
    layers: [],
  },
  {
    slug: "coding",
    name: "Coder",
    kind: "Coding Mind",
    generation: "Darwin 0.1",
    status: "future",
    statusNote: "Illustrative example of a specialized Mind — not yet built.",
    summary:
      "A coding Mind concept: repository understanding, code generation, and automated testing that improves on the code it has seen. Shown as an example; not implemented.",
    capabilities: ["Code generation", "Repo understanding", "Automated testing"],
    layers: [],
  },
  {
    slug: "research",
    name: "Researcher",
    kind: "Research Mind",
    generation: "Darwin 0.1",
    status: "future",
    statusNote: "Illustrative example of a specialized Mind — not yet built.",
    summary:
      "A research Mind concept: literature synthesis, hypothesis generation, and experiment planning with traceable citations. Shown as an example; not implemented.",
    capabilities: ["Literature synthesis", "Hypothesis generation", "Experiment planning"],
    layers: [],
  },
  {
    slug: "personal",
    name: "Personal",
    kind: "Personal Mind",
    generation: "Darwin 0.1",
    status: "future",
    statusNote: "Illustrative example of a specialized Mind — not yet built.",
    summary:
      "A general personal Mind concept: scheduling, knowledge, and preferences that persist privately. Shown as an example; not implemented.",
    capabilities: ["Schedule & knowledge", "Preference learning", "Private persistence"],
    layers: [],
  },
  {
    slug: "document",
    name: "Document",
    kind: "Document Mind",
    generation: "Darwin 0.1",
    status: "future",
    statusNote: "Illustrative example of a specialized Mind — not yet built.",
    summary:
      "A document Mind concept: classification, extraction, and summarization pipelines trained on your corpus. Shown as an example; not implemented.",
    capabilities: ["Classification", "Structured extraction", "Summarization"],
    layers: [],
  },
];

export function getMind(slug: string): Mind | undefined {
  return minds.find((m) => m.slug === slug);
}