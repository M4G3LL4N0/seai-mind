import type { Metadata } from "next";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/ui/Page";
import { ProseSection } from "@/components/ui/ProseSection";
import type { DocSection } from "@/lib/content";

export const metadata: Metadata = {
  title: "License",
  description: "The honest licensing status of the SE-AI repository — there is currently no LICENSE file.",
};

const sections: DocSection[] = [
  {
    heading: "Current status",
    paragraphs: [
      "The repository does not yet contain a LICENSE file. Until a license is chosen and committed, the default copyright rules apply: all rights reserved by the copyright holder.",
    ],
  },
  {
    heading: "Why this page exists",
    paragraphs: [
      "We prefer stating this plainly rather than implying a license that is not there. When a license is added, this page will be updated to reflect the actual file. Check the root of the repository for a LICENSE file before relying on any terms.",
    ],
  },
];

export default function LicensePage() {
  return (
    <>
      <Navigation />
      <main>
        <PageHeader eyebrow="Legal" title="License" lede="No LICENSE file exists yet — treated honestly as all-rights-reserved." />
        <div className="container-wide py-16 lg:py-20">
          <div className="max-w-3xl mx-auto space-y-10">
            {sections.map((section, i) => (
              <ProseSection key={i} section={section} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}