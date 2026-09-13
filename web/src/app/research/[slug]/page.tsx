import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/ui/Page";
import { ProseSection } from "@/components/ui/ProseSection";
import { researchEntries, getResearchEntry } from "@/lib/content";

export function generateStaticParams() {
  return researchEntries.map((entry) => ({ slug: entry.slug }));
}

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const entry = getResearchEntry(params.slug);
  if (!entry) return { title: "Not found" };
  return {
    title: entry.title,
    description: entry.summary,
  };
}

export default function ResearchEntryPage({ params }: Props) {
  const entry = getResearchEntry(params.slug);
  if (!entry) {
    notFound();
  }

  return (
    <>
      <Navigation />
      <main>
        <PageHeader eyebrow="Research" title={entry.title} lede={entry.summary} status={entry.status} />
        <div className="container-wide py-16 lg:py-20">
          <div className="max-w-3xl mx-auto space-y-10">
            {entry.date && <p className="text-sm text-slate-500 dark:text-slate-400">{entry.date}</p>}
            <div className="space-y-10">
              {entry.paragraphs.map((p, i) => (
                <p key={i} className="leading-relaxed text-slate-600 dark:text-slate-400">
                  {p}
                </p>
              ))}
            </div>
            {entry.bullets.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Key facts</h2>
                <ul className="space-y-2">
                  {entry.bullets.map((b) => (
                    <li key={b} className="flex gap-3 leading-relaxed text-slate-600 dark:text-slate-400">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-seai-500" aria-hidden="true" />
                      {b}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {entry.links.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
                  Sources & further reading
                </h2>
                <ul className="space-y-2">
                  {entry.links.map((link) => {
                    const external = link.href.startsWith("http");
                    return (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          target={external ? "_blank" : undefined}
                          rel={external ? "noopener noreferrer" : undefined}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-seai-600 hover:text-seai-700 dark:text-seai-400 dark:hover:text-seai-300"
                        >
                          {link.label}
                          {external && <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}