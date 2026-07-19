import { motion } from "framer-motion";
import { Printer, Bot, Rocket, Plane, Palette, Package } from "lucide-react";

const categories = [
  { id: '3d-printing', name: '3D Printing', icon: Printer },
  { id: 'ai-automation', name: 'AI Automation', icon: Bot },
  { id: 'mvp-dev', name: 'MVP Dev', icon: Rocket },
  { id: 'drone-software', name: 'Drone Software', icon: Plane },
  { id: 'design', name: 'Design', icon: Palette },
  { id: 'other', name: 'Other', icon: Package }
];

const FreelanceCategories: React.FC = () => {
  return (
    <section className="py-16 px-6 bg-muted/20">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Built for Destny's world
            </h2>
            <p className="text-muted-foreground text-lg">
              Six categories. Every skill your project needs.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="glass hover:bg-primary/5 rounded-2xl p-6 text-center transition-all duration-300 cursor-pointer border border-border hover:border-primary/30 hover:shadow-lg group"
              >
                <div className="flex justify-center mb-3">
                  <category.icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="font-semibold text-foreground text-sm">{category.name}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FreelanceCategories;