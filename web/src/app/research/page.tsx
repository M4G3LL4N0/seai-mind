import type { Metadata } from "next";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { PageHeader, CardLink } from "@/components/ui/Page";
import { researchEntries } from "@/lib/content";

export const metadata: Metadata = {
  title: "Research",
  description:
    "The SE-AI research program: falsifiable hypotheses, executed experiments with measured evidence, and a public queue of unclaimed future work.",
};

export default function ResearchPage() {
  return (
    <>
      <Navigation />
      <main>
        <PageHeader
          eyebrow="Research"
          title="Hypotheses, Experiments, and Honest Queues"
          lede="Every entry states what is claimed, what is measured, and what is planned. No plan is ever presented as a finding."
        />
        <div className="container-wide py-16 lg:py-20">
          <div className="max-w-5xl mx-auto space-y-10">
            {researchEntries.map((entry, i) => (
              <section key={entry.slug} className={i > 0 ? "pt-10 border-t border-slate-200 dark:border-slate-800" : undefined}>
                <CardLink
                  href={`/research/${entry.slug}`}
                  title={entry.title}
                  description={entry.summary}
                />
                {entry.date && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{entry.date}</p>}
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}