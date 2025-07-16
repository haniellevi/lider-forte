import { LandingNavbar } from "./_components/navbar";
import { HeroSection } from "./_components/hero-section";
import { StatsSection } from "./_components/stats-section";
import { FeaturesSection } from "./_components/features-section";
import { TestimonialsSection } from "./_components/testimonials-section";
import { PricingSection } from "./_components/pricing-section";
import { CtaSection } from "./_components/cta-section";
import { LandingFooter } from "./_components/footer";
import { WhatsAppFloat } from "./_components/whatsapp-float";

export default function HomePage() {
  return (
    <>
      <LandingNavbar />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <TestimonialsSection />
        <PricingSection />
        <CtaSection />
      </main>
      <LandingFooter />
      <WhatsAppFloat />
    </>
  );
}