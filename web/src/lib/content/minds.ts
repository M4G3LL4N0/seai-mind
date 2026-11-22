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
    generation: "Current reference",
    status: "complete",
    statusNote:
      "PAIOS exercises the runtime, Mind-scoped state, evaluation, and evolution interfaces. The public experiments are narrow and model-specific; the records below show exactly what they establish.",
    summary:
      "PAIOS is SE-AI's personal-assistant reference Mind. It puts identity, goals, Mind-scoped memory, composable skills, permissioned tools, and a provider-neutral runtime around a model. Local runtimes are the preferred path; external providers require user consent. Changes are versioned, measured, and subject to a separate human decision.",
    capabilities: [
      "Persistent memory scoped to the active Mind",
      "Composable skills with validation",
      "Capability-scoped tools and privacy gates",
      "Provider-neutral execution with local runtimes preferred",
      "Deterministic task evaluation with recorded evidence",
      "Versioned candidates, explicit promotion, and rollback",
    ],
    layers: [
      { label: "Identity", value: "PAIOS — Personal AI Operating System" },
      { label: "Goals", value: "Persistent assistance, user control, and private-by-default operation" },
      { label: "Memory", value: "Working, episodic, semantic, procedural, identity, preference, temporal, and relational state" },
      { label: "Skills", value: "Composable procedures with inputs, tools, requirements, and evaluators" },
      { label: "Runtime", value: "Provider-neutral routing; local runtimes preferred, external fallback with user consent" },
      { label: "Evolution", value: "Propose → evaluate → hold, reject, or become eligible → explicit decision → verify" },
      { label: "Governance", value: "Promotion is a separate action; candidates can be rolled back with lineage intact" },
    ],
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