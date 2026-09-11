"use client";

import { cn } from "@/lib/utils";
import { FlaskConical, Target, CheckCircle, Clock, Brain, Zap, GitBranch, Code, ArrowRight, Database, Wrench, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const darwinCapabilities = [
  { name: "Evolution Infrastructure", icon: GitBranch, status: "complete", description: "Candidate generation, sandboxing, benchmarking, reviews, promotion, rollback" },
  { name: "Mind Runtime", icon: Brain, status: "complete", description: "Integrated system with task execution, memory, skills, tools, routing" },
  { name: "Cognitive Compiler", icon: Zap, status: "complete", description: "Goal → Task Graph with optimization and caching" },
  { name: "Memory Engine", icon: Database, status: "complete", description: "10 memory types with full lifecycle management" },
  { name: "Skill Engine", icon: Wrench, status: "complete", description: "Composition, validation, built-in templates" },
  { name: "Tool System", icon: Zap, status: "complete", description: "Capability-based with sandboxed execution" },
  { name: "Model Routing", icon: ArrowRight, status: "complete", description: "Policy-driven with privacy gates" },
  { name: "Genome Versioning", icon: Code, status: "complete", description: "Diff, branch, rollback, reproduce, lineage" },
  { name: "Benchmark Engine", icon: Target, status: "complete", description: "MindBench with 20 metrics and provenance" },
  { name: "Ollama Runtime", icon: FlaskConical, status: "in-progress", description: "Model discovery, loading, generation" },
  { name: "MLX Runtime", icon: Brain, status: "in-progress", description: "Apple Silicon optimized inference" },
  { name: "llama.cpp Runtime", icon: Zap, status: "in-progress", description: "GGUF models with quantization" },
  { name: "MicroMind Experiment 001", icon: FlaskConical, status: "planned", description: "A-K comparison: 0.8B variants vs 2B/4B raw" },
];

const nextSteps = [
  { label: "M0", title: "Foundation Stabilization", items: ["Fix TS strictness issues", "CI/CD with build order", "Pre-commit hooks"], status: "current" },
  { label: "M1", title: "Mind Runtime Hardening", items: ["E2E task execution", "Memory persistence", "Skill/tool composition"], status: "next" },
  { label: "M2", title: "Model/Provider Integration", items: ["Ollama integration", "MLX for Apple Silicon", "llama.cpp server", "Local model benchmarks"], status: "planned" },
  { label: "M3", title: "MicroMind Experiment 001", items: ["Run A-K comparison", "Publish results", "Analyze efficiency"], status: "planned" },
  { label: "M4", title: "First Evolution Demo", items: ["Identify weakness", "Generate candidates", "Sandbox + benchmark", "Human approval → promote"], status: "planned" },
];

function StatusBadge({ status }: { status: "complete" | "in-progress" | "planned" | "current" | "next" }) {
  const configs = {
    complete: { variant: "success" as const, label: "✓ Complete" },
    "in-progress": { variant: "info" as const, label: "⟳ In Progress" },
    planned: { variant: "default" as const, label: "○ Planned" },
    current: { variant: "darwin" as const, label: "● Current" },
    next: { variant: "warning" as const, label: "▶ Next" },
  };
  const config = configs[status];
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `var(--tw-bg-${config.variant})`, color: `var(--tw-text-${config.variant})` }}>{config.label}</span>;
}

export function DarwinSection() {
  return (
    <section id="darwin" className="py-28 lg:py-36 bg-slate-50 dark:bg-slate-950">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <FlaskConical className="h-10 w-10 text-darwin-500" aria-hidden="true" />
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-darwin-100 text-darwin-700 dark:bg-darwin-900/50 dark:text-darwin-300 text-sm font-medium">
              Generation 1
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-950 dark:text-white mb-4">
            Darwin 0.1
            <span className="text-seai-600 dark:text-seai-400"> — Evolution Infrastructure</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
            The first generation establishes evolution itself. Not a model that evolves — an infrastructure that enables any Mind to evolve.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-4 max-w-4xl mx-auto mb-16"
        >
          {darwinCapabilities.map((cap, i) => (
            <motion.div
              key={cap.name}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.03 }}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border transition-colors",
                cap.status === "complete" ? "border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-700" : 
                cap.status === "in-progress" ? "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700" :
                "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              )}
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", 
                cap.status === "complete" ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400" :
                cap.status === "in-progress" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400" :
                "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500"
              )}>
                <cap.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-slate-900 dark:text-white">{cap.name}</h4>
                  <StatusBadge status={cap.status as "complete" | "in-progress" | "planned"} />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{cap.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-16"
        >
          {nextSteps.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
              className={cn(
                "p-6 rounded-2xl border transition-colors",
                step.status === "current" ? "border-darwin-500 bg-darwin-50 dark:bg-darwin-900/50" :
                step.status === "next" ? "border-seai-300 bg-seai-50 dark:bg-seai-900/20" :
                "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              )}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={cn("px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide",
                  step.status === "current" ? "bg-darwin-100 text-darwin-700 dark:bg-darwin-900/50 dark:text-darwin-300" :
                  step.status === "next" ? "bg-seai-100 text-seai-700 dark:bg-seai-900/50 dark:text-seai-300" :
                  "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                )}>
                  {step.label}
                </span>
                {step.status === "current" && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-darwin-500 text-white">Active</span>}
                {step.status === "next" && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-seai-500 text-white">Next</span>}
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3">{step.title}</h4>
              <ul className="space-y-2">
                {step.items.map((item, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <Link
            href="/darwin"
            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-darwin-600 hover:bg-darwin-700 rounded-xl transition-colors"
          >
            Explore Darwin 0.1 in Detail
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}