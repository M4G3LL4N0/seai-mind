import type { Metadata } from "next";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { PageHeader, CardLink } from "@/components/ui/Page";
import { docSections } from "@/lib/content";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Getting started, architecture, minds, intelligence, interfaces, and operations — every page in the docs tree, with nothing linking to a dead route.",
};

export default function DocsPage() {
  return (
    <>
      <Navigation />
      <main>
        <PageHeader
          eyebrow="Documentation"
          title="Documentation"
          lede="The real reference tree. Every card on this page links to an existing page — no dead ends."
        />
        <div className="container-wide py-16 lg:py-20">
          <div className="space-y-16">
            {docSections.map((group) => (
              <section key={group.label}>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{group.label}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.docs.map((doc) => (
                    <CardLink key={doc.href} href={doc.href} title={doc.label} description={doc.description} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}