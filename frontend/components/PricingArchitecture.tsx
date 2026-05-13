import { motion } from "framer-motion";

const pricing = [
  {
    service: "3D Printing",
    tiers: ["PLA ₹8/g", "PETG ₹12/g", "ABS ₹15/g"],
    note: "Minimum order ₹250. Rush 24-hour delivery available at +30%.",
  },
  {
    service: "AI Automation",
    tiers: ["Starter ₹15,000", "Growth ₹35,000", "Scale ₹75,000+"],
    note: "Monthly automation retainers available from ₹25,000/month.",
  },
  {
    service: "MVP Development",
    tiers: ["Lean MVP ₹30,000", "Startup MVP ₹75,000", "Full Launch ₹1.5L+"],
    note: "2-6 week delivery depending on screens, backend, payments, analytics, and APIs.",
  },
  {
    service: "Drone Software",
    tiers: ["Projects ₹20,000-₹2,00,000", "Pilots ₹25,000-₹1,00,000"],
    note: "Mission planning, GCS dashboards, telemetry, computer vision, fleet tools, and AMC support.",
  },
  {
    service: "Workshops & Labs",
    tiers: ["Workshops ₹5,000-₹1,00,000", "Labs ₹50,000-₹5,00,000"],
    note: "College workshops, tech fests, semester programs, drone labs, AI labs, and robotics labs.",
  },
  {
    service: "Growth, Design & Marketing",
    tiers: ["Projects ₹10,000-₹50,000", "Retainers ₹20,000/month"],
    note: "Brand, SEO, social media, landing pages, content creation, WhatsApp, and cold email.",
  },
];

const PricingArchitecture = () => (
  <section id="pricing" className="py-28">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-14"
      >
        <span className="text-primary text-sm font-medium tracking-widest uppercase">Pricing</span>
        <h2 className="font-display text-4xl sm:text-5xl font-bold mt-3">
          Transparent <span className="text-gradient-primary">pricing</span>
        </h2>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
          Every quote is scoped in writing with 50% advance before work begins, two revision rounds included where applicable, and no surprise costs.
        </p>
      </motion.div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 max-w-6xl mx-auto">
        {pricing.map((item, index) => (
          <motion.article
            key={item.service}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: index * 0.06 }}
            className="glass rounded-2xl p-6"
          >
            <h3 className="font-display text-xl font-bold">{item.service}</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.tiers.map((tier) => (
                <span key={tier} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {tier}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{item.note}</p>
          </motion.article>
        ))}
      </div>
    </div>
  </section>
);

export default PricingArchitecture;
