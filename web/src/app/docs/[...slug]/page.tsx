import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/ui/Page";
import { ProseSection } from "@/components/ui/ProseSection";
import { docsList, getDoc } from "@/lib/content";

export function generateStaticParams() {
  return docsList.map((doc) => ({ slug: [doc.slug] }));
}

interface Props {
  params: { slug: string[] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const doc = getDoc(params.slug[0]);
  if (!doc) return { title: "Not found" };
  return {
    title: doc.title,
    description: doc.description,
  };
}

export default function DocPage({ params }: Props) {
  const doc = getDoc(params.slug[0]);
  if (!doc) {
    notFound();
  }

  return (
    <>
      <Navigation />
      <main>
        <PageHeader eyebrow="Documentation" title={doc.title} lede={doc.description} />
        <div className="container-wide py-16 lg:py-20">
          <div className="max-w-3xl mx-auto space-y-10">
            <div className="space-y-10">
              {doc.sections.map((section, i) => (
                <ProseSection key={i} section={section} />
              ))}
            </div>

            {doc.sources && doc.sources.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
                  Sources & further reading
                </h2>
                <ul className="space-y-2">
                  {doc.sources.map((src) => {
                    const external = src.href.startsWith("http");
                    return (
                      <li key={src.label}>
                        <Link
                          href={src.href}
                          target={external ? "_blank" : undefined}
                          rel={external ? "noopener noreferrer" : undefined}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-seai-600 hover:text-seai-700 dark:text-seai-400 dark:hover:text-seai-300"
                        >
                          {src.label}
                          {external && <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}