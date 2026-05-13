import { motion } from "framer-motion";
import product2 from "@/assets/3d-print-product2.jpg";
import product3 from "@/assets/3d-print-product3.jpg";
import product4 from "@/assets/3d-print-product4.jpg";

const products = [
  { image: product2, title: "Precision Gears", color: "Cyan Blue", width: 800, height: 800 },
  { image: product3, title: "Organic Sculpture", color: "Magenta Pink", width: 800, height: 800 },
  { image: product4, title: "Miniature Figurine", color: "Neon Green", width: 800, height: 800 },
];

const PrintingShowcase = () => {
  return (
    <section id="3d-printing" className="py-28 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-medium tracking-widest uppercase">
            3D Printing
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mt-3">
            Vibrant <span className="text-gradient-primary">creations</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            From drone frames and robotics brackets to startup enclosures and custom decor, Destny prints fast with transparent India-first pricing.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {products.map((product, i) => (
            <motion.div
              key={product.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="group glass rounded-2xl overflow-hidden hover:border-primary/40 transition-all"
            >
              <div className="overflow-hidden">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  width={product.width}
                  height={product.height}
                />
              </div>
              <div className="p-5">
                <h3 className="font-display font-bold text-lg">{product.title}</h3>
                <p className="text-sm text-muted-foreground">{product.color}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto"
        >
          {[
            { value: "₹8/g", label: "PLA Starting Price" },
            { value: "24-72h", label: "Fast Turnaround" },
            { value: "50%", label: "Advance to Start" },
            { value: "Pan-India", label: "Tracked Shipping" },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl px-4 py-5 text-center">
              <div className="font-display text-3xl font-bold text-gradient-primary">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PrintingShowcase;
