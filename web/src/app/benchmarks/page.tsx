"use client";

import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { CTASection } from "@/components/home/CTASection";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { TrendingUp, Zap, Brain, Target, BarChart3, ArrowUpRight, Scale, ChevronRight, CheckCircle, Clock, AlertTriangle, FlaskConical, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const benchmarkMetrics = [
  { label: "Task Success", value: "—", unit: "%", higher: true },
  { label: "Accuracy", value: "—", unit: "%", higher: true },
  { label: "Factuality", value: "—", unit: "%", higher: true },
  { label: "Hallucination", value: "—", unit: "%", higher: false },
  { label: "Latency (p50)", value: "—", unit: "ms", higher: false },
  { label: "Latency (p95)", value: "—", unit: "ms", higher: false },
  { label: "Tokens/sec", value: "—", unit: "tok/s", higher: true },
  { label: "RAM Peak", value: "—", unit: "GB", higher: false },
  { label: "CPU Avg", value: "—", unit: "%", higher: false },
  { label: "GPU Util", value: "—", unit: "%", higher: true },
  { label: "Model Load", value: "—", unit: "s", higher: false },
  { label: "Compute", value: "—", unit: "FLOPs", higher: false },
  { label: "Energy", value: "—", unit: "Wh", higher: false },
  { label: "Cost", value: "—", unit: "$", higher: false },
  { label: "Tool Calls", value: "—", unit: "#", higher: false },
  { label: "Escalation", value: "—", unit: "%", higher: false },
  { label: "Mem Retrieval", value: "—", unit: "#", higher: true },
  { label: "Skill Reuse", value: "—", unit: "#", higher: true },
  { label: "Adaptation", value: "—", unit: "%", higher: true },
  { label: "Forgetting", value: "—", unit: "%", higher: false },
  { label: "Regression", value: "—", unit: "%", higher: false },
  { label: "Reliability", value: "—", unit: "%", higher: true },
];

const experiments = [
  {
    id: "micromind-001",
    name: "MicroMind Experiment 001",
    status: "planned",
    description: "Compare 0.8B variants (A-I) against raw 2B and 4B models",
    models: ["Qwen2.5-0.5B", "Qwen2.5-1.5B", "Phi-3-mini", "Llama-3.2-1B", "Llama-3.2-3B"],
    metrics: ["Task Success", "Accuracy", "Latency", "Cost", "Memory"],
    hardware: "Apple M2 (8GB RAM)",
    timeline: "Darwin 0.2",
  },
  {
    id: "evolution-demo",
    name: "First Evolution Demo",
    status: "planned",
    description: "Identify weakness → generate candidates → sandbox → benchmark → promote",
    models: ["Qwen2.5-0.5B + evolution"],
    metrics: ["Pre/Post evolution delta", "Regression check", "Cost delta"],
    hardware: "Apple M2 (8GB RAM)",
    timeline: "Darwin 0.2",
  },
];

const statusConfig = {
  planned: { label: "Planned", variant: "default" as const, color: "slate" },
  running: { label: "Running", variant: "info" as const, color: "blue" },
  completed: { label: "Completed", variant: "success" as const, color: "green" },
  failed: { label: "Failed", variant: "destructive" as const, color: "red" },
};

export default function BenchmarksPage() {
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
                MindBench
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-950 dark:text-white mb-4">
                Benchmark Infrastructure
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
                Reproducible experiments with full provenance. 20 metrics. Hardware profiles. Config snapshots. No cherry-picking.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
            >
              {experiments.map((exp, i) => (
                <motion.article
                  key={exp.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-seai-300 dark:hover:border-seai-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">{exp.name}</h2>
                      <Badge variant={statusConfig[exp.status as keyof typeof statusConfig].variant}>{statusConfig[exp.status as keyof typeof statusConfig].label}</Badge>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">{exp.description}</p>
                  
                  <div className="space-y-3 mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Models</h4>
                      <div className="flex flex-wrap gap-2">
                        {exp.models.map((model, j) => (
                          <Badge key={j} variant="outline" size="sm">{model}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Metrics</h4>
                      <div className="flex flex-wrap gap-2">
                        {exp.metrics.map((metric, j) => (
                          <Badge key={j} variant="outline" size="sm">{metric}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1"><FlaskConical className="h-4 w-4" /> {exp.hardware}</span>
                      <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {exp.timeline}</span>
                    </div>
                  </div>
                  
                  <Link
                    href={`/benchmarks/${exp.id}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-seai-600 hover:text-seai-700 dark:text-seai-400 dark:hover:text-seai-300 mt-4 block"
                  >
                    View Experiment Details
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </motion.article>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-slate-950 dark:text-white text-center mb-4">
                MindBench Metrics (20 Dimensions)
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-center max-w-2xl mx-auto mb-10">
                Every benchmark run captures all 20 metrics. No cherry-picking. Full provenance recorded.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
                {benchmarkMetrics.map((metric, i) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.4, delay: i * 0.02 }}
                    className={cn(
                      "p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700",
                      metric.higher ? "border-l-4 border-green-500" : "border-l-4 border-red-500"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{metric.label}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", metric.higher ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300")}>
                        {metric.higher ? "↑ Better" : "↓ Better"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-500">{metric.unit}</div>
                    <div className="mt-2 text-2xl font-mono font-bold text-slate-900 dark:text-white">{metric.value}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-20 p-8 rounded-3xl bg-gradient-to-r from-seai-600 via-darwin-500 to-seai-600 text-white"
            >
              <div className="max-w-3xl mx-auto text-center">
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Reproducibility by Design
                </h3>
                <p className="text-seai-100 text-lg mb-6 leading-relaxed">
                  Fixed seeds, config snapshots, dependency hashes, hardware fingerprints. Anyone can re-run and verify.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                  <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/20">
                    <CheckCircle className="h-4 w-4" />
                    Fixed Seeds
                  </span>
                  <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/20">
                    <CheckCircle className="h-4 w-4" />
                    Config Snapshots
                  </span>
                  <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/20">
                    <CheckCircle className="h-4 w-4" />
                    Dependency Hashes
                  </span>
                  <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/20">
                    <CheckCircle className="h-4 w-4" />
                    Hardware Fingerprints
                  </span>
                  <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/20">
                    <CheckCircle className="h-4 w-4" />
                    Full Provenance
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <CTASection
          title="Run Your Own Benchmarks"
          description="Clone the repo, run seai doctor, and start benchmarking your own Minds."
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