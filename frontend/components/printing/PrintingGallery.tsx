import { motion } from "framer-motion";
import gallery1 from "@/assets/3d-gallery-1.jpg";
import gallery2 from "@/assets/3d-gallery-2.jpg";
import product1 from "@/assets/3d-print-product1.jpg";
import product2 from "@/assets/3d-print-product2.jpg";

const images = [
  { src: gallery1, alt: "3D Printed Collection" },
  { src: gallery2, alt: "Gradient Gears" },
  { src: product1, alt: "Vibrant Sculpture" },
  { src: product2, alt: "Colorful Figurines" },
];

const PrintingGallery = () => (
  <section className="py-24 gradient-mesh">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          Our <span className="text-gradient-primary">Gallery</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          See the quality and vibrancy of our 3D printed products.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {images.map((img, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl overflow-hidden group"
          >
            <img
              src={img.src}
              alt={img.alt}
              loading="lazy"
              width={800}
              height={800}
              className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default PrintingGallery;
