import { motion } from "framer-motion";
import { ArrowRight, Box, Code2, Plane, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/mvp-team.jpg";

const highlights = [
  { icon: Box, label: "3D printing from ₹8/g" },
  { icon: Code2, label: "MVPs in 2-6 weeks" },
  { icon: Plane, label: "Drone software" },
  { icon: Sparkles, label: "AI + growth systems" },
];

type HeroSectionProps = {
  onQuoteClick: () => void;
};

const HeroSection = ({ onQuoteClick }: HeroSectionProps) => {
  return (
    <section id="home" className="relative min-h-[92vh] flex items-center pt-24 overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroImage} alt="Destny product launch workspace" className="h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl"
        >
          <span className="text-primary text-sm font-medium tracking-widest uppercase">
            Where potential meets destiny
          </span>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mt-4">
            India&apos;s execution partner for{" "}
            <span className="text-gradient-primary">builders</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mt-6">
            Destny brings 3D printing, AI automation, MVP development, drone software, campus workshops, talent programs, and growth support under one trusted roof.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-9">
            <Link to="/#contact" onClick={onQuoteClick}>
              <Button size="lg" className="glow-primary gap-2 w-full sm:w-auto">
                Get a Same-Day Quote <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/3d-printing">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Explore 3D Printing
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mt-12">
            {highlights.map(({ icon: Icon, label }) => (
              <div key={label} className="glass rounded-xl px-4 py-4 flex items-center gap-3">
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
