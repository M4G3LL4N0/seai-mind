import type { Metadata } from "next";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { PageHeader, CardLink } from "@/components/ui/Page";
import { experiments, snapshot } from "@/lib/content";

export const metadata: Metadata = {
  title: "Live Evolution",
  description:
    "The real model-backed evolution experiments: deterministic criteria, hash-signed evidence, honest limitations — including a gate that refused to promote noise.",
};

export default function LiveEvolutionPage() {
  return (
    <>
      <Navigation />
      <main>
        <PageHeader
          eyebrow="Live Evolution"
          title="Real Experiments, Measured End to End"
          lede="No demos, no fabricated numbers. Each experiment records deterministic criteria, per-task evidence, and its own limitations along with its results."
          snapshot
        />
        <div className="container-wide py-16 lg:py-20">
          <div className="max-w-5xl mx-auto space-y-16">
            <section>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {snapshot.stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-4xl font-bold bg-gradient-to-r from-seai-600 to-darwin-500 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{stat.label}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{stat.detail}</div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{snapshot.label} — {snapshot.verifiedAt}. Everything below is a point-in-time record, not live telemetry. Evidence records live in the repository experiment store; the hashes are auditable with `seai evolve verify`.</p>
            </section>

            {experiments.map((exp) => (
              <section key={exp.slug} className="scroll-mt-24">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span
                      key={exp.slug}
                      className={
                        exp.gate === "eligible"
                          ? "rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : "rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                      }
                    >
                      Gate: {exp.gate}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {exp.id}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {exp.date} · {exp.model} · {exp.tasks} tasks × {exp.runsPerTask} run{exp.runsPerTask > 1 ? "s" : ""}/task
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-950 dark:text-white mb-2">{exp.title}</h2>
                  <p className="mb-6 leading-relaxed text-slate-600 dark:text-slate-400">{exp.summary}</p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900">
                          <tr>
                            <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Arm</th>
                            <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-right">Success</th>
                            <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-right">Quality</th>
                            <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-right">Latency</th>
                            <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-right">Tokens</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {exp.arms.map((arm) => (
                            <tr key={arm.name}>
                              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{arm.name}</td>
                              <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{arm.success}</td>
                              <td className="px-4 py-3 text-right font-mono text-slate-900 dark:text-white">{arm.quality}</td>
                              <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-400">{arm.latency}</td>
                              <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-400">{arm.tokens}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="space-y-4">
                      <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-950">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Gate detail</h3>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{exp.gateDetail}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-950">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Evidence</h3>
                        <dl className="space-y-1.5">
                          {exp.evidence.map((item) => (
                            <div key={item.label} className="flex justify-between gap-4 text-sm">
                              <dt className="text-slate-500 dark:text-slate-400">{item.label}</dt>
                              <dd className="font-mono text-slate-900 dark:text-white text-right">{item.value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {exp.notes.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Notes</h3>
                        <ul className="space-y-2">
                          {exp.notes.map((note) => (
                            <li key={note} className="flex gap-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-seai-500" aria-hidden="true" />
                              {note}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {exp.limitations.length > 0 && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-900/20">
                        <h3 className="mb-2 text-sm font-semibold text-amber-900 dark:text-amber-200">Limitations — stated out loud</h3>
                        <ul className="space-y-2">
                          {exp.limitations.map((lim) => (
                            <li key={lim} className="flex gap-3 text-sm leading-relaxed text-amber-800 dark:text-amber-200">
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
                              {lim}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ))}

            <section>
              <div className="grid sm:grid-cols-2 gap-4">
                <CardLink href="/benchmarks/model-evolution" title="Model Evolution experiment page" description="Full benchmark record for the first experiment." />
                <CardLink href="/benchmarks/trustworthy-evolution" title="Trustworthy Evolution experiment page" description="Full benchmark record with repeat-runs and hashes." />
                <CardLink href="/research" title="Research area" description="The hypotheses these experiments test." />
                <CardLink href="/evolution" title="How the gate works" description="The decision table and its checks." />
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}