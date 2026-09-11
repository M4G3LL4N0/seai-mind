"use client";

import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { CTASection } from "@/components/home/CTASection";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { FlaskConical, BookOpen, Target, Zap, Brain, GitBranch, ArrowRight, ExternalLink, CheckCircle, Clock, AlertTriangle, Database, Wrench, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const researchAreas = [
  {
    id: "self-evolving",
    title: "Self-Evolving Agents",
    description: "Agents that improve through governed experience without human intervention in the loop.",
    icon: Brain,
    status: "active",
    papers: ["Darwin Gödel Machine", "SakanaAI/ShinkaEvolve", "EvolveR"],
  },
  {
    id: "continual-learning",
    title: "Continual Learning",
    description: "Learning continuously without catastrophic forgetting, with memory consolidation and decay.",
    icon: BookOpen,
    status: "active",
    papers: ["MemSkill", "OpenSkill", "EvoMap"],
  },
  {
    id: "memory-evolution",
    title: "Memory Evolution",
    description: "How memory quality, retrieval, and consolidation change with experience and scale.",
    icon: Database,
    status: "hypothesis",
    papers: ["Memory consolidation research", "Forgetting curve analysis"],
  },
  {
    id: "skill-evolution",
    title: "Skill Evolution",
    description: "Emergent capabilities from skill composition, validation, and iterative improvement.",
    icon: Wrench,
    status: "hypothesis",
    papers: ["Skill self-play", "Program synthesis evolution"],
  },
  {
    id: "model-distillation",
    title: "Model Distillation",
    description: "Teacher-student distillation, LoRA/PEFT adapters, quantization-aware distillation.",
    icon: Zap,
    status: "active",
    papers: ["Knowledge distillation surveys", "QLoRA", "AdaLoRA"],
  },
  {
    id: "adaptive-routing",
    title: "Adaptive Routing",
    description: "Multi-armed bandit and policy learning for optimal model selection.",
    icon: ArrowRight,
    status: "hypothesis",
    papers: ["Contextual bandits", "Neural architecture search"],
  },
  {
    id: "test-time-adaptation",
    title: "Test-Time Adaptation",
    description: "Models that adapt at inference time without gradient updates.",
    icon: Target,
    status: "hypothesis",
    papers: ["TTA surveys", "Online adaptation"],
  },
  {
    id: "evolutionary-computation",
    title: "Evolutionary Computation for AI",
    description: "Genetic algorithms, neuroevolution, quality-diversity for neural architecture search.",
    icon: GitBranch,
    status: "active",
    papers: ["NEAT", "MAP-Elites", "Quality-Diversity"],
  },
];

const statusConfig = {
  active: { label: "Active Research", variant: "success" as const, icon: CheckCircle },
  hypothesis: { label: "Hypothesis", variant: "info" as const, icon: AlertTriangle },
  planned: { label: "Planned", variant: "default" as const, icon: Clock },
};

export default function ResearchPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen">
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
                Research
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-950 dark:text-white mb-4">
                Research Areas
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
                SE-AI draws from multiple research fields. We clearly distinguish between active research, hypotheses, and planned work.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {researchAreas.map((area, i) => (
                  <motion.article
                    key={area.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-seai-300 dark:hover:border-seai-700 transition-colors"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-seai-100 text-seai-600 dark:bg-seai-900/50 dark:text-seai-400 flex items-center justify-center flex-shrink-0">
                        <area.icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{area.title}</h2>
                          <Badge variant={statusConfig[area.status as keyof typeof statusConfig].variant}>
                            {statusConfig[area.status as keyof typeof statusConfig].label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">{area.description}</p>
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Related Work</h3>
                      <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                        {area.papers.map((paper, j) => (
                          <li key={j} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-seai-500" />
                            {paper}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                      <Link
                        href={`/research/${area.id}`}
                        className="inline-flex items-center gap-2 text-sm font-medium text-seai-600 hover:text-seai-700 dark:text-seai-400 dark:hover:text-seai-300"
                      >
                        Explore {area.title}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-28 lg:py-36 bg-slate-950 dark:bg-slate-950">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto text-center mb-16"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-darwin-100 text-darwin-700 dark:bg-darwin-900/50 dark:text-darwin-300 text-sm font-medium mb-4">
                Research Integrity
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                No Fabrication Policy
              </h2>
              <p className="text-lg text-slate-300 leading-relaxed">
                Every claim is labeled with its evidence level. We never present simulations as measurements.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
            >
              {[
                { label: "PLANNED", desc: "Designed, not yet implemented", color: "slate" },
                { label: "SIMULATED", desc: "Modeled, not measured on hardware", color: "amber" },
                { label: "EXPERIMENTAL", desc: "Run in test environment", color: "blue" },
                { label: "MEASURED", desc: "Run on target hardware", color: "seai" },
                { label: "VERIFIED", desc: "Independently reproduced", color: "green" },
                { label: "PRODUCTION", desc: "Running in production", color: "darwin" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                  className="p-6 rounded-2xl bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10"
                >
                  <span className={cn("px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide", item.color === "slate" ? "bg-slate-100 text-slate-700" : item.color === "amber" ? "bg-amber-100 text-amber-700" : item.color === "blue" ? "bg-blue-100 text-blue-700" : item.color === "seai" ? "bg-seai-100 text-seai-700" : item.color === "green" ? "bg-green-100 text-green-700" : "bg-darwin-100 text-darwin-700")}>
                    {item.label}
                  </span>
                  <p className="mt-3 text-slate-300">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <CTASection
          title="Dive Deeper into Research"
          description="Explore individual research areas, read related papers, and track experiment progress."
          primaryAction={{ label: "Browse Research Areas", href: "/research" }}
          secondaryActions={[
            { label: "Prior Art", href: "/research/prior-art", variant: "outline" },
            { label: "Darwin Experiments", href: "/darwin#experiments", variant: "ghost" },
          ]}
        />
      </main>
      <Footer />
    </>
  );
}