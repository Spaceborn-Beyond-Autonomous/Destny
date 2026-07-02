import { motion } from "framer-motion";
import { ArrowRight, Briefcase, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

const FreelanceCTA: React.FC = () => {
  return (
    <section className="py-16 px-6 bg-background">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-2 gap-6"
        >
          <div className="glass hover:bg-primary/5 rounded-2xl p-8 text-center border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl group">
            <div className="w-20 h-20 glass rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20 group-hover:scale-110 transition-transform duration-300">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">
              Post your first project
            </h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              Describe your project, set your budget, and start receiving proposals from qualified freelancers within hours.
            </p>
            <Button size="lg" className="glow-primary gap-2">
              Hire a freelancer <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="glass hover:bg-primary/5 rounded-2xl p-8 text-center border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl group">
            <div className="w-20 h-20 glass rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20 group-hover:scale-110 transition-transform duration-300">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">
              Start earning today
            </h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              Apply to projects that match your skills. Build your reputation, grow your portfolio, and get paid on time — always.
            </p>
            <Button size="lg" variant="outline" className="gap-2 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/60">
              Apply as freelancer <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FreelanceCTA;