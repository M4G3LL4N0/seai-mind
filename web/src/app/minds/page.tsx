import type { Metadata } from "next";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { PageHeader, CardLink } from "@/components/ui/Page";
import { minds } from "@/lib/content";

export const metadata: Metadata = {
  title: "Minds",
  description:
    "What a Mind is and the gallery: PAIOS, the first real reference SE-AI Mind, plus honest FUTURE examples of what Minds can become.",
};

export default function MindsPage() {
  const real = minds.filter((m) => m.status === "complete");
  const future = minds.filter((m) => m.status !== "complete");

  return (
    <>
      <Navigation />
      <main>
        <PageHeader
          eyebrow="Minds"
          title="A Mind Is a System, Not a Call"
          lede="Model + Memory + Skills + Tools + Identity + Goals + Experience + Evaluation + Evolution + Governance. One is real; the rest are honest directions, not claims."
        />
        <div className="container-wide py-16 lg:py-20">
          <div className="max-w-5xl mx-auto space-y-16">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">The reference Mind</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {real.map((m) => (
                  <CardLink
                    key={m.slug}
                    href={`/minds/${m.slug}`}
                    title={m.name}
                    description={m.summary}
                  />
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Future Minds</h2>
              <p className="mb-6 text-slate-600 dark:text-slate-400">
                Illustrative examples of what specialized Minds could become. They are marked FUTURE — designed, not built.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {future.map((m) => (
                  <CardLink
                    key={m.slug}
                    href={`/minds/${m.slug}`}
                    title={m.name}
                    description={m.summary}
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