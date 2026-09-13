import type { FeatureStatus } from "./types";

export interface MetricCategory {
  name: string;
  description: string;
  direction: "higher-better" | "lower-better" | "info";
  available: boolean;
  note: string;
}

// The metric families MindBench measures where available. `available` means
// the metric is actually captured by the current experiment runner.
export const metricCategories: MetricCategory[] = [
  { name: "Quality", description: "Score from the suite criterion (0-1).", direction: "higher-better", available: true, note: "Measured — extraction & arithmetic suites" },
  { name: "Success", description: "Fraction of tasks executed successfully.", direction: "higher-better", available: true, note: "Measured per run" },
  { name: "Verification", description: "Whether every task passed the criterion.", direction: "higher-better", available: true, note: "Deterministic criterion, no LLM judge" },
  { name: "Latency", description: "Mean wall time per run (ms).", direction: "lower-better", available: true, note: "Measured per run" },
  { name: "Tokens", description: "Mean tokens consumed per run.", direction: "lower-better", available: true, note: "Measured per run" },
  { name: "Cost", description: "Estimated spend per run.", direction: "lower-better", available: false, note: "Available when a priced provider is registered" },
  { name: "Model calls", description: "Model invocations per task.", direction: "lower-better", available: false, note: "Captured in telemetry, not yet in the public suite summary" },
  { name: "Tool calls", description: "Tool invocations per task.", direction: "lower-better", available: false, note: "Requires tool-backed suites" },
  { name: "Memory retrieval", description: "Memory reads per task.", direction: "info", available: false, note: "Requires memory-backed suites" },
  { name: "Escalations", description: "Tasks escalated to a higher model/permission level.", direction: "lower-better", available: false, note: "Requires multi-runtime environments" },
  { name: "Resource usage", description: "CPU/RAM utilization during runs.", direction: "info", available: false, note: "Hardware telemetry exists; surfaced per hardware profile" },
];

export interface BenchmarkArm {
  name: string;
  success: string;
  quality: string;
  latency: string;
  tokens: string;
  variance?: string;
  confidence?: string;
  reproducibility?: string;
}

export interface BenchmarkExperiment {
  id: string;
  slug: string;
  title: string;
  date: string;
  kind: FeatureStatus;
  summary: string;
  suite: string;
  model: string;
  runtime: string;
  tasks: number;
  runsPerTask: number;
  gate: "eligible" | "hold" | "reject";
  gateDetail: string;
  arms: BenchmarkArm[];
  notes: string[];
  limitations: string[];
  evidence: { label: string; value: string }[];
}

