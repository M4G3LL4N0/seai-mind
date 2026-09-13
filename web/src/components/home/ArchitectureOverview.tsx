"use client";

import { cn } from "@/lib/utils";
import { ArrowDown, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { architectureModules, dependencyChain } from "@/lib/content";

const palette: Record<string, { chip: string; base: string }> = {
  core: {
    chip: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    base: "border-slate-300 dark:border-slate-700",
  },
  runtime: {
    chip: "bg-seai-100 text-seai-700 dark:bg-seai-900/50 dark:text-seai-300",
    base: "border-seai-300 dark:border-seai-800",
  },
  state: {
    chip: "bg-seai-100 text-seai-700 dark:bg-seai-900/50 dark:text-seai-300",
    base: "border-seai-300 dark:border-seai-800",
  },
  mind: {
    chip: "bg-darwin-100 text-darwin-700 dark:bg-darwin-900/50 dark:text-darwin-300",
    base: "border-darwin-300 dark:border-darwin-800",
  },
  sdk: {
    chip: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    base: "border-slate-300 dark:border-slate-700",
  },
  cli: {
    chip: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    base: "border-slate-300 dark:border-slate-700",
  },
  web: {
    chip: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    base: "border-slate-300 dark:border-slate-700",
  },
};

const docsFor: Record<string, string> = {
  core: "/docs/architecture",
  runtime: "/docs/runtime",
  state: "/docs/memory",
  mind: "/docs/minds",
  sdk: "/docs/sdk",
  cli: "/docs/cli",
  web: "/docs/architecture",
};

export function ArchitectureOverview() {
  return (
    <section className="py-28 lg:py-36 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950" />

      <div className="container-wide relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-seai-100 text-seai-700 dark:bg-seai-900/50 dark:text-seai-300 text-sm font-medium mb-4">
            System Architecture
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-950 dark:text-white mb-4">
            Seven Build Units, One Dependency Direction
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            core ← runtime · state ← mind ← sdk ← cli. The web site is standalone. Each unit is replaceable without
            breaking the stack.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col items-center"
        >
          {dependencyChain.map((slug, i) => {
            const mod = architectureModules.find((m) => m.slug === slug)!;
            const style = palette[slug];
            return (
              <div key={slug} className="flex flex-col items-center w-full">
                <div
                  className={cn(
                    "w-full max-w-3xl rounded-2xl border-2 bg-white p-5 dark:bg-slate-900",
                    style.base,
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <code className={cn("rounded-lg px-2.5 py-1 text-sm font-bold", style.chip)}>{mod.name}</code>
                      <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {mod.layer}
                      </span>
                    </div>
                    <Link
                      href={docsFor[slug]}
                      className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-seai-600 hover:text-seai-700 dark:text-seai-400 dark:hover:text-seai-300"
                    >
                      Docs <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{mod.role}</p>
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                    {mod.responsibilities.slice(0, 4).map((r) => (
                      <li key={r} className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
                        <span className="h-1 w-1 rounded-full bg-seai-400" aria-hidden="true" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
                {i < dependencyChain.length - 1 && (
                  <div className="flex justify-center py-1" aria-hidden="true">
                    <ArrowDown className="h-5 w-5 text-slate-300 dark:text-slate-700" />
                  </div>
                )}
              </div>
            );
          })}
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900">
            <code className="rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">web</code>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">standalone — documents, never links the kernel</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            { title: "Provider Neutral", desc: "The kernel talks to a contract, not a vendor. Adapters are optional and plug in behind the runtime." },
            { title: "Memory Isolated", desc: "Every memory entry is scoped by a required mindId. Minds cannot read each other — by construction." },
            { title: "Honest Cognition", desc: "Deterministic → skill → tool → model. When nothing can handle a task, it fails honestly instead of faking." },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
            >
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}