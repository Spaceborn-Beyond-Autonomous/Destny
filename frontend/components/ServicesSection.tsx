import { motion } from "framer-motion";
import { Brain, Code2, GraduationCap, Megaphone, Plane, UploadCloud } from "lucide-react";

const services = [
  { icon: UploadCloud, title: "3D Printing", copy: "PLA from ₹8/gram, PETG from ₹12/gram, ABS from ₹15/gram, with 24-72 hour turnaround." },
  { icon: Brain, title: "AI Automation", copy: "Starter workflows from ₹15,000, growth systems from ₹35,000, and scale automations from ₹75,000+." },
  { icon: Code2, title: "MVP Development", copy: "Lean MVPs from ₹30,000, startup builds from ₹75,000, and full launch builds from ₹1.5L+." },
  { icon: Plane, title: "Drone Software", copy: "Mission planning, ground control dashboards, telemetry viewers, computer vision, and fleet tools." },
  { icon: GraduationCap, title: "Workshops & Training", copy: "Small colleges from ₹5,000, reputed colleges from ₹20,000, tech fests up to ₹1,00,000." },
  { icon: Megaphone, title: "Growth, Design & Marketing", copy: "Brand identity, landing pages, SEO, social media, cold email, content creation, and analytics." },
];

const ServicesSection = () => (
  <section id="services" className="py-28 gradient-mesh">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <span className="text-primary text-sm font-medium tracking-widest uppercase">Services</span>
        <h2 className="font-display text-4xl sm:text-5xl font-bold mt-3">
          Everything needed to <span className="text-gradient-primary">build</span>
        </h2>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
          Six connected service verticals let Destny print your part, build your software, automate your workflow, train your team, and market your product.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {services.map(({ icon: Icon, title, copy }, index) => (
          <motion.article
            key={title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
            className="glass rounded-2xl p-6"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-display text-xl font-bold">{title}</h3>
            <p className="text-sm text-muted-foreground mt-3">{copy}</p>
          </motion.article>
        ))}
      </div>
    </div>
  </section>
);

export default ServicesSection;
