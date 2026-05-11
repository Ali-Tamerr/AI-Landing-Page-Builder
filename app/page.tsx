import { Navbar } from "@/components/ui/Navbar";
import { Hero } from "@/components/ui/Hero";
import { AiPlayground } from "@/components/ui/AiPlayground";
import { FeatureGrid } from "@/components/ui/FeatureGrid";
import { PricingToggle } from "@/components/ui/PricingToggle";
import { Footer } from "@/components/ui/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <AiPlayground />
        <FeatureGrid />
        <PricingToggle />
      </main>
      <Footer />
    </>
  );
}
