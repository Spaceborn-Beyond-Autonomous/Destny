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
import ResumeUploadDialog from "@/components/ResumeUploadDialog";

const Index = () => {
  const [isQuoteFormOpen, setIsQuoteFormOpen] = useState(false);
  const [isResumeOpen, setIsResumeOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection 
        onQuoteClick={() => setIsQuoteFormOpen(true)} 
        onResumeClick={() => setIsResumeOpen(true)}
      />
      <HeroProducts />
      <ServicesSection />
      <PricingArchitecture />
      <PrintingShowcase />
      <MVPSection />
      <HireSection onResumeClick={() => setIsResumeOpen(true)} />
      <CTASection isQuoteFormOpen={isQuoteFormOpen} onQuoteFormOpenChange={setIsQuoteFormOpen} />
      <NewsletterSection />
      <Footer />

      <ResumeUploadDialog open={isResumeOpen} onOpenChange={setIsResumeOpen} />
    </div>
  );
};

export default Index;
