import { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HeroProducts from "@/components/HeroProducts";
import ServicesSection from "@/components/ServicesSection";
import PricingArchitecture from "@/components/PricingArchitecture";
import PrintingShowcase from "@/components/PrintingShowcase";
import MVPSection from "@/components/MVPSection";
import HireSection from "@/components/HireSection";
import CTASection from "@/components/CTASection";
import NewsletterSection from "@/components/NewsletterSection";
import Footer from "@/components/Footer";

const Index = () => {
  const [isQuoteFormOpen, setIsQuoteFormOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection onQuoteClick={() => setIsQuoteFormOpen(true)} />
      <HeroProducts />
      <ServicesSection />
      <PricingArchitecture />
      <PrintingShowcase />
      <MVPSection />
      <HireSection />
      <CTASection isQuoteFormOpen={isQuoteFormOpen} onQuoteFormOpenChange={setIsQuoteFormOpen} />
      <NewsletterSection />
      <Footer />
    </div>
  );
};

export default Index;
