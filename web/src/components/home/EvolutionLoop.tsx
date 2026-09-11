"use client";

import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle, AlertCircle, Clock, Microscope, Shield, DollarSign, UserCheck, RotateCcw, Brain, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

const evolutionSteps = [
  {
    id: "observe",
    label: "OBSERVE",
    description: "Monitor task success, latency, cost, accuracy, hallucination rate, memory retrieval, skill reuse",
    icon: Brain,
    color: "seai",
    details: ["Task success rate tracking", "Latency & cost monitoring", "Accuracy & factuality metrics", "Memory & skill utilization"],
  },
  {
    id: "identify",
    label: "IDENTIFY WEAKNESS",
    description: "Detect regressions, capability gaps, quality drops, cost overruns, privacy risks",
    icon: AlertCircle,
    color: "darwin",
    details: ["Regression detection", "Capability gap analysis", "Quality threshold breaches", "Cost anomaly detection"],
  },
  {
    id: "generate",
    label: "GENERATE CANDIDATES",
    description: "Propose changes across 10 evolution layers: prompts, routing, memory, skills, knowledge, models, adapters, architecture",
    icon: RotateCcw,
    color: "seai",
    details: ["Prompt optimization", "Routing rule updates", "Memory config changes", "Skill creation/composition", "Model selection policies", "Adapter/LoRA training", "Architecture modifications"],
  },
  {
    id: "sandbox",
    label: "SANDBOX",
    description: "Isolated execution environment with resource limits, no network access, frozen dependencies",
    icon: Shield,
    color: "darwin",
    details: ["Process/container/VM isolation", "CPU/memory/disk limits", "Network disabled", "Frozen dependency graph", "Deterministic execution"],
  },
  {
    id: "benchmark",
    label: "BENCHMARK",
    description: "Run MindBench suite: warmup → measurement → cooldown. Compare against baseline genome.",
    icon: Microscope,
    color: "seai",
    details: ["Warmup runs (2)", "Measurement runs (10)", "Cooldown periods", "Statistical significance", "Hardware profiling"],
  },
  {
    id: "regression",
    label: "REGRESSION TEST",
    description: "Verify no capability loss on previous task suites. Automated pass/fail with thresholds.",
    icon: CheckCircle,
    color: "darwin",
    details: ["Full task suite re-run", "Capability preservation check", "Performance delta analysis", "Automated pass/fail"],
  },
  {
    id: "security",
    label: "SECURITY REVIEW",
    description: "Capability permissions, threat signatures, sandbox escape attempts, privilege escalation checks",
    icon: Shield,
    color: "seai",
    details: ["Permission analysis", "Threat signature scan", "Sandbox integrity check", "Escalation attempt detection"],
  },
  {
    id: "privacy",
    label: "PRIVACY REVIEW",
    description: "Data classification, cross-privilege access, external routing, redaction compliance",
    icon: UserCheck,
    color: "darwin",
    details: ["Data flow analysis", "Privacy gate verification", "External routing audit", "Redaction validation"],
  },
  {
    id: "cost",
    label: "COST REVIEW",
    description: "Compute, latency, token, energy delta. Must be within budget or justified by quality gain.",
    icon: DollarSign,
    color: "darwin",
    details: ["Compute cost delta", "Latency impact", "Token usage change", "Energy estimation", "Budget compliance"],
  },
  {
    id: "compare",
    label: "COMPARE",
    description: "Statistical comparison: candidate vs baseline across all metrics. Minimum 5% improvement threshold.",
    icon: Microscope,
    color: "seai",
    details: ["Multi-metric comparison", "Statistical significance", "5% minimum improvement", "Pareto frontier analysis"],
  },
  {
    id: "promote",
    label: "PROMOTE",
    description: "Human approval required. New genome created with lineage. Old genome preserved for rollback.",
    icon: CheckCircle,
    color: "darwin",
    details: ["Human-in-the-loop approval", "Genome versioning", "Lineage tracking", "Instant rollback capability"],
  },
  {
    id: "monitor",
    label: "MONITOR & ROLLBACK",
    description: "Post-promotion monitoring. Auto-rollback on regression. Continuous evaluation.",
    icon: RotateCcw,
    color: "seai",
    details: ["Real-time metric tracking", "Automated rollback triggers", "Canary deployment", "Continuous evaluation"],
  },
];

export function EvolutionLoop() {
  const colors = {
    seai: "bg-seai-500",
    darwin: "bg-darwin-500",
  };

  return (
    <section className="py-28 lg:py-36 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900" />
      
      <div className="container-wide relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-darwin-100 text-darwin-700 dark:bg-darwin-900/50 dark:text-darwin-300 text-sm font-medium mb-4">
            Evolution Engine
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-950 dark:text-white mb-4">
            Governed Evolution Loop
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Every improvement passes through 12 gates. No autonomous self-modification. Human approval required for promotion.
          </p>
        </motion.div>

        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-seai-500 via-darwin-500 to-seai-500 -translate-x-1/2" />
          
          <div className="space-y-8">
            {evolutionSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className={cn("relative flex items-start gap-6", index % 2 === 0 ? "md:pr-20 md:text-right" : "md:pl-20")}
              >
                <div className={cn("relative flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center z-10", colors[step.color as keyof typeof colors])}>
                  <step.icon className="h-8 w-8 text-white" aria-hidden="true" />
                </div>
                
                <div className={cn("flex-1 pt-2", index % 2 === 0 ? "md:pr-8" : "md:pl-8")}>
                  <div className={cn("p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-seai-300 dark:hover:border-seai-700 transition-colors", index % 2 === 0 ? "md:ml-8" : "md:mr-8")}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className={cn("px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide", colors[step.color as keyof typeof colors], "text-white")}>
                        {step.label}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">{step.description}</p>
                    <details className="group">
                      <summary className="flex items-center gap-2 text-sm font-medium text-seai-600 dark:text-seai-400 cursor-pointer hover:text-seai-700 dark:hover:text-seai-300">
                        Details
                        <ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90" aria-hidden="true" />
                      </summary>
                      <ul className="mt-3 space-y-2 pl-4 list-disc text-sm text-slate-600 dark:text-slate-400">
                        {step.details.map((detail, i) => (
                          <li key={i}>{detail}</li>
                        ))}
                      </ul>
                    </details>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-20 p-8 rounded-3xl bg-gradient-to-r from-seai-600 via-darwin-500 to-seai-600 text-white"
        >
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Safety First, Evolution Second
            </h3>
            <p className="text-seai-100 text-lg mb-6 leading-relaxed">
              No candidate reaches production without passing all 12 gates. Every promotion creates a new genome with full lineage. Instant rollback is always one click away.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/20">
                <Shield className="h-4 w-4" aria-hidden="true" />
                Security Review Required
              </span>
              <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/20">
                <UserCheck className="h-4 w-4" aria-hidden="true" />
                Privacy Review Required
              </span>
              <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/20">
                <DollarSign className="h-4 w-4" aria-hidden="true" />
                Cost Review Required
              </span>
              <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/20">
                <UserCheck className="h-4 w-4" aria-hidden="true" />
                Human Approval Required
              </span>
              <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/20">
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Instant Rollback
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}