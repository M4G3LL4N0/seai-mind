"use client";

import { cn } from "@/lib/utils";
import { Brain, Shield, UserCheck, RotateCcw, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { lifecycle, gateChecks } from "@/lib/content";

export function EvolutionLoop() {
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
            Governed Evolution
          </span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-950 dark:text-white mb-4">
            A new engine for intelligence
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Experience becomes evidence. A candidate is compared against explicit criteria, then held, rejected, or
            made eligible for a separate human decision. Every measured change can be inspected and rolled back.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {lifecycle.map((step, i) => (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className={cn(
                "relative rounded-2xl border p-5",
                i % 2 === 0
                  ? "border-seai-200 bg-seai-50/60 dark:border-seai-800 dark:bg-seai-900/20"
                  : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
              )}
            >
              <span
                className={cn(
                  "mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide",
                  i % 2 === 0
                    ? "bg-seai-100 text-seai-700 dark:bg-seai-900/50 dark:text-seai-300"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-semibold text-slate-900 dark:text-white">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{step.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Evidence before eligibility</h3>
            <p className="mb-6 text-slate-600 dark:text-slate-400 leading-relaxed">
              The implemented gate evaluates recorded experiment evidence and returns eligible, hold, or reject. Eligibility
              is not automatic deployment; promotion remains an explicit action:
            </p>
            <div className="flex flex-wrap gap-2">
              {gateChecks.map((check) => (
                <span
                  key={check.name}
                  title={check.what}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                    check.severity === "reject"
                      ? "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-800"
                      : "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800",
                  )}
                >
                  {check.severity === "reject" ? <Shield className="h-3 w-3" aria-hidden="true" /> : <RotateCcw className="h-3 w-3" aria-hidden="true" />}
                  {check.name}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-950 p-8 text-white dark:bg-slate-950">
            <h3 className="text-xl font-bold mb-4">People retain the decision</h3>
            <p className="mb-6 text-slate-300 leading-relaxed">
              One recorded repeated-run experiment returned HOLD: its measured quality gain fell below the configured
              threshold and token use exceeded its budget. It demonstrates a refusal path, not broad proof of safety or performance.
            </p>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-seai-400" aria-hidden="true" /> No LLM judge — deterministic criteria
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-seai-400" aria-hidden="true" /> Safety, privacy & cost reviews required
              </li>
              <li className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-seai-400" aria-hidden="true" /> Promotion never automatic by default
              </li>
              <li className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-seai-400" aria-hidden="true" /> Full rollback with lineage intact
              </li>
            </ul>
            <Button variant="secondary" size="sm" asChild className="mt-6 w-full sm:w-auto">
              <Link href="/evolution">
                Read the evolution docs
                <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
