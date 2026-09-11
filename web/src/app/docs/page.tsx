"use client";

import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { CTASection } from "@/components/home/CTASection";
import { cn } from "@/lib/utils";
import { BookOpen, Code, Brain, Database, Wrench, Box, ArrowRightLeft, FlaskConical, Shield, Zap, Terminal, GitBranch, ChevronRight, FileText, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const docSections = [
  {
    id: "getting-started",
    label: "Getting Started",
    icon: BookOpen,
    color: "seai",
    pages: [
      { title: "Installation", href: "/docs/getting-started", description: "Install SE-AI CLI and dependencies" },
      { title: "Quick Start", href: "/docs/quickstart", description: "Run your first Mind in 5 minutes" },
      { title: "Configuration", href: "/docs/configuration", description: "Configure hardware, models, and privacy" },
      { title: "Doctor Check", href: "/docs/doctor", description: "Verify system health and dependencies" },
    ],
  },
  {
    id: "concepts",
    label: "Core Concepts",
    icon: Brain,
    color: "darwin",
    pages: [
      { title: "Model vs Mind", href: "/docs/concepts/model-vs-mind", description: "The fundamental distinction" },
      { title: "Cognitive Compiler", href: "/docs/concepts/compiler", description: "Goal → Task Graph optimization" },
      { title: "Evolution Loop", href: "/docs/concepts/evolution", description: "12-gate governed evolution" },
      { title: "Intelligence Efficiency", href: "/docs/concepts/efficiency", description: "Metric: Outcome / Resources" },
      { title: "Privacy Gates", href: "/docs/concepts/privacy", description: "Default deny, local-first" },
    ],
  },
  {
    id: "minds",
    label: "Minds",
    icon: Brain,
    color: "seai",
    pages: [
      { title: "Mind Specification", href: "/docs/minds/spec", description: "Complete Mind configuration schema" },
      { title: "Mind Lifecycle", href: "/docs/minds/lifecycle", description: "Create, run, evolve, export, import" },
      { title: "PAIOS Reference", href: "/docs/minds/paios", description: "First reference implementation" },
      { title: "Custom Minds", href: "/docs/minds/custom", description: "Build your own Mind" },
    ],
  },
  {
    id: "memory",
    label: "Memory",
    icon: Database,
    color: "darwin",
    pages: [
      { title: "Memory Types", href: "/docs/memory/types", description: "10 memory types explained" },
      { title: "Lifecycle", href: "/docs/memory/lifecycle", description: "Capture → Consolidate → Archive" },
      { title: "Consolidation", href: "/docs/memory/consolidation", description: "Compression, decay, forgetting" },
      { title: "Retrieval", href: "/docs/memory/retrieval", description: "Query, ranking, embeddings" },
    ],
  },
  {
    id: "skills",
    label: "Skills",
    icon: Wrench,
    color: "seai",
    pages: [
      { title: "Skill Anatomy", href: "/docs/skills/anatomy", description: "Inputs, outputs, procedure, evaluator" },
      { title: "Built-in Skills", href: "/docs/skills/builtin", description: "Reasoning, coding, extraction, planning" },
      { title: "Skill Composition", href: "/docs/skills/composition", description: "Chaining and parallel execution" },
      { title: "Custom Skills", href: "/docs/skills/custom", description: "Create and register skills" },
      { title: "Validation", href: "/docs/skills/validation", description: "Test cases and benchmarks" },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    icon: Box,
    color: "darwin",
    pages: [
      { title: "Tool Capabilities", href: "/docs/tools/capabilities", description: "Web, file, shell, code, HTTP, database" },
      { title: "Toolchains", href: "/docs/tools/toolchains", description: "Research, coding, data analysis" },
      { title: "Sandboxing", href: "/docs/tools/sandboxing", description: "Isolation, permissions, limits" },
      { title: "Custom Tools", href: "/docs/tools/custom", description: "Register new capabilities" },
    ],
  },
  {
    id: "models",
    label: "Models & Routing",
    icon: Brain,
    color: "seai",
    pages: [
      { title: "Model Registry", href: "/docs/models/registry", description: "Register, discover, filter models" },
      { title: "Runtime Adapters", href: "/docs/models/runtimes", description: "Ollama, MLX, llama.cpp, Local" },
      { title: "Routing Engine", href: "/docs/models/routing", description: "Policy-driven selection" },
      { title: "Provider Registry", href: "/docs/models/providers", description: "Lifecycle: discovered → active" },
      { title: "Hardware Awareness", href: "/docs/models/hardware", description: "Real-time capacity detection" },
    ],
  },
  {
    id: "evolution",
    label: "Evolution",
    icon: Zap,
    color: "darwin",
    pages: [
      { title: "Evolution Layers", href: "/docs/evolution/layers", description: "10 layers from prompts to architecture" },
      { title: "Candidate Generation", href: "/docs/evolution/generation", description: "Generators per layer" },
      { title: "Sandbox & Benchmark", href: "/docs/evolution/sandbox", description: "Isolation, resource limits, MindBench" },
      { title: "Reviews & Promotion", href: "/docs/evolution/promotion", description: "Security, privacy, cost, human approval" },
      { title: "Rollback & Monitoring", href: "/docs/evolution/rollback", description: "Instant rollback, canary deployment" },
    ],
  },
  {
    id: "genome",
    label: "Genome",
    icon: GitBranch,
    color: "seai",
    pages: [
      { title: "Genome Schema", href: "/docs/genome/schema", description: "Versioning, branching, lineage" },
      { title: "Diff & Compare", href: "/docs/genome/diff", description: "Visual genome comparison" },
      { title: "Rollback & Reproduce", href: "/docs/genome/rollback", description: "Instant rollback, reproduction" },
      { title: "Branching", href: "/docs/genome/branching", description: "Experiment branches" },
    ],
  },
  {
    id: "benchmark",
    label: "MindBench",
    icon: Terminal,
    color: "darwin",
    pages: [
      { title: "Benchmark Suite", href: "/docs/benchmark/suite", description: "Standard task suite" },
      { title: "Running Experiments", href: "/docs/benchmark/experiments", description: "Create, run, compare" },
      { title: "Metrics Reference", href: "/docs/benchmark/metrics", description: "20 metrics explained" },
      { title: "Reproducibility", href: "/docs/benchmark/reproducibility", description: "Seeds, configs, hardware fingerprints" },
    ],
  },
  {
    id: "security",
    label: "Security & Privacy",
    icon: Shield,
    color: "darwin",
    pages: [
      { title: "Threat Model", href: "/docs/security/threats", description: "Injection, exfiltration, escalation, poisoning" },
      { title: "Capability Permissions", href: "/docs/security/permissions", description: "Least privilege enforcement" },
      { title: "Privacy Gates", href: "/docs/security/privacy", description: "Classification, redaction, audit" },
      { title: "Audit Logging", href: "/docs/security/audit", description: "Decision records, provenance" },
    ],
  },
  {
    id: "sdk",
    label: "SDK & CLI",
    icon: Code,
    color: "seai",
    pages: [
      { title: "TypeScript SDK", href: "/docs/sdk/typescript", description: "High-level client API" },
      { title: "CLI Reference", href: "/docs/cli/reference", description: "All seai commands" },
      { title: "Plugin Development", href: "/docs/sdk/plugins", description: "Extend SE-AI" },
    ],
  },
];

export default function DocsPage() {
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
                Documentation
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-950 dark:text-white mb-4">
                Complete Documentation
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
                Guides, API references, and tutorials for every component of the SE-AI architecture.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="space-y-12">
                {docSections.map((section, sectionIndex) => (
                  <motion.section
                    key={section.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, delay: sectionIndex * 0.1 }}
                    className="relative"
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", section.color === "seai" ? "bg-seai-100 text-seai-600 dark:bg-seai-900/50 dark:text-seai-400" : "bg-darwin-100 text-darwin-600 dark:bg-darwin-900/50 dark:text-darwin-400")}>
                        <section.icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-950 dark:text-white">{section.label}</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {section.pages.map((page, pageIndex) => (
                        <motion.article
                          key={page.title}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-50px" }}
                          transition={{ duration: 0.4, delay: sectionIndex * 0.1 + pageIndex * 0.05 }}
                          className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-seai-300 dark:hover:border-seai-700 hover:shadow-lg transition-all duration-300"
                        >
                          <Link href={page.href} className="flex items-start gap-3 group">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors", section.color === "seai" ? "bg-seai-100 text-seai-600 dark:bg-seai-900/50 dark:text-seai-400 group-hover:bg-seai-600 group-hover:text-white" : "bg-darwin-100 text-darwin-600 dark:bg-darwin-900/50 dark:text-darwin-400 group-hover:bg-darwin-600 group-hover:text-white")}>
                              <FileText className="h-5 w-5" aria-hidden="true" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-slate-900 dark:text-white group-hover:text-seai-600 dark:group-hover:text-seai-400 transition-colors">
                                {page.title}
                              </h3>
                              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1 line-clamp-2">{page.description}</p>
                            </div>
                          </Link>
                        </motion.article>
                      ))}
                    </div>
                  </motion.section>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <CTASection
          title="Start Building Now"
          description="Install the CLI, run the doctor, and create your first Mind in minutes."
          primaryAction={{ label: "Get Started", href: "/docs/getting-started" }}
          secondaryActions={[
            { label: "View Darwin Spec", href: "/darwin", variant: "outline" },
            { label: "View Architecture", href: "/architecture", variant: "ghost" },
          ]}
        />
      </main>
      <Footer />
    </>
  );
}