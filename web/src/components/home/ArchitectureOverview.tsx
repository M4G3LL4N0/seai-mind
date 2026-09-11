"use client";

import { cn } from "@/lib/utils";
import { Brain, Database, Wrench, Box, ArrowRightLeft, Shield, Zap, Network, Code, Settings, ChevronRight, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const layers = [
  {
    id: "foundation",
    label: "FOUNDATION",
    color: "slate",
    components: [
      { name: "Schemas (Zod)", icon: Code, href: "/docs/schemas" },
      { name: "Kernel", icon: Settings, href: "/docs/kernel" },
      { name: "Hardware Detection", icon: Brain, href: "/docs/hardware" },
      { name: "Telemetry", icon: Zap, href: "/docs/telemetry" },
      { name: "Security Engine", icon: Shield, href: "/docs/security" },
      { name: "Policy Engine", icon: Shield, href: "/docs/policy" },
      { name: "Storage Adapter", icon: Database, href: "/docs/storage" },
    ],
  },
  {
    id: "subsystems",
    label: "SUBSYSTEMS",
    color: "seai",
    components: [
      { name: "Memory Engine", icon: Database, href: "/docs/memory" },
      { name: "Skill Engine", icon: Wrench, href: "/docs/skills" },
      { name: "Tool Engine", icon: Box, href: "/docs/tools" },
      { name: "Routing Engine", icon: ArrowRightLeft, href: "/docs/routing" },
      { name: "Model Runtime", icon: Brain, href: "/docs/models" },
      { name: "Provider Registry", icon: Network, href: "/docs/providers" },
    ],
  },
  {
    id: "cognition",
    label: "COGNITION",
    color: "darwin",
    components: [
      { name: "Cognitive Engine", icon: Brain, href: "/docs/cognition" },
      { name: "Cognitive Compiler", icon: Zap, href: "/docs/compiler" },
      { name: "Evaluation Engine", icon: Brain, href: "/docs/evaluation" },
      { name: "Evolution Engine", icon: ArrowRightLeft, href: "/docs/evolution" },
      { name: "Genome Engine", icon: Code, href: "/docs/genome" },
      { name: "Benchmark Engine", icon: Brain, href: "/docs/benchmark" },
    ],
  },
  {
    id: "mind",
    label: "MIND RUNTIME",
    color: "seai",
    components: [
      { name: "Mind Runtime", icon: Brain, href: "/docs/mind" },
      { name: "SDK", icon: Code, href: "/docs/sdk" },
      { name: "CLI", icon: Code, href: "/docs/cli" },
    ],
  },
];

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
            Four-Layer Architecture
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Clean separation of concerns. Each layer builds on the one below. Swap any component without breaking the stack.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-16"
        >
          {layers.map((layer, layerIndex) => (
            <motion.div
              key={layer.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: layerIndex * 0.1 }}
              className="relative"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", layer.color === "slate" ? "bg-slate-100 dark:bg-slate-800" : layer.color === "seai" ? "bg-seai-100 dark:bg-seai-900/50" : "bg-darwin-100 dark:bg-darwin-900/50")}>
                  <ChevronRight className={cn("h-6 w-6", layer.color === "slate" ? "text-slate-600 dark:text-slate-400" : layer.color === "seai" ? "text-seai-600 dark:text-seai-400" : "text-darwin-600 dark:text-darwin-400")} aria-hidden="true" />
                </div>
                <div>
                  <span className={cn("px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide", layer.color === "slate" ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" : layer.color === "seai" ? "bg-seai-100 text-seai-700 dark:bg-seai-900/50 dark:text-seai-300" : "bg-darwin-100 text-darwin-700 dark:bg-darwin-900/50 dark:text-darwin-300")}>
                    {layer.label}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {layer.components.map((comp, compIndex) => (
                  <motion.div
                    key={comp.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.4, delay: layerIndex * 0.1 + compIndex * 0.05 }}
                    className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-seai-300 dark:hover:border-seai-700 hover:shadow-lg transition-all duration-300"
                  >
                    <Link href={comp.href} className="flex items-start gap-3 group">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors", layer.color === "slate" ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 group-hover:bg-seai-100 group-hover:text-seai-600" : layer.color === "seai" ? "bg-seai-100 text-seai-600 dark:bg-seai-900/50 dark:text-seai-400 group-hover:bg-seai-600 group-hover:text-white" : "bg-darwin-100 text-darwin-600 dark:bg-darwin-900/50 dark:text-darwin-400 group-hover:bg-darwin-600 group-hover:text-white")}>
                        <comp.icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 dark:text-white group-hover:text-seai-600 dark:group-hover:text-seai-400 transition-colors">
                          {comp.name}
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1 line-clamp-2">
                          Click to explore documentation and API reference
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-20 p-8 rounded-3xl bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
        >
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-white dark:text-white text-center mb-4">
              Extension Points
            </h3>
            <p className="text-slate-300 dark:text-slate-400 text-center mb-8 max-w-2xl mx-auto">
              Every layer is extensible. Implement interfaces, register components, compose without forking.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "Custom Runtimes", desc: "Implement InferenceRuntime interface", icon: Brain },
                { title: "Custom Skills", desc: "Register via SkillEngine.createSkill()", icon: Wrench },
                { title: "Custom Tools", desc: "Register capability in ToolEngine", icon: Box },
                { title: "Custom Policies", desc: "Add rules to PolicyEngine", icon: Shield },
                { title: "Custom Evaluators", desc: "Implement EvaluationCriteria", icon: Brain },
                { title: "Custom Generators", desc: "Register per EvolutionLayer", icon: ArrowRightLeft },
                { title: "Custom Benchmarks", desc: "Add tasks to BenchmarkEngine", icon: Zap },
                { title: "Custom Models", desc: "Register in Model Registry", icon: Code },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: 0.8 + i * 0.05 }}
                  className="p-5 rounded-2xl bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 hover:border-seai-500/50 hover:bg-white/10 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                    <item.icon className="h-5 w-5 text-white/80" aria-hidden="true" />
                  </div>
                  <h4 className="font-medium text-white mb-1">{item.title}</h4>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}