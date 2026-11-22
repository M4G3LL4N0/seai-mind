import type { Metadata } from "next";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { PageHeader, CardLink } from "@/components/ui/Page";
import { minds } from "@/lib/content";

export const metadata: Metadata = {
  title: "Minds",
  description:
    "PAIOS, the SE-AI reference application, alongside clearly labeled Mind concepts.",
};

export default function MindsPage() {
  const real = minds.filter((m) => m.status === "complete");
  const future = minds.filter((m) => m.status !== "complete");

  return (
    <>
      <Navigation />
      <main id="main-content">
        <PageHeader
          eyebrow="Minds"
          title="A Mind Is a System, Not a Call"
          lede="A Mind combines a model with persistent state, skills, tools, goals, and policy. PAIOS is the working reference application; the other profiles are concepts."
        />
        <div className="container-wide py-16 lg:py-20">
          <div className="max-w-5xl mx-auto space-y-16">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                PAIOS / reference application
              </h2>
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
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Concepts in progress
              </h2>
              <p className="mb-6 text-slate-600 dark:text-slate-400">
                These are design directions, not implemented applications. Each remains labeled FUTURE until there is a working Mind and evidence to show.
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
