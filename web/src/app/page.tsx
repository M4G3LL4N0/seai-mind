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
    "Open platform for building persistent, measurable, governed, self-evolving AI Minds. A Mind is Model + Memory + Skills + Tools + Identity + Goals + Experience + Evaluation + Evolution + Governance.",
};

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen">
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