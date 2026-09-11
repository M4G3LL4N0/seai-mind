"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, Zap, Brain, Target, BarChart3, ArrowUpRight, Scale, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

const metricComponents = [
  { label: "Task Success", unit: "%", higher: true },
  { label: "Accuracy", unit: "%", higher: true },
  { label: "Factuality", unit: "%", higher: true },
  { label: "Hallucination", unit: "%", higher: false },
  { label: "Latency", unit: "ms", higher: false },
  { label: "Tokens/sec", unit: "tok/s", higher: true },
  { label: "RAM Peak", unit: "GB", higher: false },
  { label: "CPU Avg", unit: "%", higher: false },
  { label: "GPU Util", unit: "%", higher: true },
  { label: "Model Load", unit: "s", higher: false },
  { label: "Compute", unit: "FLOPs", higher: false },
  { label: "Energy", unit: "Wh", higher: false },
  { label: "Cost", unit: "$", higher: false },
  { label: "Tool Calls", unit: "#", higher: false },
  { label: "Escalation", unit: "%", higher: false },
  { label: "Mem Retrieval", unit: "#", higher: true },
  { label: "Skill Reuse", unit: "#", higher: true },
  { label: "Adaptation", unit: "%", higher: true },
  { label: "Forgetting", unit: "%", higher: false },
  { label: "Regression", unit: "%", higher: false },
  { label: "Reliability", unit: "%", higher: true },
];

const efficiencyFormula = {
  numerator: "Verified Useful Outcome",
  denominator: [
    "Compute (FLOPs)",
    "Memory (GB)",
    "Latency (ms)",
    "Energy (Wh)",
    "Cost ($)",
  ],
};

export function IntelligenceEfficiency() {
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
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-seai-100 text-seai-700 dark:bg-seai-900/50 dark:text-seai-300 text-sm font-medium mb-4">
            Intelligence Efficiency
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-950 dark:text-white mb-4">
            Measuring What Matters
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Not benchmark scores. Real efficiency: verified useful outcomes per unit of resources consumed.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <div className="bg-gradient-to-r from-seai-600 via-darwin-500 to-seai-600 rounded-3xl p-8 md:p-12 text-white">
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="flex-1 text-center p-6 bg-white/10 rounded-2xl"
                >
                  <div className="text-4xl md:text-5xl font-bold mb-2">
                    {efficiencyFormula.numerator}
                  </div>
                  <div className="text-seai-100 text-sm uppercase tracking-wide">Numerator</div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="flex items-center text-4xl font-bold text-seai-200"
                >
                  /
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex-1 text-center p-6 bg-white/10 rounded-2xl"
                >
                  <div className="text-3xl md:text-4xl font-bold mb-2">∑</div>
                  <div className="text-seai-100 text-sm uppercase tracking-wide">Denominator</div>
                </motion.div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                {efficiencyFormula.denominator.map((term, i) => (
                  <motion.div
                    key={term}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.05 }}
                    className="flex items-center gap-2 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-seai-400" />
                    <span className="font-medium">{term}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h3 className="text-2xl md:text-3xl font-bold text-slate-950 dark:text-white text-center mb-4">
            MindBench Metrics (20 Dimensions)
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-center max-w-2xl mx-auto mb-10">
            Every benchmark run captures all 20 metrics. No cherry-picking. Full provenance recorded.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
            {metricComponents.map((metric, i) => (
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
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            {
              icon: TrendingUp,
              title: "Evidence-Based Comparison",
              description: "Every experiment labeled: PLANNED | SIMULATED | EXPERIMENTAL | MEASURED | VERIFIED | PRODUCTION. No fabricated numbers.",
            },
            {
              icon: Scale,
              title: "Hardware-Aware",
              description: "Benchmarks include full hardware profile: CPU, RAM, GPU, thermal, battery, load. Results tied to actual capacity.",
            },
            {
              icon: Target,
              title: "Reproducible by Design",
              description: "Fixed seeds, config snapshots, dependency hashes, hardware fingerprints. Anyone can re-run and verify.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
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