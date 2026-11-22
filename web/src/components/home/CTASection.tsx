"use client";

import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Github,
  BookOpen,
  Terminal,
  Brain,
  Zap,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { LinkButton } from "@/components/ui/Button";
import { site } from "@/lib/content";

interface CTASectionProps {
  title?: string;
  description?: string;
  primaryAction?: { label: string; href: string; icon?: LucideIcon };
  secondaryActions?: Array<{
    label: string;
    href: string;
    icon?: LucideIcon;
    variant?: "secondary" | "outline" | "ghost";
  }>;
  className?: string;
}

export function CTASection({
  title = "The next era of AI is built, governed, and shared.",
  description = "Build on a working kernel: persistent Mind state, provider-neutral runtimes, deterministic evaluation, and versioned changes you can inspect and reverse.",
  primaryAction = {
    label: "Explore the kernel",
    href: "/architecture",
    icon: ArrowRight,
  },
  secondaryActions = [
    { label: "View on GitHub", href: site.github, icon: Github, variant: "outline" },
    { label: "Read the Docs", href: "/docs", icon: BookOpen, variant: "ghost" },
    { label: "Run Benchmarks", href: "/benchmarks", icon: Terminal, variant: "ghost" },
  ],
  className,
}: CTASectionProps) {
  const principles = [
    { icon: Terminal, label: "Open-source", desc: "Inspect the seven-unit kernel" },
    { icon: Brain, label: "Human governed", desc: "Evaluation before promotion" },
    { icon: Zap, label: "Evidence led", desc: "Limits shown alongside results" },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={cn("py-20 sm:py-24 lg:py-32 relative overflow-hidden", className)}
    >
      <div className="closing-gradient absolute inset-0" aria-hidden="true" />
      <div className="closing-glow absolute inset-0" aria-hidden="true" />

      <div className="container-wide relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="eyebrow text-seai-200 mb-4">Build with SE-AI</p>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-white mb-6 text-balance">
            {title}
          </h2>
          <p className="text-lg md:text-xl text-seai-100 mb-9 max-w-3xl mx-auto leading-relaxed">
            {description}
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 mb-12">
            <LinkButton
              href={primaryAction.href}
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              {primaryAction.label}
              {primaryAction.icon && (
                <primaryAction.icon className="h-5 w-5" aria-hidden="true" />
              )}
            </LinkButton>
            {secondaryActions.map((action) => (
              <LinkButton
                key={action.label}
                href={action.href}
                target={action.href.startsWith("http") ? "_blank" : undefined}
                rel={action.href.startsWith("http") ? "noopener noreferrer" : undefined}
                size="lg"
                variant={action.variant || "outline"}
                className="w-full sm:w-auto text-white hover:text-white hover:bg-white/15 border-white/35"
              >
                {action.label}
                {action.icon && <action.icon className="h-5 w-5" aria-hidden="true" />}
                {action.href.startsWith("http") && (
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                )}
              </LinkButton>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {principles.map((item) => (
              <motion.div
                key={item.label}
                initial={false}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl border border-white/15 bg-white/10 text-left backdrop-blur-sm"
              >
                <div className="w-12 h-12 shrink-0 rounded-xl bg-white/20 flex items-center justify-center">
                  <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-white">{item.label}</div>
                  <div className="text-sm leading-5 text-seai-100">{item.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
