import type { Metadata } from "next";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/ui/Page";
import { ProseSection } from "@/components/ui/ProseSection";
import type { DocSection } from "@/lib/content";

export const metadata: Metadata = {
  title: "Security",
  description: "SE-AI security design: capability-based permissions, sandboxed evolution, threat detection, and audit logging.",
};

const sections: DocSection[] = [
  {
    heading: "Capability-based security",
    paragraphs: [
      "Security in SE-AI is capability-based: every action requires an explicit permission (mind:execute, memory:read, tool:execute, and so on). The capability system, threat detection, privacy gates, and policy engine live in the core unit.",
    ],
    bullets: [
      "capability-based permissions enforced on all execution",
      "zod validation on every external input",
      "never commit secrets or keys",
      "audit logging for all sensitive operations",
    ],
  },
  {
    heading: "Sandboxed evolution",
    paragraphs: [
      "Evolution candidates are generated and evaluated in an isolated environment, and a safety-threat-scan runs over the serialized candidate changes. An allowlist constrains candidates to a narrow configuration surface (cognitionConfig: deterministicFormat and systemPromptExtra ≤ 2000 chars); candidates can never touch memory, policies, security, or privacy paths — that check is in the gate itself.",
    ],
    bullets: [
      "safety-threat-scan (detectThreats) over candidate changes",
      "safety allowlist constrains the valid property surface",
      "privacy-config gate refuses changes to memory/privacy/security paths",
      "no OS-level sandbox yet — that is labeled STUB, not claimed",
    ],
  },
  {
    heading: "Evolution gates as security controls",
    paragraphs: [
      "The gate checks are security controls, not just quality checks: regression-success, holdout-regression, and protected-category-regression reject candidates that degrade behavior; variance-confidence and small-sample reject promotion on noise. A promoted candidate must still be promoted by an explicit operation and every promotion writes lineage and audit events.",
    ],
  },
];

export default function SecurityPage() {
  return (
    <>
      <Navigation />
      <main>
        <PageHeader eyebrow="Legal" title="Security" lede="Capability-based permissions, sandboxed evolution, audit trails." />
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