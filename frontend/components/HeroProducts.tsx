import { motion } from "framer-motion";
import studentLab from "@/assets/3d-gallery-1.jpg";
import startupTeam from "@/assets/mvp-team.jpg";
import creatorStudio from "@/assets/content-creation.jpg";

const products = [
  { title: "Students & Colleges", copy: "Drone, robotics, IoT, workshop, and lab support for real project execution.", image: studentLab },
  { title: "Founders & SMEs", copy: "MVPs, automation, dashboards, websites, and growth systems without agency overhead.", image: startupTeam },
  { title: "Makers & Creators", copy: "Affordable prints, launch content, brand assets, and production-ready prototypes.", image: creatorStudio },
];

const HeroProducts = () => (
  <section id="about" className="py-24 relative overflow-hidden">
    <div className="container mx-auto px-6">
      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 items-center max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-primary text-sm font-medium tracking-widest uppercase">About Destny</span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mt-3 mb-6">
            One company for <span className="text-gradient-primary">every builder</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-4">
            Destny helps students, founders, SMEs, drone teams, colleges, creators, and makers turn ambitious ideas into visible, useful, testable products.
          </p>
          <p className="text-muted-foreground text-lg">
            Founded by Adarsh Kumar, Destny exists to close the gap between potential and execution with transparent pricing, fast delivery, and practical technical support.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-4">
          {products.map((product, index) => (
            <motion.article
              key={product.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
              className="glass rounded-2xl overflow-hidden"
            >
              <img src={product.image} alt={product.title} className="h-40 w-full object-cover" loading="lazy" />
              <div className="p-5">
                <h3 className="font-display font-bold text-lg">{product.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{product.copy}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default HeroProducts;
