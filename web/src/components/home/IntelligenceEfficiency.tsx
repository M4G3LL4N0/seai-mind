"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, Scale, Target } from "lucide-react";
import { motion } from "framer-motion";
import { metricCategories } from "@/lib/content";

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
                <div className="flex-1 text-center p-6 bg-white/10 rounded-2xl">
                  <div className="text-4xl md:text-5xl font-bold mb-2">Verified Useful Outcome</div>
                  <div className="text-seai-100 text-sm uppercase tracking-wide">Numerator</div>
                </div>
                <div className="flex items-center text-4xl font-bold text-seai-200">/</div>
                <div className="flex-1 text-center p-6 bg-white/10 rounded-2xl">
                  <div className="text-3xl md:text-4xl font-bold mb-2">Compute + Latency + Cost + Memory + Energy</div>
                  <div className="text-seai-100 text-sm uppercase tracking-wide">Denominator</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 className="text-2xl md:text-3xl font-bold text-slate-950 dark:text-white text-center mb-4">
            MindBench Metric Categories
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-center max-w-2xl mx-auto mb-10">
            CURRENT VERIFIED SNAPSHOT — the metric families MindBench captures where available.
            Numbers shown only where measured; categories are filled in as suites are built out.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {metricCategories.map((metric, i) => (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.02 }}
                className={cn(
                  "p-4 rounded-2xl border",
                  metric.available
                    ? "border-green-200 bg-green-50/60 dark:border-green-800 dark:bg-green-900/10"
                    : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900",
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{metric.name}</span>
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
                      metric.available
                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                    )}
                  >
                    {metric.available ? "measured" : "available soon"}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{metric.note}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            {
              icon: TrendingUp,
              title: "Evidence-Based",
              description: "Every experiment labeled: PLANNED · SIMULATED · EXPERIMENTAL · MEASURED · VERIFIED · PRODUCTION. No fabricated numbers.",
            },
            {
              icon: Scale,
              title: "Hardware-Aware",
              description: "Benchmarks include full hardware profile: CPU, GPU, RAM, thermal, battery. Results tied to actual capacity.",
            },
            {
              icon: Target,
              title: "Reproducible by Design",
              description: "Fixed seeds, config snapshots, dependency hashes. Anyone can re-run and verify — that's what hash-signed records are for.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
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