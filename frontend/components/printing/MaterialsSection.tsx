import { motion } from "framer-motion";

const materials = [
  {
    name: "PLA",
    desc: "Most popular and student-friendly; starts at ₹8/gram",
    color: "from-green-400 to-emerald-600",
    props: ["Biodegradable", "Easy to print", "Low cost"],
  },
  {
    name: "ABS",
    desc: "Durable and heat-resistant for stronger functional parts",
    color: "from-orange-400 to-red-500",
    props: ["High strength", "Heat resistant", "Impact proof"],
  },
  {
    name: "PETG",
    desc: "Flexible and chemical-resistant for tougher prototypes",
    color: "from-cyan-400 to-blue-500",
    props: ["Food safe", "Chemical resistant", "UV stable"],
  },
  {
    name: "Multi-color PLA",
    desc: "Bambu Lab A1 Combo support for vivid multi-color prints",
    color: "from-purple-400 to-pink-500",
    props: ["Vivid color", "Auto-calibrated", "Display models"],
  },
  {
    name: "STL Repair",
    desc: "Minor mesh repair included before printing",
    color: "from-yellow-400 to-orange-500",
    props: ["File review", "Cleaner prints", "Fewer failures"],
  },
  {
    name: "QC & Shipping",
    desc: "Every print inspected before Pan-India tracked dispatch",
    color: "from-pink-400 to-rose-500",
    props: ["QC checked", "Tracked ship", "Balance on delivery"],
  },
];

const MaterialsSection = () => (
  <section id="materials" className="py-24">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          Premium <span className="text-gradient-primary">Materials</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Core materials and production support for student projects, drone frames, enclosures, decor, and startup prototypes.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {materials.map((mat, i) => (
          <motion.div
            key={mat.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="glass rounded-2xl p-6 hover:border-primary/30 transition-all group"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mat.color} mb-4 group-hover:scale-110 transition-transform`} />
            <h3 className="text-lg font-bold text-foreground mb-1">{mat.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{mat.desc}</p>
            <div className="flex flex-wrap gap-2">
              {mat.props.map((p) => (
                <span key={p} className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                  {p}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default MaterialsSection;
