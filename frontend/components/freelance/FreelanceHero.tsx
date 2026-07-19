import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Briefcase, Users, Sparkles, Code2, Box, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const highlights = [
  { icon: Box, label: "3D printing from ₹8/g" },
  { icon: Code2, label: "MVPs in 2-6 weeks" },
  { icon: Plane, label: "Drone software" },
  { icon: Sparkles, label: "AI + growth systems" },
];

const FreelanceHero: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleHireFreelancer = () => {
    toast({
      title: "Client login required",
      description: "Use your hiring account to post jobs and hire freelancers.",
    });
    navigate('/auth?flow=hire&mode=login&redirect=/freelance/dashboard');
  };

  const handleBrowseWork = () => {
    navigate('/freelance/jobs');
  };

  return (
    <section className="relative min-h-[80vh] flex items-center pt-24 overflow-hidden bg-gradient-to-b from-background/40 via-background/70 to-background">
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-xs font-medium text-primary">Now live · Destny Freelance Marketplace</span>
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
            The right hands <br />
            <span className="text-gradient-primary">for every Destny</span> project.
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mt-4">
            Connect with vetted freelancers — students, interns, and professionals — for 3D printing, AI automation, drone software, and MVP development.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center mt-8">
            <Button 
              size="lg" 
              className="glow-primary gap-2"
              onClick={handleHireFreelancer}
            >
              <Briefcase className="h-4 w-4" />
              Hire a Freelancer
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="gap-2 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/60 transition-all duration-300"
              onClick={handleBrowseWork}
            >
              <Users className="h-4 w-4" />
              Browse Work
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mt-12">
            {highlights.map(({ icon: Icon, label }) => (
              <div key={label} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FreelanceHero;
