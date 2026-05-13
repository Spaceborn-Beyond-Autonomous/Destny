import { motion } from "framer-motion";
import { ArrowRight, Layers, Zap, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/3d-printing-hero.jpg";

const stats = [
  { label: "PLA starts at", value: "₹8/g", icon: Layers },
  { label: "Turnaround", value: "24-72h", icon: Zap },
  { label: "Advance", value: "50%", icon: Shield },
];

const PrintingHero = () => (
  <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
    <div className="absolute inset-0">
      <img src={heroImg} alt="3D Printing workspace" className="w-full h-full object-cover opacity-30" width={1920} height={1080} />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
    </div>

    <div className="container mx-auto px-6 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-3xl"
      >
        <span className="inline-block px-4 py-1.5 rounded-full glass text-primary text-sm font-medium mb-6">
          3D Printing & Rapid Prototyping
        </span>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
          Print Your <span className="text-gradient-primary">Prototype</span> Fast
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
          Upload STL, OBJ, or 3MF files for fast review, transparent pricing, STL repair for minor mesh issues, QC, and Pan-India shipping.
        </p>
        <div className="flex flex-wrap gap-4 mb-12">
          <Link to="/3d-printing#upload">
            <Button size="lg" className="glow-primary text-base gap-2">
              Upload STL File <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link to="/3d-printing#pricing">
            <Button size="lg" variant="outline" className="text-base">
              View Pricing
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap gap-8">
          {stats.map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <s.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);

export default PrintingHero;
