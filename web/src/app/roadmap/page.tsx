import type { Metadata } from "next";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/ui/Page";
import { StatusPill } from "@/components/ui/StatusPill";
import { roadmapAreas, generations, roadmapNote } from "@/lib/content";

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "The actual development path: near-term areas with honest statuses, the five SE-AI generations (Darwin → Woz → Turing → Tesla → Einstein), and what is future vs built.",
};

export default function RoadmapPage() {
  return (
    <>
      <Navigation />
      <main>
        <PageHeader
          eyebrow="Roadmap"
          title="The Actual Development Path"
          lede="Honest statuses, not marketing. Everything marked FUTURE is designed, not built."
        />
        <div className="container-wide py-16 lg:py-20">
          <div className="max-w-5xl mx-auto space-y-16">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Near-term areas</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {roadmapAreas.map((area) => (
                  <div key={area.code} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{area.title}</h3>
                      <StatusPill status={area.status} />
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{area.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Generations</h2>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Gen</th>
                      <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Codename</th>
                      <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Version</th>
                      <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Target</th>
                      <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Focus</th>
                      <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {generations.map((gen) => (
                      <tr key={gen.code}>
                        <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{gen.code}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{gen.name}</td>
                        <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{gen.version}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{gen.target}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{gen.focus}</td>
                        <td className="px-4 py-3">
                          <StatusPill status={gen.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{roadmapNote}</p>
            </section>

            <section>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Where we are, in one paragraph</h2>
                <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                  Darwin 0.1 is the evolution-infrastructure generation: kernel, Mind runtime, memory, evaluation,
                  evolution with gates, genome, SDK, CLI, and the PAIOS reference Mind are real and exercised — two
                  live evolution experiments have run to completion, including a gate that held back a noise-level gain.
                  Skills, the cognitive compiler, provider/model intelligence, genome tooling, and multi-mind
                  coordination are partial and labeled as such. Weight-level adaptation (Model Foundry), the marketplace,
                  and the enterprise surface are future work — not yet built, and never presented as built.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}