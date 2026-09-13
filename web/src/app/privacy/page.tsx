import type { Metadata } from "next";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/ui/Page";
import { ProseSection } from "@/components/ui/ProseSection";
import type { DocSection } from "@/lib/content";

export const metadata: Metadata = {
  title: "Privacy",
  description: "SE-AI's privacy posture: default-deny data flows, local-first personal intelligence, and no provider credentials in client code.",
};

const sections: DocSection[] = [
  {
    heading: "Default-deny privacy",
    paragraphs: [
      "SE-AI is built around a default-deny privacy model: cross-privacy-level access is denied unless explicitly granted. All memory entries carry data classification (allowed levels: PUBLIC, INTERNAL, PRIVATE; default PRIVATE), lower-privacy contexts receive redaction, and every privacy decision writes an audit trail.",
    ],
    bullets: [
      "default level PRIVATE; allowed levels PUBLIC, INTERNAL, PRIVATE",
      "designated tests for privacy authorization paths",
      "audit trail for every privacy decision",
      "no provider credentials in client code",
    ],
  },
  {
    heading: "Local first",
    paragraphs: [
      "PRIVATE and CONFIDENTIAL data stay local by default. External model providers only ever see PUBLIC or INTERNAL data, and only with explicit consent. The platform does not phone home: there is no telemetry server and no account required.",
    ],
  },
  {
    heading: "Principles for this site",
    paragraphs: [
      "This documentation site is a static site. It has no forms, no tracking scripts, no analytics cookies, and no third-party widgets. Its only outbound links are to the public GitHub repository.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Navigation />
      <main>
        <PageHeader eyebrow="Legal" title="Privacy" lede="Default-deny data flows and local-first personal intelligence." />
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