"use client";

import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { CTASection } from "@/components/home/CTASection";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { Code, Target, Brain, Zap, GitBranch, CheckCircle, Clock, AlertTriangle, ChevronRight, ArrowRight, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const releases = [
  {
    generation: 1,
    codename: "Darwin",
    version: "0.1.0-alpha",
    theme: "Evolution Infrastructure",
    status: "current",
    date: "2025",
    capabilities: [
      "Monorepo architecture with pnpm",
      "Core schemas (Zod) for all domain objects",
      "Kernel: Error handling, Result pattern, utilities",
      "Hardware detection (CPU, GPU, RAM, storage, thermal, battery)",
      "Telemetry: Event system with persistence",
      "Security: Capability-based, threat detection, privacy gates",
      "Policy: Decision engine for routing, tools, memory, evolution",
      "Storage: SQLite + Memory + File adapters with repositories",
      "Models: Runtime abstraction, registry, Ollama/MLX/llama.cpp adapters",
      "Providers: Registry with lifecycle management",
      "Routing: Policy-driven model selection",
      "Memory: Multi-type (10 types) with full lifecycle",
      "Skills: Engine with composition, validation, templates",
      "Tools: Capability-based with sandboxed execution",
      "Cognition: Task pipeline (classify→cache→memory→skill→tool→model→verify→escalate)",
      "Compiler: Goal → Task Graph with optimization",
      "Evaluation: Suites (correctness, quality, safety) + LLM judge",
      "Evolution: Candidate gen, sandbox, regression, reviews, promotion, rollback",
      "Genome: Versioning, branching, diff, reproduction, rollback",
      "Benchmark: MindBench with 20 metrics and provenance",
      "Mind Runtime: Integrated system with task execution",
      "SDK: High-level client API",
      "CLI: seai command (doctor, init, run, goal, evolve, benchmark)",
      "PAIOS Reference Mind specification",
      "Codename System documentation",
      "AGENTS.md development guide",
    ],
    nextSteps: [
      "Fix TypeScript strictness issues",
      "Implement Ollama/MLX/llama.cpp runtimes",
      "Run MicroMind Experiment 001",
      "First evolution demo",
    ],
  },
  {
    generation: 2,
    codename: "Woz",
    version: "0.2.x",
    theme: "Developer Experience",
    status: "planned",
    date: "Target: Q2 2026",
    capabilities: [
      "VS Code extension for Mind development",
      "Debug adapter for cognitive traces",
      "Visual pipeline editor (compiler graphs)",
      "Genome browser with diff/blame",
      "Skill registry with versioning",
      "Dependency resolution for skills",
      "Skill composition DSL",
      "Community skill sharing",
      "Real-time observability dashboard",
      "Distributed tracing",
      "Cost/latency profiling",
      "Evolution history visualization",
      "Property-based testing for skills",
      "Chaos engineering for evolution",
      "Regression detection automation",
      "Benchmark CI integration",
    ],
    nextSteps: [],
  },
  {
    generation: 3,
    codename: "Turing",
    version: "0.3.x",
    theme: "Reasoning & Planning",
    status: "planned",
    date: "Target: Q4 2026",
    capabilities: [
      "Multi-step planning with backtracking",
      "Chain-of-thought verification",
      "Self-consistency checking",
      "Uncertainty quantification",
      "Structured knowledge graphs",
      "RAG with citation tracking",
      "Fact verification pipeline",
      "Knowledge distillation",
      "Learning to learn (meta-learning)",
      "Few-shot adaptation",
      "Hyperparameter optimization",
      "Architecture search",
    ],
    nextSteps: [],
  },
];

const statusConfig = {
  current: { label: "Current", variant: "darwin" as const, color: "darwin" },
  planned: { label: "Planned", variant: "default" as const, color: "slate" },
};

export default function ReleasesPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        <section className="py-28 lg:py-36 bg-slate-50 dark:bg-slate-950">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto text-center mb-16"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-seai-100 text-seai-700 dark:bg-seai-900/50 dark:text-seai-300 text-sm font-medium mb-4">
                Releases
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-950 dark:text-white mb-4">
                Release History
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
                Every generation has a codename, semantic version, and thematic breakthrough. Codenames are assigned, not assumed.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-12"
            >
              {releases.map((release, i) => (
                <motion.article
                  key={release.codename}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  className="relative"
                >
                  <div className="flex items-center gap-4 mb-8">
                    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center", release.status === "current" ? "bg-darwin-100 dark:bg-darwin-900/50" : "bg-slate-100 dark:bg-slate-800")}>
                      <Brain className={cn("h-8 w-8", release.status === "current" ? "text-darwin-600 dark:text-darwin-400" : "text-slate-600 dark:text-slate-400")} aria-hidden="true" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl font-bold text-slate-950 dark:text-white">
                          SE-AI Mind
                        </span>
                        <span className={cn("px-3 py-1 rounded-full text-sm font-semibold", release.status === "current" ? "bg-darwin-100 text-darwin-700 dark:bg-darwin-900/50 dark:text-darwin-300" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300")}>
                          {release.codename} {release.version}
                        </span>
                        <Badge variant={statusConfig[release.status as keyof typeof statusConfig].variant}>
                          {statusConfig[release.status as keyof typeof statusConfig].label}
                        </Badge>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400"><strong>Theme:</strong> {release.theme} • <strong>Target:</strong> {release.date}</p>
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
                  >
                    {release.capabilities.slice(0, 12).map((cap, j) => (
                      <motion.div
                        key={cap}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.4, delay: j * 0.03 }}
                        className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                      >
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" aria-hidden="true" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{cap}</span>
                      </motion.div>
                    ))}
                    {release.capabilities.length > 12 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center text-slate-600 dark:text-slate-400"
                      >
                        +{release.capabilities.length - 12} more capabilities...
                      </motion.div>
                    )}
                  </motion.div>

                  {release.nextSteps.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="p-6 rounded-2xl bg-darwin-50 dark:bg-darwin-900/50 border border-darwin-200 dark:border-darwin-800"
                    >
                      <h3 className="font-semibold text-slate-950 dark:text-white mb-4 flex items-center gap-2">
                        <Target className="h-5 w-5 text-darwin-600" aria-hidden="true" />
                        Next Steps for {release.codename}
                      </h3>
                      <ul className="space-y-2">
                        {release.nextSteps.map((step, j) => (
                          <motion.li
                            key={step}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: j * 0.1 }}
                            className="flex items-center gap-2 text-slate-700 dark:text-slate-300"
                          >
                            <ArrowRight className="h-4 w-4 text-darwin-500 flex-shrink-0" aria-hidden="true" />
                            {step}
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </motion.article>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.8 }}
              id="codenames"
              className="mt-20 p-8 rounded-3xl bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
            >
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Codename Registry
                </h2>
                <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
                  Codenames are evaluated for recognizability, thematic fit, trademark risk, and cultural associations. 
                  Names shown as <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-200">PLANNED</span> are candidates, not promises.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {[
                    { name: "Darwin", status: "current", theme: "Evolution" },
                    { name: "Woz", status: "planned", theme: "Dev Experience" },
                    { name: "Turing", status: "planned", theme: "Reasoning" },
                    { name: "Tesla", status: "planned", theme: "Infrastructure" },
                    { name: "Einstein", status: "planned", theme: "Science" },
                    { name: "Satoshi", status: "candidate", theme: "Sovereign" },
                    { name: "Asimov", status: "candidate", theme: "Governed AI" },
                    { name: "Da Vinci", status: "candidate", theme: "Creative" },
                    { name: "Newton", status: "candidate", theme: "Physics" },
                    { name: "Hopper", status: "candidate", theme: "Engineering" },
                  ].map((codename) => (
                    <span
                      key={codename.name}
                      className={cn(
                        "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                        codename.status === "current" ? "bg-darwin-500 text-white" :
                        codename.status === "planned" ? "bg-slate-700 text-white hover:bg-slate-600" :
                        "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                      )}
                    >
                      {codename.name}
                      {codename.status === "candidate" && <span className="ml-1 text-xs opacity-70">?</span>}
                    </span>
                  ))}
                </div>
                <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
                  <em>Disclaimer: Codenames honor historical/fictional figures. No endorsement by any person, estate, or organization is implied or claimed.</em>
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        <CTASection
          title="Currently on Darwin 0.1"
          description="The first generation establishes evolution infrastructure. Join us in building the future."
          primaryAction={{ label: "Read Darwin Spec", href: "/darwin" }}
          secondaryActions={[
            { label: "View Roadmap", href: "/docs/roadmap", variant: "outline" },
            { label: "Contribute", href: "/contributing", variant: "ghost" },
          ]}
        />
      </main>
      <Footer />
    </>
  );
}