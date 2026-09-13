import { site } from "./site";
import type { Doc, DocSection, NavLink } from "./types";

// ─── The docs reference tree ────────────────────────────────────────────────
// Every slug here is a real page. The doc hub only links to slugs that exist
// in `docs` below, or to known sections. Never add a link without a page.

export interface DocSectionGroup {
  label: string;
  docs: NavLink[];
}

export const docSections: DocSectionGroup[] = [
  {
    label: "Getting Started",
    docs: [{ href: "/docs/getting-started", label: "Getting Started", description: "Build your first Mind locally" }],
  },
  {
    label: "Architecture",
    docs: [
      { href: "/docs/architecture", label: "Architecture", description: "7 build units and dependency direction" },
      { href: "/docs/evolution", label: "Evolution", description: "Lifecycle, gates, promotion rules" },
      { href: "/docs/memory", label: "Memory", description: "Mind-scoped, multi-type persistence" },
      { href: "/docs/runtime", label: "Runtime", description: "Provider-neutral execution and adapters" },
    ],
  },
  {
    label: "Minds",
    docs: [
      { href: "/docs/minds", label: "Minds", description: "What a Mind contains; PAIOS reference" },
      { href: "/docs/skills", label: "Skills", description: "The skill engine" },
      { href: "/docs/tools", label: "Tools", description: "Capability-scoped tools" },
      { href: "/docs/genome", label: "Genome", description: "Versioning, branching, rollback" },
    ],
  },
  {
    label: "Intelligence",
    docs: [
      { href: "/docs/evaluation", label: "Evaluation", description: "Suites and deterministic criteria" },
      { href: "/docs/benchmarks", label: "Benchmarks", description: "MindBench measurements and labels" },
    ],
  },
  {
    label: "Interfaces",
    docs: [
      { href: "/docs/cli", label: "CLI", description: "seai commands: init, run, evolve, verify" },
      { href: "/docs/sdk", label: "SDK", description: "Programmatic access to the kernel" },
    ],
  },
  {
    label: "Operations",
    docs: [
      { href: "/docs/security", label: "Security", description: "Capabilities, sandboxing, audit" },
      { href: "/docs/privacy", label: "Privacy", description: "Default-deny data flows" },
      { href: "/docs/contributing", label: "Contributing", description: "How to work on the kernel" },
    ],
  },
];

// ─── Page bodies ───────────────────────────────────────────────────────────┐
function block(
  paragraphs: string[] | string = [],
  bullets?: string[],
  table?: { headers: string[]; rows: string[][] },
): DocSection {
  const paras = Array.isArray(paragraphs) ? paragraphs : [paragraphs];
  return { paragraphs: paras, bullets, table };
}

