import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { ModelVsMind } from "@/components/home/ModelVsMind";
import { EvolutionLoop } from "@/components/home/EvolutionLoop";
import { IntelligenceEfficiency } from "@/components/home/IntelligenceEfficiency";
import { ArchitectureOverview } from "@/components/home/ArchitectureOverview";
import { LiveEvolutionPreview } from "@/components/home/LiveEvolutionPreview";
import { CTASection } from "@/components/home/CTASection";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "SE-AI — Self-Evolving Artificial Intelligence",
  description:
    "Open-source infrastructure for persistent AI Minds that learn through measurable, human-governed experiments. Built around explicit evaluation, user control, and reversible change.",
};

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main id="main-content" className="min-h-screen">
        <Hero />
        <ModelVsMind />
        <EvolutionLoop />
        <IntelligenceEfficiency />
        <ArchitectureOverview />
        <LiveEvolutionPreview />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
