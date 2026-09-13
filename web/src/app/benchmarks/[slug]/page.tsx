import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { PageHeader, CardLink } from "@/components/ui/Page";
import { experiments, getExperiment } from "@/lib/content";

export function generateStaticParams() {
  return experiments.map((exp) => ({ slug: exp.slug }));
}

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const exp = getExperiment(params.slug);
  if (!exp) return { title: "Not found" };
  return {
    title: exp.title,
    description: exp.summary,
  };
}

export default function ExperimentPage({ params }: Props) {
  const exp = getExperiment(params.slug);
  if (!exp) {
    notFound();
  }

  return (
    <>
      <Navigation />
      <main>
        <PageHeader
          eyebrow={`Benchmark · ${exp.id}`}
          title={exp.title}
          lede={exp.summary}
          snapshot
        />
        <div className="container-wide py-16 lg:py-20">
          <div className="max-w-5xl mx-auto space-y-12">
            <section>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Gate", value: exp.gate },
                  { label: "Suite", value: exp.suite },
                  { label: "Model", value: exp.model },
                  { label: "Runtime", value: exp.runtime },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{item.label}</div>
                    <div className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{item.value}</div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Arms</h2>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Arm</th>
                      <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-right">Success</th>
                      <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-right">Quality</th>
                      <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-right">Latency</th>
                      <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-right">Tokens</th>
                      {exp.arms.some((a) => a.variance) && (
                        <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-right">Variance</th>
                      )}
                      {exp.arms.some((a) => a.confidence) && (
                        <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-right">Confidence</th>
                      )}
                      {exp.arms.some((a) => a.reproducibility) && (
                        <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-right">Reproducibility</th>
                      )}
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
                        {arm.variance && <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-400">{arm.variance}</td>}
                        {arm.confidence && <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-400">{arm.confidence}</td>}
                        {arm.reproducibility && <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-400">{arm.reproducibility}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{exp.tasks} tasks × {exp.runsPerTask} run{exp.runsPerTask > 1 ? "s" : ""}/task</p>
            </section>

            <section className="rounded-2xl bg-slate-50 p-6 dark:bg-slate-900">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Gate detail</h2>
              <p className="leading-relaxed text-slate-600 dark:text-slate-400">{exp.gateDetail}</p>
              <dl className="mt-4 space-y-1.5 border-t border-slate-200 pt-4 dark:border-slate-800">
                {exp.evidence.map((item) => (
                  <div key={item.label} className="flex justify-between gap-4 text-sm">
                    <dt className="text-slate-500 dark:text-slate-400">{item.label}</dt>
                    <dd className="font-mono text-slate-900 dark:text-white text-right">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              {exp.notes.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Notes</h2>
                  <ul className="space-y-2">
                    {exp.notes.map((note) => (
                      <li key={note} className="flex gap-3 leading-relaxed text-slate-600 dark:text-slate-400">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-seai-500" aria-hidden="true" />
                        {note}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {exp.limitations.length > 0 && (
                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20">
                  <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-200 mb-4">Limitations</h2>
                  <ul className="space-y-2">
                    {exp.limitations.map((lim) => (
                      <li key={lim} className="flex gap-3 leading-relaxed text-amber-800 dark:text-amber-200">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
                        {lim}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            <section>
              <div className="grid gap-4 sm:grid-cols-2">
                <CardLink href="/benchmarks" title="Back to benchmarks" description="The metric categories and experiment list." />
                <CardLink href="/evolution/live" title="Live evolution" description="The same records in their evolution context." />
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}