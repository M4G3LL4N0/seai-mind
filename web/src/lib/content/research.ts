import type { FeatureStatus } from "./types";

export interface ResearchEntry {
  slug: string;
  title: string;
  status: FeatureStatus;
  date?: string;
  summary: string;
  paragraphs: string[];
  bullets: string[];
  links: { label: string; href: string }[];
}

export const researchEntries: ResearchEntry[] = [
  {
    slug: "seai-hypotheses",
    title: "SE-AI Hypotheses",
    status: "complete",
    date: "Living document — 2026-09-11",
    summary:
      "The empirical claims the research program is testing, each with a status and the evidence behind it. Nothing here claims without measurements.",
    paragraphs: [
      "Research on SE-AI is organized around explicit, falsifiable hypotheses. Each hypothesis records its claim, its status (open → tested → confirmed/rejected), and the exact experiment that produced the evidence.",
      "H1 — a JSON-only system instruction raises pure-JSON compliance on unambiguous extraction tasks: TESTED with measured evidence. H2 — deterministic response formatting fixes format compliance at zero model cost: CONFIRMED live. H3 — a weaker prompt nudge is cheaper but less effective: TESTED alongside H1. H4 — sub-100ms latency deltas between arms are measurement noise: CONFIRMED by failure. H5 (memory-retrieval policy evolution) and H6 (routing-policy evolution) are OPEN and untested.",
    ],
    bullets: [
      "H1 — JSON-only instruction → compliance: TESTED",
      "H2 — deterministic formatting: CONFIRMED (0.00 → 0.70/0.80, promoted, rolled back live)",
      "H3 — cheaper-but-weaker nudge: TESTED",
      "H4 — latency noise floor: CONFIRMED by failure",
      "H5 — memory-retrieval policy evolution: OPEN",
      "H6 — routing-policy evolution: OPEN",
    ],
    links: [
      { label: "Living document (docs/research/SEAI_HYPOTHESES.md)", href: "https://github.com/M4G3LL4N0/seai-mind/blob/main/docs/research/SEAI_HYPOTHESES.md" },
    ],
  },
  {
    slug: "model-evolution",
    title: "Model Evolution — First Experiment",
    status: "complete",
    date: "2026-09-11 — executed live",
    summary:
      "The first model-backed evolution experiment: qwen2.5-coder:3b, a 10-task extraction suite, and two prompt candidates measured against a baseline — baseline 0.30 → candidate A 0.70, candidate B 0.80. Promotion was governed, fresh-process adoption verified, rollback verified.",
    paragraphs: [
      "Hypothesis H1: adding a JSON-only system instruction raises pure-JSON compliance on unambiguous extraction tasks without changing task semantics. Controlled variables: single model (qwen2.5-coder:3b), single runtime (ollama), identical 10-task extraction-json-v1 suite, deterministic extractionCriterion (pure JSON.parse + required-field equality — no LLM judge), temperature 0.7.",
      "Baseline (stock prompt) measured 0.30 quality; candidate A (json-only-prompt) 0.70; candidate B (polite-json-prompt) 0.80 — all on 10/10 executed tasks. The gate returned ELIGIBLE for both candidates. Per-task evidence showed fences and preambles in the baseline arm and pure JSON in candidate arms, with raw records persisted.",
      "Promotion was explicit, fresh-process adoption was verified (an in-suite probe returned pure JSON 2/2 under the promoted prompt), and rollback restored the parent version with lineage and audit history intact.",
      "The experiment also discovered a limitation: an unseen probe (\"Bob is 41\") fenced 3/3 under the promoted prompt while the in-suite probe passed 2/2. The constraint raises compliance rates; it does not guarantee them. We represent this honestly — the gate measures, it does not promise.",
    ],
    bullets: [
      "Baseline 0.30 → Candidate A 0.70 · Candidate B 0.80",
      "Identical workload both arms; deterministic criterion; raw evidence preserved",
      "Gate: ELIGIBLE — explicit promotion, adoption, rollback all verified live",
      "Limitation exposed: unseen probe fenced 3/3 — improvement is not universal",
      "A second run measured baseline 0.40 / candidate 0.50 — real run-to-run variance",
    ],
    links: [
      { label: "Full writeup (docs/research/MODEL_EVOLUTION_FIRST_EXPERIMENT.md)", href: "https://github.com/M4G3LL4N0/seai-mind/blob/main/docs/research/MODEL_EVOLUTION_FIRST_EXPERIMENT.md" },
    ],
  },
  {
    slug: "trustworthy-evolution",
    title: "Trustworthy Evolution — Repeated Real Runs",
    status: "complete",
    date: "2026-09-13 — executed live",
    summary:
      "The first experiment run with repeated independent model executions, per-task variance, and hash-signed evidence. Result: baseline 0.43 → candidate 0.47, gate HOLD — the gate refused to promote a noise-level gain that cost more tokens.",
    paragraphs: [
      "The Trustworthy Evolution phase added four mechanisms: repeated independent runs (every task executed three times per arm, caching forced off so each run is a genuine execution); per-task Bernoulli variance plus confidence; evidence immutability (records are signed with a SHA-256 evidenceHash and audited with seai evolve verify); and refusal to promote noise-level gains.",
      "Measured: baseline quality 0.43, candidate A (json-only-prompt) 0.47, runs per task 3, per-task variance 0.0000, confidence high, reproducibility limited (model-backed). Gate decision HOLD — quality delta +0.03 is below the 0.05 bar, and the constraint added +16.7% token cost against a 10% budget. Evidence hash 1667bc251f11adc9…, verified by seai evolve verify.",
      "The variance of 0.0000 is trustworthy because all 30 candidate-arm runs are verified independent executions: latency varies per run (930–2500ms), outputs vary (some fences, some pure JSON, some preamble), yet every outcome passed the deterministic criterion — identical outcomes across replications, hence zero Bernoulli variance.",
      "A cautionary control is documented too: before the cache rule, the same suite at repeatRuns: 2 reported 0.40 → 0.60 ELIGIBLE — but run 2 was the cached copy of run 1. With caching forced off the honest picture is 0.43 → 0.47 HOLD. Cached repeats are not measurements.",
    ],
    bullets: [
      "Baseline 0.43 → Candidate 0.47 · 3 real runs/task · variance 0.0000",
      "Gate: HOLD — +0.03 quality below threshold, +16.7% tokens over budget",
      "Evidence hash 1667bc251f11adc9… — store verifies with evolve verify",
      "Cache-masked control documented: cached repeats are not measurements",
      "The gate did its job: measure, compare, hold, do not promote on noise",
    ],
    links: [
      { label: "Full writeup (docs/research/TRUSTWORTHY_EVOLUTION_FIRST_EXPERIMENT.md)", href: "https://github.com/M4G3LL4N0/seai-mind/blob/main/docs/research/TRUSTWORTHY_EVOLUTION_FIRST_EXPERIMENT.md" },
    ],
  },
  {
    slug: "intelligence-efficiency",
    title: "Intelligence Efficiency",
    status: "experimental",
    date: "Core thesis — in progress",
    summary:
      "The core research question: can a small model inside an experienced, evolving Mind beat a large raw model — measured as verified useful outcome per unit of compute, latency, and cost? This is the thesis, with metrics defined and results measured as they arrive.",
    paragraphs: [
      "SE-AI's core thesis is: intelligence should be optimized, not merely scaled. Concretely, we want a Mind (model + memory + skills + experience + evolution) on small hardware to deliver more verified useful outcomes per compute than a raw large model.",
      "This is framed as an empirical question, not an assumption. The metric is under active development: verified useful outcome / (compute + memory + latency + energy + cost). The MicroMind experiment design (arms from raw 0.8B to full Mind) is the plan for testing it.",
      "No fabricated results: this page reports thesis, metric, plan, and any measured evidence; the planned experiment is not claimed as complete.",
    ],
    bullets: [
      "Thesis: intelligence should be optimized, not merely scaled",
      "Metric: verified useful outcome / (compute + memory + latency + energy + cost)",
      "Plan: MicroMind experiment (raw small model → full Mind on the same tasks)",
      "Status: ongoing — only measured evidence is reported as results",
    ],
    links: [
      { label: "Research questions (docs/roadmap/MASTER_ROADMAP.md)", href: "https://github.com/M4G3LL4N0/seai-mind/blob/main/docs/roadmap/MASTER_ROADMAP.md" },
    ],
  },
  {
    slug: "mindbench",
    title: "MindBench",
    status: "partial",
    date: "Infrastructure real — benchmark area",
    summary:
      "MindBench is the benchmark infrastructure for reproducible Mind experiments: suites, deterministic criteria, per-arm measurement, and gated comparison. It is real and exercised by the live experiments; the broader public benchmark corpus is not yet populated.",
    paragraphs: [
      "MindBench runs a task suite against one or more arms, measures each task with the configured criterion, and produces per-arm results that feed the gates. It records hardware, model, runtime, and configuration with every run; all results are labeled (SIMULATED / EXPERIMENTAL / MEASURED / VERIFIED) and no numbers are fabricated.",
      "The extraction-json-v1 suite (10 tasks, deterministic extractionCriterion) is the real, repeated suite used by both live experiments. The broader categorised benchmark corpus (correctness, quality, safety suites across categories) is partially built; public numbers are shown only where measured.",
    ],
    bullets: [
      "Suites with deterministic criteria — no LLM judge",
      "Per-arm measurement with raw evidence preserved",
      "Metrics: quality, success, verification, latency, tokens",
      "Real today: extraction-json-v1 and deterministic arithmetic suites",
      "Full corpus across categories: in progress",
    ],
    links: [
      { label: "Benchmarks page", href: "/benchmarks" },
    ],
  },
  {
    slug: "evolution",
    title: "Evolution — Gates and Lifecycle",
    status: "complete",
    date: "Implemented — gates verified live 2026-09-13",
    summary:
      "How evolution is governed: the decision table (eligible / hold / reject), the gate checks that implement it, configurable thresholds, repeated-run variance, evidence hashing, and promotion rules. The gate refused to promote a noise-level gain in the live experiment.",
    paragraphs: [
      "Evolution in SE-AI is a pipeline: observe → hypothesize → generate candidates → sandbox → evaluate on the identical workload → gate → promote (explicit) → monitor → rollback. The gate is a decision table — eligible, hold, or reject — implemented by explicit checks, not by vibes.",
      "A candidate is only promotable when it beats both the baseline and the noise floor: quality improvement above the threshold, no success regression, no safety/privacy violations, no category regression, latencies below budget, token cost within budget, and (with repeated runs) a signal that exceeds per-task variance.",
      "Promotion is never automatic by default; even an eligible record must be promoted by an explicit operation. Every promotion is reversible and writes lineage + audit events.",
    ],
    bullets: [
      "Decisions: eligible / hold / reject with human-readable reasons",
      "Checks: safety, privacy, regression-success, quality, latency, tokens, reproducibility, holdout, categories, variance-confidence, small-sample",
      "Configurable thresholds via GateThresholds",
      "Evidence hashing + tamper detection on every read",
      "Live gate verified 2026-09-13: held a noise-level +3% / +16.7% token change",
    ],
    links: [
      { label: "Evolution lifecycle", href: "/evolution" },
      { label: "EVOLUTION_GATES.md on GitHub", href: "https://github.com/M4G3LL4N0/seai-mind/blob/main/docs/architecture/EVOLUTION_GATES.md" },
    ],
  },
  {
    slug: "holdout-evaluation",
    title: "Holdout Evaluation",
    status: "experimental",
    date: "Mechanism real — corpus in progress",
    summary:
      "Candidates are measured on evolution tasks they have seen evidence for; holdout tasks must independently confirm or deny generalization. The first experiment documented exactly what holdout probing found — including an improvement that did not generalize.",
    paragraphs: [
      "A candidate's evidence comes from the evolution set. To test generalization, tasks outside the evolution set (holdout tasks) are probed and compared against a baseline holdout arm. The holdout-regression gate rejects a candidate that regresses on holdout quality.",
      "The principle is structural: candidate proposers only ever see baseline measurements on evolution tasks; the holdout never enters candidate evidence. This was verified by an adversarial live test in the trustworthy-evolution phase.",
      "Honest results matter more than flattering ones: the first experiment's unseen probe fenced 3/3 under a promoted format prompt while the in-suite probe passed 2/2 — that non-generalization is documented, not hidden.",
    ],
    bullets: [
      "Evolution set = candidate evidence; holdout set = generalization check",
      "holdout-regression gate rejects holdout regressions",
      "Adversarial test: candidate evidence never references holdout tasks",
      "First experiment reported non-generalization honestly",
    ],
    links: [
      { label: "Trustworthy Evolution experiment", href: "/research/trustworthy-evolution" },
    ],
  },
  {
    slug: "protected-capabilities",
    title: "Protected Capabilities",
    status: "experimental",
    date: "Mechanism real — category corpus in progress",
    summary:
      "Categories a Mind must not regress on, even when they are not the evolution target. Implemented as target-vs-global category regression checks in the gate; the category corpus is being built out.",
    paragraphs: [
      "Directed evolution optimizes a target; unmonitored, it can trade away abilities the user depends on. Protected capabilities make the trade visible and bounded: a candidate is rejected if it regresses any measured category beyond the configured budget, whether or not that category was the evolution target.",
      "Task categories (extraction, formatting, classification, instruction-following, safety, privacy, memory, tool-use, generalization) exist in the core schema; the category-aware gate runs per-category regression checks against the global delta. Coverage of all categories in live suites is in progress.",
    ],
    bullets: [
      "Target-vs-global regression analysis per category",
      "Reject-level check when any category regresses beyond maxCategoryRegression (0.10 default)",
      "Category taxonomy exists in the core schema",
      "Full category coverage in live suites: in progress",
    ],
    links: [
      { label: "EVOLUTION_GATES.md on GitHub", href: "https://github.com/M4G3LL4N0/seai-mind/blob/main/docs/architecture/EVOLUTION_GATES.md" },
    ],
  },
  {
    slug: "evolution-immune-system",
    title: "Evolution Immune System",
    status: "future",
    date: "Planned",
    summary:
      "Future work: a monitoring layer on top of the gates that continuously watches a promoted Mind, detects regression beyond statistical noise, and rolls back automatically — the immune system for a population of Minds.",
    paragraphs: [
      "Today evolution is governed by gates that decide promotions from measured experiments, with rollback available on demand. The planned immune system extends this to the monitoring loop: continuous evaluation of a promoted Mind, drift/regression detection that respects noise floors, and automatic rollback to the last verified state.",
      "This is future work. It is described because the roadmap is public, and it is marked FUTURE because it is not built.",
    ],
    bullets: [
      "Continuous monitoring of promoted Minds",
      "Noise-aware regression detection",
      "Automatic rollback to last verified state",
      "Status: FUTURE — designed, not built",
    ],
    links: [{ label: "Roadmap", href: "/roadmap" }],
  },
  {
    slug: "future-research",
    title: "Future Research",
    status: "future",
    date: "Planned",
    summary:
      "The research questions lined up behind the current work: evolution stability across generations, memory scaling, skill composition, model routing, and weight-level evolution (LoRA/adapters). All are designed and uncashed — no results are claimed.",
    paragraphs: [
      "Real research is a queue, and this is the queue: evolution stability (does evolution converge or diverge over 100 generations?), memory scaling (retrieval accuracy vs memory size), skill composition (emergent capability from skill chains), model routing (quality/latency/cost Pareto frontier), and weight evolution (LoRA/QLoRA adapters and distilled models once the platform's prompt/skill layers are exhausted).",
      "None of these have results yet. They are listed so the public research area can never misrepresent a plan as a finding.",
    ],
    bullets: [
      "Evolution stability across generations",
      "Memory scaling behavior",
      "Skill composition depth vs reliability",
      "Model routing Pareto frontier",
      "Weight-level evolution (adapters, distillation) — FUTURE",
    ],
    links: [{ label: "Roadmap", href: "/roadmap" }],
  },
];

export function getResearchEntry(slug: string): ResearchEntry | undefined {
  return researchEntries.find((e) => e.slug === slug);
}