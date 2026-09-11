import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { DarwinSection } from "@/components/home/DarwinSection";
import { CTASection } from "@/components/home/CTASection";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Darwin 0.1 — Evolution Infrastructure",
  description: "The first SE-AI generation establishes evolution itself: candidate generation, sandboxing, benchmarking, reviews, promotion, and rollback.",
};

export default function DarwinPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        <DarwinSection />
        <CTASection
          title="Explore the Full Darwin Specification"
          description="Read the complete technical specification, architecture diagrams, and implementation details."
          primaryAction={{ label: "Read Darwin Spec", href: "/docs/darwin", icon: undefined }}
          secondaryActions={[
            { label: "View Architecture", href: "/architecture", icon: undefined, variant: "outline" },
            { label: "Run Benchmarks", href: "/benchmarks", icon: undefined, variant: "ghost" },
          ]}
        />
      </main>
      <Footer />
    </>
  );
}