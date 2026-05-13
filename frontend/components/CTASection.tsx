import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import axios from "axios";

const QUOTE_REQUEST_STORAGE_KEY = "destny_quote_requests";
const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

type CTASectionProps = {
  isQuoteFormOpen: boolean;
  onQuoteFormOpenChange: (open: boolean) => void;
};

type QuoteFormData = {
  name: string;
  projectDescription: string;
  budget: string;
  technicalSpecifications: string;
  email: string;
};

const initialQuoteFormData: QuoteFormData = {
  name: "",
  projectDescription: "",
  budget: "",
  technicalSpecifications: "",
  email: "",
};

const CTASection = ({ isQuoteFormOpen, onQuoteFormOpenChange }: CTASectionProps) => {
  const [quoteFormData, setQuoteFormData] = useState(initialQuoteFormData);
  const [submitting, setSubmitting] = useState(false);

  const updateQuoteFormData = (field: keyof QuoteFormData, value: string) => {
    setQuoteFormData((current) => ({ ...current, [field]: value }));
  };

  const handleQuoteSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    const quoteRequest = {
      ...quoteFormData,
      submittedAt: new Date().toISOString(),
      source: "same-day-quote-form",
    };

    try {
      // Local storage fallback (keeping it for robustness)
      const existingRequests = JSON.parse(localStorage.getItem(QUOTE_REQUEST_STORAGE_KEY) ?? "[]");
      localStorage.setItem(QUOTE_REQUEST_STORAGE_KEY, JSON.stringify([...existingRequests, quoteRequest]));
      window.dispatchEvent(new CustomEvent("destny:quote-request-submitted", { detail: quoteRequest }));

      // Backend integration
      await axios.post(`${backendUrl}/api/v1/quotes/submit`, quoteRequest);

      toast({
        title: "Quote request submitted",
        description: "Your details have been sent to the team. We'll get back to you soon!",
      });

      setQuoteFormData(initialQuoteFormData);
      onQuoteFormOpenChange(false);
    } catch (error: any) {
      console.error("Quote submission error:", error);
      toast({
        title: "Submission failed",
        description: error.response?.data?.message || "Something went wrong. Please try again or email us directly.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh" />
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass rounded-3xl p-10 sm:p-16 text-center max-w-3xl mx-auto glow-primary"
        >
          <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4">
            Ready to build
            <br />
            <span className="text-gradient-primary">something great?</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
            Whether it&apos;s an STL print, startup MVP, automation, drone dashboard, campus workshop, or content campaign, Destny can quote it clearly and move fast.
          </p>
            {!isQuoteFormOpen && (
            <Button
              size="lg"
              className="glow-primary px-10 gap-2 text-base"
              onClick={() => onQuoteFormOpenChange(true)}
            >
              Start Your Project <ArrowRight className="h-4 w-4" />
            </Button>
          )}

          {isQuoteFormOpen && (
            <form onSubmit={handleQuoteSubmit} className="mt-8 space-y-5 text-left">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quote-name">Name</Label>
                  <Input
                    id="quote-name"
                    name="name"
                    value={quoteFormData.name}
                    onChange={(event) => updateQuoteFormData("name", event.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quote-email">Email</Label>
                  <Input
                    id="quote-email"
                    name="email"
                    type="email"
                    value={quoteFormData.email}
                    onChange={(event) => updateQuoteFormData("email", event.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quote-project-description">Describe your project</Label>
                <Textarea
                  id="quote-project-description"
                  name="projectDescription"
                  value={quoteFormData.projectDescription}
                  onChange={(event) => updateQuoteFormData("projectDescription", event.target.value)}
                  placeholder="Tell us what you want to build"
                  required
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quote-budget">Budget</Label>
                  <Input
                    id="quote-budget"
                    name="budget"
                    value={quoteFormData.budget}
                    onChange={(event) => updateQuoteFormData("budget", event.target.value)}
                    placeholder="Example: ₹50,000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quote-technical-specifications">Technical specifications</Label>
                  <Textarea
                    id="quote-technical-specifications"
                    name="technicalSpecifications"
                    value={quoteFormData.technicalSpecifications}
                    onChange={(event) => updateQuoteFormData("technicalSpecifications", event.target.value)}
                    placeholder="Materials, stack, size, deadline, files, etc."
                    required
                    className="min-h-[40px]"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => onQuoteFormOpenChange(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" className="glow-primary gap-2" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Quote Request"} <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
