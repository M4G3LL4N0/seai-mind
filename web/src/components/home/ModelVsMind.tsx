"use client";

import { cn } from "@/lib/utils";
import { Check, X, Brain, Database, Wrench, Box, ArrowRightLeft, Shield, Zap, Network, Code, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface ComparisonRow {
  feature: string;
  model: boolean | "partial";
  mind: boolean;
  description: string;
}

const comparisons: ComparisonRow[] = [
  { feature: "Neural Substrate (Weights)", model: true, mind: true, description: "Base model providing raw inference capability" },
  { feature: "Persistent Memory", model: false, mind: true, description: "Working, episodic, semantic, procedural, identity, preference, temporal, relational memory" },
  { feature: "Skills Library", model: false, mind: true, description: "Composable, versioned procedural intelligence with validation" },
  { feature: "Tool System", model: false, mind: true, description: "Capability-based tools with sandboxing, permissions, and cost tracking" },
  { feature: "Knowledge Base", model: "partial", mind: true, description: "Structured, queryable knowledge with provenance" },
  { feature: "Model Routing", model: false, mind: true, description: "Policy-driven selection across model fleet with privacy gates" },
  { feature: "Evaluation Engine", model: false, mind: true, description: "Correctness, quality, safety evaluation suites with LLM judges" },
  { feature: "Evolution Engine", model: false, mind: true, description: "Candidate generation, sandboxing, regression testing, promotion" },
  { feature: "Genome/Versioning", model: false, mind: true, description: "Git for intelligence: diff, branch, rollback, reproduce" },
  { feature: "Hardware Awareness", model: false, mind: true, description: "Real-time CPU/GPU/RAM/thermal detection for model selection" },
  { feature: "Privacy Gates", model: false, mind: true, description: "Default deny for cross-privilege access, local-first execution" },
  { feature: "Benchmark Infrastructure", model: false, mind: true, description: "MindBench: reproducible experiments with full provenance" },
];

function FeatureIcon({ icon: Icon, enabled, className }: { icon: LucideIcon; enabled: boolean | "partial"; className?: string }) {
  if (enabled === "partial") {
    return (
      <span className={cn("relative inline-flex items-center justify-center", className)}>
        <Icon className="h-5 w-5 text-amber-500" aria-hidden="true" />
        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-amber-500 border-2 border-white dark:border-slate-950" />
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center justify-center", className)}>
      {enabled ? (
        <Icon className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
      ) : (
        <X className="h-5 w-5 text-red-500 dark:text-red-400" aria-hidden="true" />
      )}
    </span>
  );
}

export function ModelVsMind() {
  return (
    <section className="py-28 lg:py-36 bg-slate-50 dark:bg-slate-950">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-darwin-100 text-darwin-700 dark:bg-darwin-900/50 dark:text-darwin-300 text-sm font-medium mb-4">
            Core Distinction
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-950 dark:text-white mb-4">
            Model <span className="text-seai-600 dark:text-seai-400">≠</span> Mind
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            A model predicts. A Mind persists. The distinction is fundamental.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="overflow-x-auto"
        >
          <table className="w-full min-w-[800px] text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="w-64 px-4 py-3 font-semibold text-slate-900 dark:text-white">Capability</th>
                <th className="w-48 px-4 py-3 font-semibold text-slate-900 dark:text-white text-center">
                  <span className="flex items-center justify-center gap-2">
                    <Brain className="h-5 w-5 text-slate-500" aria-hidden="true" />
                    Raw Model
                  </span>
                </th>
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-center">
                  <span className="flex items-center justify-center gap-2">
                    <Brain className="h-5 w-5 text-seai-600 dark:text-seai-400" aria-hidden="true" />
                    SE-AI Mind
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {comparisons.map((row, i) => (
                <motion.tr
                  key={row.feature}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.03 }}
                  className={i % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50 dark:bg-slate-900"}
                >
                  <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">
                    {row.feature}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <FeatureIcon icon={Check} enabled={row.model} />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <FeatureIcon icon={Check} enabled={row.mind} />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            {
              icon: Database,
              title: "Memory as Intelligence",
              description: "10 memory types with lifecycle: capture → validate → score → consolidate → compress → index → retrieve → decay → archive",
            },
            {
              icon: Wrench,
              title: "Skills as Intelligence",
              description: "Composable, versioned procedures with inputs/outputs, prerequisites, tools, model requirements, and evaluators",
            },
            {
              icon: Shield,
              title: "Governance as Intelligence",
              description: "Privacy gates, policy engine, capability permissions, audit trails — all enforced before execution",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-seai-300 dark:hover:border-seai-700 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-seai-100 text-seai-600 dark:bg-seai-900/50 dark:text-seai-400 flex items-center justify-center mb-4">
                <item.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}