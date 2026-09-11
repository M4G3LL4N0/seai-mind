"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Brain, Zap, GitBranch, ExternalLink, type LucideIcon } from "lucide-react";
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
          "relative p-6 rounded-2xl border transition-all duration-300",
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

export function Hero() {
  const stats = [
    { value: "27", label: "Core Packages", description: "Modular architecture" },
    { value: "4", label: "Runtime Adapters", description: "Ollama, MLX, llama.cpp, Local" },
    { value: "10", label: "Evolution Layers", description: "From prompts to architecture" },
    { value: "0.1", label: "Darwin Version", description: "First generation" },
  ];

  const features = [
    {
      icon: Brain,
      title: "Model ≠ Mind",
      description: "A Mind combines model, memory, skills, tools, routing, evaluation, and evolution into a persistent system.",
      href: "/architecture#model-vs-mind",
    },
    {
      icon: Zap,
      title: "Cheapest Inference is No Inference",
      description: "Cognitive compiler checks cache, memory, skills, and tools before calling a model.",
      href: "/architecture#cognitive-compiler",
    },
    {
      icon: GitBranch,
      title: "Evolution with Guardrails",
      description: "Sandbox → Benchmark → Security/Privacy/Cost Review → Human Approval → Promote/Rollback.",
      href: "/architecture#evolution-engine",
    },
    {
      icon: Brain,
      title: "Intelligence Efficiency",
      description: "Metric: Verified Useful Outcome / (Compute + Memory + Latency + Energy + Cost)",
      href: "/research#intelligence-efficiency",
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
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-seai-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-seai-500" />
            </span>
            SE-AI Mind — Darwin 0.1
          </motion.span>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-950 dark:text-white leading-tight mb-6"
          >
            Build an AI that becomes{" "}
            <span className="bg-gradient-to-r from-seai-600 via-darwin-500 to-seai-600 bg-clip-text text-transparent">
              better at being yours
            </span>
            .
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Open infrastructure for building persistent AI Minds that improve through governed experience. 
            Intelligence should be optimized, not merely scaled.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="xl" asChild>
              <Link href="/command">Open Command Center</Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="/docs/getting-started">Get Started</Link>
            </Button>
            <Button size="xl" variant="ghost" asChild>
              <Link href="https://github.com/seai-mind" target="_blank" rel="noopener noreferrer">
                View on GitHub <ExternalLink className="h-4 w-4 ml-1" aria-hidden="true" />
              </Link>
            </Button>
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