// Only MEASURED experiments are listed. Every number traces to a persisted
// ExperimentRecord in the repository (see docs/research/).
export const experiments: BenchmarkExperiment[] = [
  {
    id: "e09b4797-91e2-…",
    slug: "model-evolution",
    title: "Model Evolution — First Experiment",
    date: "2026-09-11",
    kind: "complete",
    summary:
      "First model-backed evolution experiment on a 10-task extraction suite with qwen2.5-coder:3b. JSON-only instruction moved quality from 0.30 to 0.70; a polite nudge reached 0.80. ELIGIBLE, promoted, adopted in a fresh process, then rolled back — all verified live.",
    suite: "extraction-json-v1",
    model: "qwen2.5-coder:3b (Ollama)",
    runtime: "ollama — sole healthy runtime, probed",
    tasks: 10,
    runsPerTask: 1,
    gate: "eligible",
    gateDetail: "Both candidates ELIGIBLE: quality delta ≥ 0.05, tokens within 10% budget, identical workload, deterministic criterion. Promotion explicit and reversible.",
    arms: [
      { name: "Baseline (stock prompt)", success: "10/10", quality: "0.30", latency: "2046.2 ms", tokens: "875" },
      { name: "Candidate A (json-only-prompt)", success: "10/10", quality: "0.70", latency: "2045.1 ms", tokens: "895 (+2.3%)" },
      { name: "Candidate B (polite-json-prompt)", success: "10/10", quality: "0.80", latency: "2024.6 ms", tokens: "807" },
    ],
    notes: [
      "Deterministic extractionCriterion — pure JSON.parse + required-field equality. No LLM judge.",
      "Raw per-task evidence shows fences/preambles in the baseline arm and pure JSON in candidate arms.",
      "Fresh-process probe under the promoted prompt returned pure JSON 2/2.",
      "Rollback restored the parent genome; lineage and audit history intact.",
    ],
    limitations: [
      "Single small model, single server — no claim about other models.",
      "Prompt ≠ robust fix: an unseen probe (\"Bob is 41\") fenced 3/3 under the promoted prompt while the in-suite probe passed 2/2.",
      "Stochastic: a second run measured baseline 0.40 / candidate 0.50 — run-to-run variance is real.",
      "Prompt-only: weights, routing, memory, and skills untouched.",
    ],
    evidence: [
      { label: "Experiment id", value: "e09b4797-91e2-… (Mind demo)" },
      { label: "Evidence level", value: "MEASURED — raw records persisted" },
      { label: "Reproducibility", value: "limited (model-backed)" },
    ],
  },
  {
    id: "e3f4bca4-ec04-4ff6-a656-c32fb7f31397",
    slug: "trustworthy-evolution",
    title: "Trustworthy Evolution — Repeated Real Runs",
    date: "2026-09-13",
    kind: "complete",
    summary:
      "First experiment with repeated independent runs (3 per task), per-task variance, and hash-signed evidence. Baseline 0.43 → candidate 0.47 at +16.7% tokens. The gate HOLD — it refused to promote a noise-level gain. That refusal is the result.",
    suite: "extraction-json-v1",
    model: "qwen2.5-coder:3b (Ollama)",
    runtime: "ollama — single healthy runtime",
    tasks: 10,
    runsPerTask: 3,
    gate: "hold",
    gateDetail: "quality-improvement: +0.03 below the 0.05 threshold (indistinguishable from noise at this sample size). cost-tokens: +16.7% over the 10% budget.",
    arms: [
      { name: "Baseline (stock prompt)", success: "30/30", quality: "0.43", latency: "varies per run", tokens: "recorded per run", variance: "0.0000", confidence: "high", reproducibility: "limited" },
      { name: "Candidate A (json-only-prompt)", success: "30/30", quality: "0.47", latency: "varies per run", tokens: "recorded per run (+16.7%)", variance: "0.0000", confidence: "high", reproducibility: "limited" },
    ],
    notes: [
      "Cache forced OFF for repeated runs — every run is a real execution, not a cached copy.",
      "Latency varies across the 30 candidate runs (≈830–2500 ms) and outputs vary (fences/pure JSON/preamble), yet every outcome passed the deterministic criterion — hence zero Bernoulli variance.",
      "Evidence hash 1667bc251f11adc9… — seai evolve verify reports 1 line, verified, 0 tampered.",
      "Control documented: with caching on, the same suite reported 0.40 → 0.60 ELIGIBLE — a cache artifact. Cached repeats are not measurements.",
    ],
    limitations: [
      "Single small model, single host.",
      "10-task suite — small-N caution applies; larger suites raise power.",
      "Zero outcome variance does not mean identical prose — the raw text still varies.",
      "One run is one sample; point estimates move with stochastic models.",
    ],
    evidence: [
      { label: "Experiment id", value: "e3f4bca4-ec04-4ff6-a656-c32fb7f31397 (Mind trustworthy)" },
      { label: "Evidence level", value: "MEASURED — hash-signed" },
      { label: "Evidence hash", value: "1667bc251f11adc9…" },
    ],
  },
];

export function getExperiment(slug: string): BenchmarkExperiment | undefined {
  return experiments.find((e) => e.slug === slug);
}