"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Brain, Zap, GitBranch, FlaskConical, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  variant?: "primary" | "secondary";
  delay?: number;
}

export function FeatureCard({ icon: Icon, title, description, href, variant = "primary", delay = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="group"
    >
      <div
        className={cn(
          "relative p-6 rounded-2xl border transition-all duration-300 flex h-full flex-col",
          variant === "primary"
            ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-seai-300 dark:hover:border-seai-700 hover:shadow-lg"
            : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-seai-500/10 to-darwin-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
        <div className="relative z-10">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300",
              variant === "primary"
                ? "bg-seai-100 text-seai-600 dark:bg-seai-900/50 dark:text-seai-400 group-hover:bg-seai-600 group-hover:text-white"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 group-hover:bg-seai-100 group-hover:text-seai-600",
            )}
          >
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-seai-600 dark:group-hover:text-seai-400 transition-colors">
            {title}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">{description}</p>
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-seai-600 hover:text-seai-700 dark:text-seai-400 dark:hover:text-seai-300 transition-colors"
          >
            Learn more
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

interface StatProps {
  value: string;
  label: string;
  description?: string;
  delay?: number;
}

export function Stat({ value, label, description, delay = 0 }: StatProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="text-center"
    >
      <div className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-seai-600 via-darwin-500 to-seai-600 bg-clip-text text-transparent mb-2">
        {value}
      </div>
      <div className="text-lg font-medium text-slate-900 dark:text-white mb-1">{label}</div>
      {description && (
        <div className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">{description}</div>
      )}
    </motion.div>
  );
}

const journey = [
  { title: "Model", desc: "a stateless call", arrow: "→", to: "Mind" },
  { title: "Mind", desc: "a persistent system", arrow: "→", to: "Experience" },
  { title: "Experience", desc: "measured outcomes", arrow: "→", to: "Evolution" },
  { title: "Evolution", desc: "governed improvements", arrow: "→", to: "Better Mind" },
];

export function Hero() {
  const stats = [
    { value: "7", label: "Kernel Build Units", description: "core · runtime · state · mind · sdk · cli · web" },
    { value: "105", label: "Tests Passing", description: "verified snapshot 2026-09-13" },
    { value: "2", label: "Live Evolution Experiments", description: "measured & hash-signed" },
    { value: "1", label: "Reference Mind", description: "PAIOS — Personal AI OS" },
  ];

  const features = [
    {
      icon: Brain,
      title: "Model ≠ Mind",
      description: "A Mind is a persistent system — model, memory, skills, tools, identity, goals, evaluation, evolution, governance. Not a stateless call.",
      href: "/what-is-seai",
    },
    {
      icon: Zap,
      title: "Optimized, Not Scaled",
      description: "Cheapest inference is no inference: memory, skills, and tools before a model call. Intelligence should be optimized, not merely scaled.",
      href: "/research/intelligence-efficiency",
    },
    {
      icon: GitBranch,
      title: "Governed Evolution",
      description: "Observe → hypothesize → candidate → evaluate → gate → promote → monitor → rollback. Nothing promotes on noise; everything is reversible.",
      href: "/evolution",
    },
    {
      icon: FlaskConical,
      title: "Measured, Not Claimed",
      description: "Deterministic criteria, raw per-task evidence, hash-signed records. Two live experiments so far — including a gate that refused to promote.",
      href: "/evolution/live",
    },
  ];

  return (
    <section className="relative overflow-hidden py-28 lg:py-40">
      <div className="absolute inset-0 bg-gradient-to-br from-seai-50/50 via-white to-darwin-50/50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-seai-100/50 via-transparent to-darwin-100/50 dark:from-seai-900/20 dark:via-transparent dark:to-darwin-900/20" />

      <div className="container-wide relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-seai-100 text-seai-700 dark:bg-seai-900/50 dark:text-seai-300 text-sm font-medium mb-6"
          >
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-seai-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-seai-500" />
            </span>
            SE-AI — Darwin 0.1
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-950 dark:text-white leading-tight mb-6"
          >
            SE-AI
            <span className="block mt-1 text-3xl md:text-4xl lg:text-5xl font-semibold bg-gradient-to-r from-seai-600 via-darwin-500 to-seai-600 bg-clip-text text-transparent">
              Self-Evolving Artificial Intelligence
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            An open platform for building persistent, specialized, measurable, governed, self-evolving AI Minds.
            A Mind is model + memory + skills + tools + identity + goals + experience + evaluation + evolution + governance.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="xl" asChild>
              <Link href="/docs/getting-started">
                Build a Mind
                <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="/architecture">Explore the Kernel</Link>
            </Button>
            <Button size="xl" variant="ghost" asChild>
              <Link href="/evolution/live">Watch a Mind Evolve</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400"
            aria-label="The path from model to mind"
          >
            {journey.map((step, i) => (
              <span key={step.title} className="flex items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium dark:border-slate-800 dark:bg-slate-900">
                  {step.title}
                </span>
                {i < journey.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-seai-500" aria-hidden="true" />
                )}
              </span>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
        >
          {stats.map((stat, i) => (
            <Stat key={stat.label} {...stat} delay={i * 0.1} />
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-12">
            Core Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} {...feature} delay={i * 0.1} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}