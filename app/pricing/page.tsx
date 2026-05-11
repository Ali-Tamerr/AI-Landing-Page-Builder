import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { PricingToggle } from "@/components/ui/PricingToggle";

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">
        <PricingToggle />
      </main>
      <Footer />
    </>
  );
}
