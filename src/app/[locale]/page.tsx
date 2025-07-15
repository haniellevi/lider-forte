import { HeroSection } from './_components/hero-section';
import { FeaturesSection } from './_components/features-section';
import { ComponentsShowcaseSection } from './_components/components-showcase-section';
import { TechStackSection } from './_components/tech-stack-section';
import { DocumentationSection } from './_components/documentation-section';
import { PricingSection } from './_components/pricing-section';
import { TestimonialsSection } from './_components/testimonials-section';
import { StatsSection } from './_components/stats-section';
import { CtaSection } from './_components/cta-section';
import { WhatsAppFloat } from './_components/whatsapp-float';
import { LandingNavbar } from './_components/navbar';
import { LandingFooter } from './_components/footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-dark">
      <LandingNavbar />
      <HeroSection />
      <FeaturesSection />
      <ComponentsShowcaseSection />
      <TechStackSection />
      <DocumentationSection />
      <PricingSection />
      <TestimonialsSection />
      <StatsSection />
      <CtaSection />
      <WhatsAppFloat />
      <LandingFooter />
    </div>
  );
}