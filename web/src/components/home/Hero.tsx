"use client";

import Link from "next/link";
import { ArrowRight, RotateCcw, ShieldCheck, Sparkles, Layers3, BrainCircuit, FlaskConical } from "lucide-react";

const cycle = [
  { label: "Experience", icon: Sparkles },
  { label: "Understand", icon: BrainCircuit },
  { label: "Question", icon: FlaskConical },
  { label: "Learn", icon: Layers3 },
];

const capabilities = [
  ["A working kernel", "Seven focused units connect cognition, memory, runtimes, tools, and evaluation."],
  ["Measured evolution", "Candidates are compared against evidence, with explicit hold and rollback paths."],
  ["Human-directed change", "People retain control over what is learned, tested, and promoted."],
];

export function Hero() {
  return (
    <section className="seai-hero relative overflow-hidden">
      <div className="seai-grid absolute inset-0" aria-hidden="true" />
      <div className="container-wide relative z-10 py-16 sm:py-24 lg:py-28">
        <div className="grid items-center gap-10 lg:grid-cols-[.88fr_1.12fr]">
          <div className="max-w-xl">
            <p className="eyebrow text-sky-200">Open intelligence · human governance</p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Self-Evolving AI, <span className="text-[#a9a5ff]">Built for Everyone.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-200 sm:text-xl">
              Persistent AI Minds turn compact models into systems that build knowledge, develop capabilities, and improve through measurable, human-governed evolution.
            </p>
            <div className="mt-7 flex flex-wrap gap-2" aria-label="SE-AI principles">
              {["Open-source", "Measurable", "Reversible"].map((item) => <span key={item} className="rounded-full border border-white/15 bg-white/[.08] px-3.5 py-1.5 text-sm text-white">{item}</span>)}
            </div>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link className="action-primary" href="/architecture">Explore the kernel <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              <Link className="action-glass" href="/evolution/live">See the experiment record</Link>
            </div>
          </div>

          <div className="spiral-panel">
            <div className="flex items-start justify-between gap-4">
              <div><p className="eyebrow text-sky-200">A compounding learning system</p><h2 className="mt-2 max-w-lg font-display text-2xl font-semibold text-white sm:text-3xl">Build. Learn. Understand. Improve.</h2></div>
              <span className="rounded-2xl border border-white/15 bg-white/[.08] p-3 text-sky-200"><RotateCcw className="h-5 w-5" aria-hidden="true" /></span>
            </div>
            <div className="spiral-stage" role="img" aria-label="Illustration of experience feeding understanding, questions, learning, and another build">
              <div className="spiral-orbit orbit-one" /><div className="spiral-orbit orbit-two" /><div className="spiral-orbit orbit-three" />
              <span className="spiral-node node-top">Question</span><span className="spiral-node node-right">Learn</span><span className="spiral-node node-bottom">Experience</span><span className="spiral-node node-left">Understand</span>
              <div className="spiral-core"><span>Build</span><strong>Again</strong></div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {capabilities.map(([title, desc]) => <article key={title} className="glass-card p-3"><h3 className="text-sm font-semibold text-white">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-300">{desc}</p></article>)}
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-400"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" aria-hidden="true" />Evolution is evaluated and governed; promotion remains explicit and reversible.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