const docs: Doc[] = [
  {
    slug: "getting-started",
    title: "Getting Started",
    description: "Clone, install, and run your first Mind — then take it through its first evolution loop.",
    sections: [
      block(["SE-AI is a pnpm monorepo. Install the workspace, build in dependency order, then use the CLI to bring a Mind to life and evolve it. Everything below runs on your own hardware; no account or API key is needed."]),
      block(
        ["Build the workspace and check your environment:"],
        [
          "pnpm install — install the workspace",
          "pnpm build — build all packages in dependency order",
          "pnpm test — run the full test suite",
          "node packages/cli/dist/cli.js doctor — hardware + runtime health check",
          "node packages/cli/dist/cli.js init --name DarwinTest — create a Mind",
          "node packages/cli/dist/cli.js run \"What is 2 + 2?\" — execute a task",
        ],
        {
          headers: ["Command", "Purpose"],
          rows: [
            ["seai init --name <mind>", "Create a persistent Mind"],
            ["seai run \"…\"", "Execute a task through cognition"],
            ["seai status", "Mind readiness"],
            ["seai doctor", "Hardware + runtime health check"],
            ["seai evolve …", "Propose, gate, promote, rollback"],
            ["seai evolve verify --mind <name>", "Audit evidence-hash integrity"],
          ],
        },
      ),
      block(
        ["With a local Ollama server running, model tasks execute for real; without one, the system fails honestly instead of faking inference. No MAX-style stub, no simulated results."],
        undefined,
        undefined,
      ),
    ],
  },
  {
    slug: "architecture",
    title: "Architecture",
    description: "Seven build units, a four-layer kernel, and one dependency direction.",
    sections: [
      block([
        "The repository is a pnpm monorepo with four kernel units and three interfaces. Dependency direction is one-way: core ← runtime/state ← mind ← sdk ← cli. The web site is standalone and never imports kernel code.",
      ]),
      block(
        undefined,
        [
          "core — foundation primitives: Result/errors, Zod schemas, telemetry, capability security, policy, storage abstraction, hardware detection",
          "runtime — provider-neutral execution contract, model/provider registries, routing engine; adapters live in src/adapters",
          "state — persistent mind state: memory, skills, tools, genome",
          "mind — the orchestrator: Mind runtime, cognition pipeline, goal compiler, evaluation, evolution, benchmark",
          "sdk — high-level client API and composition-root bootstrap",
          "cli — the seai command-line interface",
          "web — standalone documentation and product site",
        ],
        {
          headers: ["Unit", "Layer", "Role"],
          rows: [
            ["core", "kernel", "foundation primitives"],
            ["runtime", "kernel", "provider-neutral execution"],
            ["state", "kernel", "persistent mind state"],
            ["mind", "kernel", "central orchestrator"],
            ["sdk", "interface", "client API"],
            ["cli", "interface", "command-line interface"],
            ["web", "interface", "standalone site"],
          ],
        },
      ),
      block(
        [
          "Runtime adapters are optional: the kernel talks to a contract, not to a vendor. Provider neutrality is structural — models and providers are registered, discovered, verified, and routed. Memory isolation is structural too: every memory entry carries a required mindId, so Minds cannot read each other. Cognition is a pipeline (deterministic → skill → tool → model) that fails honestly when nothing can handle a task.",
        ],
        undefined,
        undefined,
      ),
    ],
  },
  {
    slug: "evolution",
    title: "Evolution",
    description: "How a Mind improves itself — measured, gated, reversible.",
    sections: [
      block([
        "Evolution turns experience into improved behavior. The loop is OBSERVE → LEARN → HYPOTHESIZE → CANDIDATE → EVALUATE → HOLDOUT → GATE → PROMOTE → MONITOR → ROLLBACK. Everything below the promotion step is reversible; nothing promotes on noise.",
      ]),
      block(
        "The gate is a decision table — eligible, hold, or reject — implemented by explicit checks:",
        [
          "eligible — may be promoted by an explicit operation",
          "hold — inconclusive; keep observing",
          "reject — must not be promoted",
          "variance-confidence and small-sample checks prevent noise-level gains from passing",
          "evidence is SHA-256 hashed; tampered lines are excluded on read",
        ],
      ),
      block(
        "Promotion rules (implemented in experiment.ts)",
        [
          "runExperiment() never promotes; auto-promote defaults to false",
          "only promoteExperiment() moves CANDIDATE → PRODUCTION, and only for eligible records",
          "every promotion/rollback writes lineage and audit events",
        ],
      ),
      block(
        "Both live experiments are documented in research. The gate has refused a noise-level +3% / +16.7%-tokens change — that refusal is the intended behavior.",
      ),
    ],
    sources: [
      { label: "EVOLUTION_GATES.md in full", href: "https://github.com/M4G3LL4N0/seai-mind/blob/main/docs/architecture/EVOLUTION_GATES.md" },
      { label: "Live experiments", href: "/evolution/live" },
    ],
  },
  {
    slug: "memory",
    title: "Memory",
    description: "Persistent, multi-type, and strictly Mind-scoped.",
    sections: [
      block([
        "A Mind remembers across sessions. Memory is multi-type — working, episodic, semantic, procedural, identity, preference, temporal, relational, negative, reflective — with lifecycle rules for consolidation, decay, archive, and deletion.",
      ]),
      block(
        "Isolation and privacy",
        [
          "every memory entry is scoped by a required mindId — no cross-Mind access",
          "data classification on every entry; default-deny across privacy levels",
          "redaction for lower-privacy contexts; audit trail for privacy decisions",
          "privacy gates and the evolution privacy-config check refuse candidate changes to memory paths",
        ],
      ),
    ],
  },
  {
    slug: "runtime",
    title: "Runtime",
    description: "Provider-neutral execution: run any Mind on any healthy model runtime.",
    sections: [
      block([
        "The runtime unit defines an execution contract and provides registries, availability probing, and a routing engine. Adapters implement the contract for concrete runtimes. Because adapters live behind a contract, the kernel is provider-neutral.",
      ]),
      block(
        undefined,
        [
          "ollama — REAL reference adapter, exercised by live evolution experiments",
          "llamacpp — mostly real",
          "mlx — STUB, labeled as such in code",
          "local — intentional test fixture, never auto-registered",
          "Model/provider lifecycle: discovered → verified → benchmarked → approved → canary → active",
          "Routing is policy-driven over healthy runtimes",
        ],
      ),
    ],
  },
  {
    slug: "minds",
    title: "Minds",
    description: "What a Mind is — and the PAIOS reference implementation.",
    sections: [
      block([
        "A Mind is Model + Memory + Skills + Tools + Identity + Goals + Experience + Evaluation + Evolution + Governance. It is persistent, specialized, measurable, and — under explicit gates — self-evolving.",
      ]),
      block(undefined, [
        "Identity and goals give a Mind a direction",
        "Memory, skills, and tools give it capability",
        "Experience feeds evaluation, which feeds evolution",
        "Governance keeps every change explicit and reversible",
      ]),
      block([
        "PAIOS (Personal AI Operating System) is the first real SE-AI reference Mind: a local-first personal assistant with private-by-default data handling. It is a reference implementation of the platform, not a product. See the PAIOS page and spec.",
      ]),
    ],
    sources: [{ label: "PAIOS page", href: "/minds/paios" }],
  },
  {
    slug: "skills",
    title: "Skills",
    description: "The skill engine: composition and validation.",
    sections: [
      block([
        "Skills give a Mind reusable procedures. The engine supports composition, validation, and built-in templates. Built-in examples in the PAIOS spec: reasoning, code-generation, summarization, extraction, planning.",
      ]),
      block(
        "Honest status",
        [
          "skill engine with composition and validation: PARTIAL",
          "some executors are stubbed — labeled, not presented as complete",
          "full skill composition across executors is on the roadmap",
        ],
      ),
    ],
  },
  {
    slug: "tools",
    title: "Tools",
    description: "Capability-scoped tools with sandboxed execution.",
    sections: [
      block([
        "Tools extend a Mind beyond text. Access is capability-based — a Mind only invokes tools its established permissions allow. Executions are sandboxed and the intent of OS-level sandboxing is real, though the full OS sandbox is marked STUB in code.",
      ]),
      block(undefined, [
        "capability-based permissions enforced at the tool layer",
        "sandboxed execution with audit logging",
        "candidate evolution changes cannot add tool permissions (privacy-config gate)",
      ]),
    ],
  },
  {
    slug: "evaluation",
    title: "Evaluation",
    description: "Suites with deterministic criteria — no LLM judge.",
    sections: [
      block([
        "Evaluation measures a Mind on a task suite. The criterion decides pass/fail. SE-AI deliberately uses deterministic criteria — pure JSON.parse plus required-field equality, for example — rather than an LLM judge, so 'better' stays a measurable fact, not an opinion.",
      ]),
      block(undefined, [
        "deterministic criteria for measurable guarantees",
        "raw per-task evidence preserved on every record",
        "LLM-judge framework exists in the codebase but is labeled and not used for promotion evidence",
        "evaluation feeds the gates — quality, success, and regression checks",
      ]),
    ],
  },
  {
    slug: "genome",
    title: "Genome",
    description: "Versioning, branching, diff, and rollback for a Mind's changes.",
    sections: [
      block([
        "A Mind's changes are versioned in a genome: every promotion creates a new version, lineage is tracked, and rollback restores the parent with intact history. Re-promotion after rollback creates a branch continuation.",
      ]),
      block(undefined, [
        "versioning and rollback: REAL",
        "branching and diff tooling: PARTIAL",
        "genome state persists in the state unit",
      ]),
    ],
  },
  {
    slug: "benchmarks",
    title: "Benchmarks",
    description: "MindBench: reproducible, labeled measurements.",
    sections: [
      block([
        "MindBench runs a task suite against arms and produces per-arm measurements that feed the gates. Every result carries an evidence label — PLANNED, SIMULATED, EXPERIMENTAL, MEASURED, VERIFIED, PRODUCTION — and records hardware, model, and configuration with it. No fabricated numbers.",
      ]),
      block(undefined, [
        "metrics where available: quality, success, verification, latency, tokens, cost, model calls, tool calls, memory retrieval, escalations, resource usage",
        "real today: extraction-json-v1 and deterministic arithmetic suites",
        "public numbers are shown only when measured",
      ]),
    ],
    sources: [{ label: "MindBench page", href: "/benchmarks" }],
  },
  {
    slug: "cli",
    title: "CLI",
    description: "seai — the command-line interface to the kernel.",
    sections: [
      block([
        "The CLI gives you the whole system from a terminal. It requires no API keys; local models are discovered and routed. Without a reachable runtime, model tasks fail honestly.",
      ]),
      block(undefined, [
        "seai init --name <mind> — create a Mind",
        "seai run \"…\" — execute a task",
        "seai status / seai doctor — readiness and health",
        "seai evolve propose --mind <name> --suite <suite> --models --repeat-runs <n> — run an experiment",
        "seai evolve history / compare / promote / rollback — manage the experiment store",
        "seai evolve verify --mind <name> — audit evidence-hash integrity",
      ]),
    ],
  },
  {
    slug: "sdk",
    title: "SDK",
    description: "Programmatic access to the kernel from TypeScript.",
    sections: [
      block([
        "The SDK is the high-level client API and composition-root bootstrap. It exposes MindRuntime, evolve(), and runExperiment() with typed options — including repeatRuns and gateThresholds — so applications can drive experiments without touching kernel internals.",
      ]),
      block(undefined, [
        "MindRuntime.evolve() with repeat-runs and gate overrides",
        "enableLocalRuntimes() bootstrap for local model discovery",
        "typed results including variance, confidence, and evidenceHash",
      ]),
    ],
  },
  {
    slug: "security",
    title: "Security",
    description: "Capability-based permissions, sandboxed evolution, audit trails.",
    sections: [
      block([
        "Security is capability-based: every action requires an explicit permission (mind:execute, memory:read, tool:execute, and so on). Evolution candidates are reviewed — security, privacy, and cost — before promotion, and run in an isolated environment.",
      ]),
      block(undefined, [
        "capability-based permissions enforced on all execution",
        "threat detection over candidate changes (safety-threat-scan)",
        "safety allowlist: candidates can only touch allowed configuration keys",
        "sandboxed evolution candidates; audit logging for sensitive operations",
        "never commit secrets; all external inputs validated with Zod",
      ]),
    ],
    sources: [{ label: "Security page", href: "/security" }],
  },
  {
    slug: "privacy",
    title: "Privacy",
    description: "Default-deny data flows and local-first personal intelligence.",
    sections: [
      block([
        "SE-AI's privacy posture is default-deny: cross-privacy-level access is denied unless explicitly granted, all memory entries carry data classification, and lower-privacy contexts receive redaction. PRIVATE/CONFIDENTIAL data stays local by default; external providers only ever see PUBLIC/INTERNAL data, and only with consent.",
      ]),
      block(undefined, [
        "default level PRIVATE; allowed levels PUBLIC, INTERNAL, PRIVATE",
        "designated tests for privacy authorization paths",
        "audit trail for every privacy decision",
        "no provider credentials in client code",
      ]),
    ],
    sources: [{ label: "Privacy page", href: "/privacy" }],
  },
  {
    slug: "contributing",
    title: "Contributing",
    description: "Build on the kernel: conventions, tests, and workflow.",
    sections: [
      block([
        "SE-AI evolves the same way it tells users to: measured and gated. Patches follow the repo's documented conventions — TypeScript strict mode, Zod schemas for public APIs, SEAI error classes, and tests before claims.",
      ]),
      block(undefined, [
        "conventional commits (feat, fix, docs, refactor, test, chore)",
        "feature branches and PRs; no direct commits to main",
        "every claim traceable to code or data — no fabricated numbers",
        "update docs/architecture/ for structural changes, record decisions in docs/decisions/",
      ]),
    ],
    sources: [{ label: "Repository", href: site.github }],
  },
];

export const docsMap: Record<string, Doc> = Object.fromEntries(docs.map((d) => [d.slug, d]));
export const docsList = docs;

export function getDoc(slug: string): Doc | undefined {
  return docsMap[slug];
}