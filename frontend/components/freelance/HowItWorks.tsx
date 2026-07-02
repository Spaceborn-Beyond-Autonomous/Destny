import { motion } from "framer-motion";
import { FileText, Users, CheckCircle } from "lucide-react";

const steps = [
  {
    number: '01',
    icon: FileText,
    title: 'Post or find a job',
    description:
      'Clients describe their project in minutes. Freelancers browse open jobs by category, budget, and skill match.'
  },
  {
    number: '02',
    icon: Users,
    title: 'Accept a proposal',
    description:
      'Clients review applicants, compare rates and portfolios, then accept one. A private contract thread opens instantly.'
  },
  {
    number: '03',
    icon: CheckCircle,
    title: 'Deliver & get paid',
    description:
      'Work through milestones with funds in escrow. Client approves delivery — payment releases automatically.'
  }
];

const HowItWorks: React.FC = () => {
  return (
    <section className="py-16 px-6 bg-background">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              How it works
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-24 left-1/3 right-1/3 h-0.5 bg-primary/20"></div>
            
            {steps.map((step) => (
              <div key={step.number} className="text-center relative">
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 glass rounded-2xl flex items-center justify-center border border-primary/20 shadow-lg">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-primary/20 mb-2">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;