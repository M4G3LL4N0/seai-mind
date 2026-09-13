import type { Metadata } from "next";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { PageHeader, CardLink } from "@/components/ui/Page";
import { metricCategories, experiments } from "@/lib/content";

export const metadata: Metadata = {
  title: "Benchmarks",
  description:
    "MindBench: the metric categories MindBench captures, where available — and the measured experiments. No fabricated numbers, ever.",
};

export default function BenchmarksPage() {
  const measured = metricCategories.filter((m) => m.available);
  const pending = metricCategories.filter((m) => !m.available);

  return (
    <>
      <Navigation />
      <main>
        <PageHeader
          eyebrow="MindBench"
          title="Benchmarks"
          lede="The metric families MindBench captures where available, and the experiments actually measured. Numbers appear only when measured."
          snapshot
        />
        <div className="container-wide py-16 lg:py-20">
          <div className="max-w-5xl mx-auto space-y-16">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Metric categories</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {metricCategories.map((metric) => (
                  <div
                    key={metric.name}
                    className={
                      metric.available
                        ? "rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-800 dark:bg-green-900/10"
                        : "rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                    }
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{metric.name}</h3>
                      <span
                        className={
                          metric.available
                            ? "rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700 dark:bg-green-900/40 dark:text-green-300"
                            : "rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }
                      >
                        {metric.available ? "measured" : "available soon"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{metric.description}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{metric.note}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Measured experiments</h2>
              <p className="mb-6 text-slate-600 dark:text-slate-400">
                Only MEASURED experiments appear here. Every number traces to a persisted experiment record.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {experiments.map((exp) => (
                  <CardLink
                    key={exp.slug}
                    href={`/benchmarks/${exp.slug}`}
                    title={exp.title}
                    description={`${exp.date} · gate ${exp.gate} · ${exp.tasks} tasks × ${exp.runsPerTask} run${exp.runsPerTask > 1 ? "s" : ""}/task`}
                  />
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}