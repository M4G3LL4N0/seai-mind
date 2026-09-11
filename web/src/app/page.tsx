import { Hero } from "@/components/home/Hero";
import { ModelVsMind } from "@/components/home/ModelVsMind";
import { EvolutionLoop } from "@/components/home/EvolutionLoop";
import { IntelligenceEfficiency } from "@/components/home/IntelligenceEfficiency";
import { ArchitectureOverview } from "@/components/home/ArchitectureOverview";
import { DarwinSection } from "@/components/home/DarwinSection";
import { CTASection } from "@/components/home/CTASection";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";

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
        <DarwinSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}