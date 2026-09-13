"use client";

import { ArrowRight, FlaskConical, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { experiments } from "@/lib/content";

export function LiveEvolutionPreview() {
  const [first, second] = experiments;
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
            Live Evolution
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-950 dark:text-white mb-4">
            Two Real Experiments, Measured End to End
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Not demos — recorded experiments with deterministic criteria, hash-signed evidence, and limitations stated
            out loud.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {[first, second].map((exp, i) => (
            <motion.div
              key={exp.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center gap-2 mb-6">
                <FlaskConical className="h-5 w-5 text-darwin-500" aria-hidden="true" />
                <span
                  className={
                    exp.gate === "eligible"
                      ? "rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                      : "rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  }
                >
                  Gate: {exp.gate}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-950 dark:text-white mb-1">{exp.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{exp.date} · {exp.model} · {exp.tasks} tasks × {exp.runsPerTask} run{exp.runsPerTask > 1 ? "s" : ""}/task</p>
              <div className="space-y-2 mb-6">
                {exp.arms.map((arm) => (
                  <div
                    key={arm.name}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-800"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-300">{arm.name}</span>
                    <span className="font-mono text-slate-900 dark:text-white">quality {arm.quality}</span>
                  </div>
                ))}
              </div>
              <p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{exp.summary}</p>
              <div className="flex items-start gap-2 mb-6 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {exp.gate === "eligible"
                    ? "An unseen probe fenced 3/3 under the promoted prompt — the improvement raised compliance, it did not guarantee it. Honesty included."
                    : "The gate refused to promote a noise-level gain at higher token cost. That refusal is the result."}
                </span>
              </div>
              <div className="mt-auto">
                <Link
                  href={`/benchmarks/${exp.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-seai-600 hover:text-seai-700 dark:text-seai-400 dark:hover:text-seai-300"
                >
                  Full results <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-14 text-center"
        >
          <Button size="lg" asChild>
            <Link href="/evolution/live">
              Watch a Mind Evolve
              <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}