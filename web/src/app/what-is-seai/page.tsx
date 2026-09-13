import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/ui/Page";

export const metadata: Metadata = {
  title: "What Is SE-AI?",
  description:
    "How SE-AI sits relative to LLMs, AI agents, personal AI, private AI, and evolving AI — and what 'a Mind' means that none of the others do.",
};

const categories = [
  {
    name: "LLM",
    what: "A single model call",
    has: ["Token prediction on a prompt", "Stateless — no memory of your session"],
    lacks: "No persistence, no skills, no tools, no identity, no evolution.",
  },
  {
    name: "AI Agent",
    what: "A loop around a model",
    has: ["Tools and multi-step loops", "Some session memory"],
    lacks: "Little durable identity, goals, or governed self-improvement.",
  },
  {
    name: "Personal AI",
    what: "A service optimised for you",
    has: ["User preferences", "Assistant-style chat"],
    lacks: "No open platform, no user ownership, no governed evolution.",
  },
  {
    name: "Private AI",
    what: "Run on your hardware",
    has: ["Local execution", "Data stays with you"],
    lacks: "Privacy is a property, not the whole system — a Mind adds persistence, capability, and evolution.",
  },
  {
    name: "Evolving AI",
    what: "Improves over time",
    has: ["Some form of self-improvement"],
    lacks: "Often unsupervised or unmeasured. SE-AI's evolution is gated, measured, and reversible.",
  },
  {
    name: "SE-AI Mind",
    what: "A persistent, governed system",
    has: [
      "Model + Memory + Skills + Tools",
      "Identity, Goals, Experience, Evaluation",
      "Gated, measurable self-evolution — with rollback",
    ],
    lacks: "Nothing it claims to be — claims are tied to code and data.",
  },
];

export default function WhatIsSeaiPage() {
  return (
    <>
      <Navigation />
      <main>
        <PageHeader
          eyebrow="Core Distinction"
          title="What Is SE-AI?"
          lede="The categories are real and distinct. SE-AI is the one position no other category occupies."
        />
        <div className="container-wide py-16 lg:py-20">
          <div className="max-w-3xl mx-auto space-y-10">
            <div className="prose-seai space-y-4 text-slate-600 dark:text-slate-400">
              <p className="text-lg leading-relaxed">
                An <strong className="text-slate-900 dark:text-white">LLM</strong> is a stateless function.{" "}
                <strong className="text-slate-900 dark:text-white">Agents</strong> wrap it in loops.{" "}
                <strong className="text-slate-900 dark:text-white">Personal and private assistants</strong> make it
                friendly or local.{" "}
                <strong className="text-slate-900 dark:text-white">SE-AI</strong> builds a <em>Mind</em>: a persistent
                system that remembers, uses skills and tools, has identity and goals, is measured by experience, and
                improves itself — but only through a gate that can tell signal from noise.
              </p>
              <p>
                The SE-AI definition, from{" "}
                <Link href="/docs/getting-started" className="underline-offset-4 hover:text-seai-600">
                  the North Star
                </Link>
                :
              </p>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-slate-900 dark:text-white">Category</th>
                    <th className="px-5 py-3 font-semibold text-slate-900 dark:text-white">What it is</th>
                    <th className="px-5 py-3 font-semibold text-slate-900 dark:text-white">What it has</th>
                    <th className="px-5 py-3 font-semibold text-slate-900 dark:text-white">What it lacks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {categories.map((c) => (
                    <tr key={c.name}>
                      <td className="px-5 py-4 align-top font-semibold text-seai-700 dark:text-seai-300">{c.name}</td>
                      <td className="px-5 py-4 align-top text-slate-600 dark:text-slate-400">{c.what}</td>
                      <td className="px-5 py-4 align-top text-slate-600 dark:text-slate-400">
                        <ul className="space-y-1">
                          {c.has.map((h) => (
                            <li key={h} className="flex gap-2">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-seai-400" aria-hidden="true" />
                              {h}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-5 py-4 align-top text-slate-600 dark:text-slate-400">{c.lacks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-3xl border border-darwin-300 bg-darwin-50 p-8 dark:border-darwin-800 dark:bg-darwin-900/20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">The core thesis</h2>
              <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
                Intelligence should be <strong>optimized, not merely scaled</strong>. A small model inside an
                experienced, evolving Mind should deliver more verified useful outcomes per compute than a large raw
                model. That is an empirical question, and the platform is built to measure it.
              </p>
              <Link
                href="/research/intelligence-efficiency"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-seai-600 hover:text-seai-700 dark:text-seai-400 dark:hover:text-seai-300"
              >
                The intelligence-efficiency research thread
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}