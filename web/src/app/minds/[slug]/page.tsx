import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/ui/Page";
import { StatusPill } from "@/components/ui/StatusPill";
import { minds as allMinds, getMind } from "@/lib/content";

export function generateStaticParams() {
  return allMinds.map((mind) => ({ slug: mind.slug }));
}

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const mind = getMind(params.slug);
  if (!mind) return { title: "Not found" };
  return {
    title: mind.name,
    description: mind.summary,
  };
}

export default function MindPage({ params }: Props) {
  const mind = getMind(params.slug);
  if (!mind) {
    notFound();
  }

  return (
    <>
      <Navigation />
      <main>
        <PageHeader
          eyebrow={mind.kind}
          title={mind.name}
          lede={mind.summary}
          status={mind.status}
        />
        <div className="container-wide py-16 lg:py-20">
          <div className="max-w-4xl mx-auto space-y-12">
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Status: <span className="normal-case">{mind.status}</span>
              </h2>
              <p className="leading-relaxed text-slate-600 dark:text-slate-400">{mind.statusNote}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Capabilities</h2>
              <ul className="space-y-2">
                {mind.capabilities.map((cap) => (
                  <li key={cap} className="flex gap-3 leading-relaxed text-slate-600 dark:text-slate-400">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-seai-500" aria-hidden="true" />
                    {cap}
                  </li>
                ))}
              </ul>
            </section>

            {mind.layers.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Anatomy</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {mind.layers.map((layer) => (
                    <div key={layer.label} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                      <div className="text-xs font-bold uppercase tracking-wide text-seai-600 dark:text-seai-400">{layer.label}</div>
                      <div className="mt-1 text-slate-700 dark:text-slate-300">{layer.value}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Related</h2>
              <div className="flex flex-wrap gap-3">
                <Link href="/minds" className="inline-flex items-center gap-1.5 text-sm font-semibold text-seai-600 hover:text-seai-700 dark:text-seai-400 dark:hover:text-seai-300">
                  Mind gallery <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                {mind.status === "complete" && (
                  <>
                    <Link href="/docs/minds" className="inline-flex items-center gap-1.5 text-sm font-semibold text-seai-600 hover:text-seai-700 dark:text-seai-400 dark:hover:text-seai-300">
                      What a Mind contains <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <Link href="/evolution/live" className="inline-flex items-center gap-1.5 text-sm font-semibold text-seai-600 hover:text-seai-700 dark:text-seai-400 dark:hover:text-seai-300">
                      The experiments that exercised it <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}