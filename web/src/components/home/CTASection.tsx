"use client";

import { cn } from "@/lib/utils";
import { ArrowRight, Github, BookOpen, Terminal, Brain, Zap, ExternalLink, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface CTASectionProps {
  title?: string;
  description?: string;
  primaryAction?: { label: string; href: string; icon?: LucideIcon };
  secondaryActions?: Array<{ label: string; href: string; icon?: LucideIcon; variant?: "secondary" | "outline" | "ghost" }>;
  className?: string;
}

export function CTASection({
  title = "Ready to Build Your First Mind?",
  description = "Clone the repository, run the doctor, and start evolving intelligence today.",
  primaryAction = { label: "Get Started", href: "/docs/getting-started", icon: ArrowRight },
  secondaryActions = [
    { label: "View on GitHub", href: "https://github.com/seai-mind", icon: Github, variant: "outline" },
    { label: "Read the Docs", href: "/docs", icon: BookOpen, variant: "ghost" },
    { label: "Run Benchmarks", href: "/benchmarks", icon: Terminal, variant: "ghost" },
  ],
  className,
}: CTASectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={cn("py-28 lg:py-36 relative overflow-hidden", className)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-seai-600 via-darwin-500 to-seai-600" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-seai-600/20 via-transparent to-darwin-500/20" />
      
      <div className="container-wide relative">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            {title}
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg md:text-xl text-seai-100 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            {description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Button size="xl" variant="secondary" asChild className="w-full sm:w-auto">
              <Link href={primaryAction.href}>
                {primaryAction.label}
                {primaryAction.icon && <primaryAction.icon className="h-5 w-5 ml-2" aria-hidden="true" />}
              </Link>
            </Button>
            {secondaryActions.map((action, i) => (
              <Button key={action.label} size="xl" variant={action.variant || "outline"} asChild className="w-full sm:w-auto">
                <Link
                  href={action.href}
                  target={action.href.startsWith("http") ? "_blank" : undefined}
                  rel={action.href.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  {action.label}
                  {action.icon && <action.icon className="h-5 w-5 ml-2" aria-hidden="true" />}
                  {action.href.startsWith("http") && <ExternalLink className="h-4 w-4 ml-1" aria-hidden="true" />}
                </Link>
              </Button>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            {[
              { icon: Terminal, label: "One Command", desc: "seai init → seai run" },
              { icon: Brain, label: "Local First", desc: "Runs on your hardware" },
              { icon: Zap, label: "Evolves", desc: "Improves through experience" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div>
                  <div className="font-medium text-white">{item.label}</div>
                  <div className="text-sm text-seai-200">{item.desc}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}