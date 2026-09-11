import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { ArchitectureOverview } from "@/components/home/ArchitectureOverview";
import { CTASection } from "@/components/home/CTASection";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Architecture — SE-AI Mind",
  description: "Four-layer architecture: Foundation, Subsystems, Cognition, Mind Runtime. Clean separation of concerns with extensible interfaces.",
};

export default function ArchitecturePage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        <ArchitectureOverview />
        <CTASection
          title="Explore Individual Components"
          description="Each component has its own documentation, API reference, and extension guide."
          primaryAction={{ label: "View Documentation", href: "/docs" }}
          secondaryActions={[
            { label: "View Darwin Spec", href: "/darwin", variant: "outline" },
            { label: "Run Benchmarks", href: "/benchmarks", variant: "ghost" },
          ]}
        />
      </main>
      <Footer />
    </>
  );
}