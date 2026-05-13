import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import mvpImage from "@/assets/mvp-team.jpg";

const MVPSection = () => {
  return (
    <section id="mvp" className="py-28 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-primary text-sm font-medium tracking-widest uppercase">Build</span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mt-3 mb-6">
              Ship your MVP in{" "}
              <span className="text-gradient-primary">weeks</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-6">
              We help founders build usable web apps, dashboards, SaaS tools, e-commerce flows, and mobile-ready products with clear scope and milestone billing.
            </p>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <h4 className="font-display font-bold text-lg mb-1">Speed</h4>
                <p className="text-sm text-muted-foreground">
                  Lean MVPs start at ₹30,000 with 2-week delivery for core screens, backend basics, and deployment.
                </p>
              </div>
              <div>
                <h4 className="font-display font-bold text-lg mb-1">Expertise</h4>
                <p className="text-sm text-muted-foreground">
                  Startup MVPs include auth, admin dashboards, APIs, analytics, and integrations across 3-6 week timelines.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button className="glow-primary gap-2" asChild>
                <Link to="/#contact">Start Your Project</Link>
              </Button>
              <Link to="/#developers" className="inline-flex items-center gap-1 text-sm text-primary font-medium hover:gap-2 transition-all self-center">
                Learn More <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl overflow-hidden glow-primary"
          >
            <img
              src={mvpImage}
              alt="Startup team collaborating"
              className="w-full h-full object-cover"
              loading="lazy"
              width={1200}
              height={800}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MVPSection;
