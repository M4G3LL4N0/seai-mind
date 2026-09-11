"use client";

import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { CTASection } from "@/components/home/CTASection";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Brain, Scale, Code, Search, FileText, Shield, Zap, ChevronRight, ExternalLink, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const minds = [
  {
    id: "paios",
    name: "PAIOS",
    description: "Personal AI Operating System — the first reference SE-AI Mind. A personal AI assistant that learns, evolves, and maintains privacy.",
    status: "reference",
    generation: "Darwin 0.1",
    capabilities: ["Persistent memory", "Skill learning", "Tool use", "Local-first", "Privacy-first"],
    specs: "Complete spec available",
  },
  {
    id: "legalone",
    name: "LegalOne",
    description: "Legal AI Mind for contract analysis, compliance checking, and legal research with citation tracking.",
    status: "planned",
    generation: "Future",
    capabilities: ["Contract analysis", "Compliance checking", "Legal research", "Citation tracking"],
    specs: "Planned for Woz generation",
  },
  {
    id: "trillionx",
    name: "TRILLIONX",
    description: "Economic intelligence Mind for market analysis, risk modeling, and financial forecasting.",
    status: "planned",
    generation: "Future",
    capabilities: ["Market analysis", "Risk modeling", "Forecasting", "Portfolio optimization"],
    specs: "Planned for Turing generation",
  },
  {
    id: "coding",
    name: "Coding Mind",
    description: "Specialized Mind for software development: code generation, review, refactoring, testing, and architecture.",
    status: "experimental",
    generation: "Darwin 0.2",
    capabilities: ["Code generation", "Code review", "Refactoring", "Testing", "Architecture design"],
    specs: "In development",
  },
  {
    id: "research",
    name: "Research Mind",
    description: "Autonomous research assistant for literature synthesis, hypothesis generation, and experiment design.",
    status: "planned",
    generation: "Future",
    capabilities: ["Literature synthesis", "Hypothesis generation", "Experiment design", "Paper writing"],
    specs: "Planned for Einstein generation",
  },
  {
    id: "personal",
    name: "Personal Mind",
    description: "Your personal AI that remembers everything, learns your preferences, and evolves with you.",
    status: "planned",
    generation: "Woz 0.2",
    capabilities: ["Life logging", "Preference learning", "Proactive assistance", "Cross-device sync"],
    specs: "Planned for Woz generation",
  },
  {
    id: "document",
    name: "Document Intelligence",
    description: "Document understanding, extraction, summarization, and knowledge graph construction.",
    status: "experimental",
    generation: "Darwin 0.2",
    capabilities: ["Extraction", "Summarization", "Classification", "Knowledge graphs"],
    specs: "In development",
  },
];

const statusConfig = {
  reference: { label: "Reference Implementation", variant: "success" as const, color: "green" },
  experimental: { label: "Experimental", variant: "info" as const, color: "blue" },
  planned: { label: "Planned", variant: "default" as const, color: "slate" },
};

export default function MindsPage() {
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
                Mind Gallery
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-950 dark:text-white mb-4">
                Minds Built on SE-AI
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
                Reference implementations, experimental Minds, and planned Minds demonstrating the SE-AI architecture.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {minds.map((mind, i) => (
                <motion.article
                  key={mind.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-seai-300 dark:hover:border-seai-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">{mind.name}</h2>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusConfig[mind.status as keyof typeof statusConfig].variant}>
                          {statusConfig[mind.status as keyof typeof statusConfig].label}
                        </Badge>
                        <span className="text-sm text-slate-500 dark:text-slate-400">Gen: {mind.generation}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">{mind.description}</p>
                  
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Capabilities</h3>
                    <div className="flex flex-wrap gap-2">
                      {mind.capabilities.map((cap, j) => (
                        <Badge key={j} variant="outline" size="sm">{cap}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Link
                      href={`/minds/${mind.id}`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-seai-600 hover:text-seai-700 dark:text-seai-400 dark:hover:text-seai-300"
                    >
                      View {mind.name} Details
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-16 p-8 rounded-3xl bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
            >
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Build Your Own Mind
                </h2>
                <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
                  SE-AI provides the infrastructure. You define the purpose, memory, skills, tools, and evolution policy.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button size="lg" asChild>
                    <Link href="/docs/getting-started">Create Your First Mind</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/docs/minds">Mind Specification Guide</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <CTASection
          title="Explore the First Reference Mind"
          description="PAIOS demonstrates the complete SE-AI architecture in a practical, deployable form."
          primaryAction={{ label: "View PAIOS Spec", href: "/minds/paios" }}
          secondaryActions={[
            { label: "View Architecture", href: "/architecture", variant: "outline" },
            { label: "Run Benchmarks", href: "/benchmarks", variant: "ghost" },
          ]}
        />
      </main>
      <Footer />
    </>
  );
}