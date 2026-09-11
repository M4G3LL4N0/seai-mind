"use client";

import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { CTASection } from "@/components/home/CTASection";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Terminal, CheckCircle, ArrowRight, Brain, Zap, Shield, Code, ChevronRight, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const steps = [
  {
    number: 1,
    title: "Prerequisites",
    description: "Ensure you have the required tools installed.",
    commands: [
      { cmd: "node --version", desc: "Node.js 22+" },
      { cmd: "pnpm --version", desc: "pnpm 11+" },
      { cmd: "git --version", desc: "Git" },
      { cmd: "ollama --version", desc: "Ollama (optional, for local models)" },
    ],
  },
  {
    number: 2,
    title: "Clone & Install",
    description: "Clone the repository and install dependencies.",
    commands: [
      { cmd: "git clone https://github.com/seai-mind/seai-mind.git", desc: "Clone repository" },
      { cmd: "cd seai-mind", desc: "Enter directory" },
      { cmd: "pnpm install", desc: "Install all dependencies" },
    ],
  },
  {
    number: 3,
    title: "Build the Kernel",
    description: "Compile all TypeScript packages in dependency order.",
    commands: [
      { cmd: "pnpm build", desc: "Build all packages" },
      { cmd: "pnpm typecheck", desc: "Verify TypeScript compilation" },
      { cmd: "pnpm lint", desc: "Run ESLint" },
    ],
  },
  {
    number: 4,
    title: "System Doctor",
    description: "Verify your hardware and software environment.",
    commands: [
      { cmd: "pnpm --filter @seai/cli doctor", desc: "Run system diagnostics" },
    ],
    output: `Hardware Profile:
  CPU: Apple M2 (8 cores, 8 threads)
  RAM: 8.0 GB (Unified)
  GPU: Apple M2 (8 cores, Metal 4)
  Storage: 256 GB (APFS)
  OS: macOS 15.6 (Darwin 25.6.0)

Dependencies:
  ✓ Node.js 22.5.0
  ✓ pnpm 11.17.0
  ✓ Git 2.55.0
  ✓ Ollama 0.1.47
  ✓ Python 3.14.6`,
  },
  {
    number: 5,
    title: "Initialize Your First Mind",
    description: "Create a new Mind with the Darwin template.",
    commands: [
      { cmd: "pnpm --filter @seai/cli init --name MyMind --generation Darwin --codename \"Darwin 0.1\"", desc: "Create Mind" },
      { cmd: "pnpm --filter @seai/cli mind run \"Hello, SE-AI!\"", desc: "Run a task" },
    ],
  },
  {
    number: 6,
    title: "Next Steps",
    description: "Explore the capabilities of your new Mind.",
    commands: [
      { cmd: "pnpm --filter @seai/cli goal \"Build a REST API in Python\"", desc: "Compile and execute a goal" },
      { cmd: "pnpm --filter @seai/cli evolve \"code generation accuracy\"", desc: "Trigger evolution" },
      { cmd: "pnpm --filter @seai/cli benchmark", desc: "Run benchmarks" },
      { cmd: "pnpm --filter @seai/cli status", desc: "Check Mind status" },
    ],
  },
];

export default function GettingStartedPage() {
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
                Getting Started
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-950 dark:text-white mb-4">
                Build Your First Mind in Minutes
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
                From zero to a running SE-AI Mind with memory, skills, tools, and evolution.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-12 max-w-4xl mx-auto"
            >
              {steps.map((step, i) => (
                <motion.section
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="relative"
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-seai-100 text-seai-600 dark:bg-seai-900/50 dark:text-seai-400")}>
                      <span className="text-xl font-bold">{step.number}</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">{step.title}</h2>
                      <p className="text-slate-600 dark:text-slate-400 mt-1">{step.description}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {step.commands.map((cmd, j) => (
                      <motion.div
                        key={cmd.cmd}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.4, delay: j * 0.05 }}
                        className="relative group"
                      >
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                          <Terminal className="h-5 w-5 text-slate-400 flex-shrink-0" aria-hidden="true" />
                          <code className="flex-1 text-sm text-slate-100 dark:text-slate-200 font-mono">{cmd.cmd}</code>
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded text-slate-400 hover:text-white"
                            onClick={() => navigator.clipboard.writeText(cmd.cmd)}
                            aria-label="Copy command"
                          >
                            <span className="text-xs">Copy</span>
                          </button>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 ml-9">{cmd.desc}</p>
                      </motion.div>
                    ))}
                  </div>

                  {step.output && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4 }}
                      className="mt-6 p-4 rounded-xl bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    >
                      <pre className="text-sm text-slate-100 dark:text-slate-200 font-mono overflow-x-auto whitespace-pre-wrap">{step.output}</pre>
                    </motion.div>
                  )}
                </motion.section>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-seai-600 via-darwin-500 to-seai-600 text-white"
            >
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  You're Ready to Evolve
                </h2>
                <p className="text-seai-100 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
                  Your first Mind is running. Now explore memory, skills, tools, and watch it evolve.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button size="lg" variant="secondary" asChild>
                    <Link href="/docs/minds/custom">Build a Custom Mind</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/docs/concepts/evolution">Learn About Evolution</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <CTASection
          title="Troubleshooting?"
          description="Run the doctor for detailed diagnostics, or check the FAQ."
          primaryAction={{ label: "Run Doctor", href: "/docs/doctor" }}
          secondaryActions={[
            { label: "View FAQ", href: "/docs/faq", variant: "outline" },
            { label: "GitHub Issues", href: "https://github.com/seai-mind/seai-mind/issues", variant: "ghost" },
          ]}
        />
      </main>
      <Footer />
    </>
  );
}