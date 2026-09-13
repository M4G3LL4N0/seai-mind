import type { Metadata } from "next";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { PageHeader, CardLink } from "@/components/ui/Page";
import { ProseSection } from "@/components/ui/ProseSection";
import { lifecycle, gateChecks, thresholdTable } from "@/lib/content";

export const metadata: Metadata = {
  title: "Evolution",
  description:
    "How a Mind improves itself: the implemented lifecycle (OBSERVE → … → ROLLBACK), the gate decision table, the checks that implement it, and configured thresholds.",
};

export default function EvolutionPage() {
  return (
    <>
      <Navigation />
      <main>
        <PageHeader
          eyebrow="Governed Evolution"
          title="The Evolution Lifecycle"
          lede="Experience becomes evidence, evidence becomes a candidate, and a candidate ships only when the gate can tell signal from noise. Every step is measured and reversible."
        />
        <div className="container-wide py-16 lg:py-20">
          <div className="max-w-5xl mx-auto space-y-16">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">The loop, as implemented</h2>
              <ol className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {lifecycle.map((step, i) => (
                  <li key={step.key} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-seai-50 px-2.5 py-0.5 text-[11px] font-bold text-seai-700 dark:bg-seai-900/40 dark:text-seai-300">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{step.description}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">The gate is a decision table</h2>
              <p className="mb-6 max-w-3xl leading-relaxed text-slate-600 dark:text-slate-400">
                Every candidate passes explicit checks. The checks return a decision and a human-readable reason:
                eligible (may promote), hold (inconclusive — keep observing), or reject (must not promote).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {gateChecks.map((check) => (
                  <div
                    key={check.name}
                    className={
                      check.severity === "reject"
                        ? "rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
                        : "rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20"
                    }
                  >
                    <span
                      className={
                        check.severity === "reject"
                          ? "mb-1.5 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700 dark:bg-red-900/40 dark:text-red-300"
                          : "mb-1.5 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                      }
                    >
                      {check.severity}
                    </span>
                    <h3 className="font-mono text-sm font-semibold text-slate-900 dark:text-white mb-1">{check.name}</h3>
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">{check.what}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Configured thresholds</h2>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900">
                    <tr>
                      {thresholdTable.headers.map((h) => (
                        <th key={h} className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {thresholdTable.rows.map((row) => (
                      <tr key={row[0]}>
                        {row.map((cell, c) => (
                          <td
                            key={c}
                            className={
                              c === 0
                                ? "px-4 py-3 font-mono font-medium text-seai-700 dark:text-seai-300"
                                : "px-4 py-3 text-slate-600 dark:text-slate-400"
                            }
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <div className="rounded-3xl border border-darwin-300 bg-darwin-50 p-8 dark:border-darwin-800 dark:bg-darwin-900/20">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">The gate already refused a real gain</h2>
                <p className="mb-6 max-w-3xl leading-relaxed text-slate-700 dark:text-slate-300">
                  In the trustworthy-evolution experiment the gate returned <strong>HOLD</strong> on a +0.03 quality delta
                  — below the 0.05 minimum and, at the observed variance, indistinguishable from noise — at +16.7% token cost.
                  Refusing to promote noise <em>is</em> the designed behavior.
                </p>
                <div className="flex flex-wrap gap-3">
                  <CardLink href="/evolution/live" title="See the live experiments" description="The real records behind the gates." />
                  <CardLink href="/research/trustworthy-evolution" title="Trustworthy Evolution research" description="Repeated runs, variance, hash-signed evidence." />
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}