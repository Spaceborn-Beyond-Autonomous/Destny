import { motion } from "framer-motion";
import { Users, IndianRupee, TrendingUp, Clock } from "lucide-react";

const statsData = [
  { icon: Users, number: '1,200+', label: 'Verified freelancers' },
  { icon: IndianRupee, number: '₹4.2 Cr', label: 'Released in payouts' },
  { icon: TrendingUp, number: '94%', label: 'Completion rate' },
  { icon: Clock, number: 'Active', label: 'Active Contract' }
];

const FreelanceStats: React.FC = () => {
  return (
    <section className="py-16 px-6 bg-muted/30 border-y border-border">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {statsData.map((stat, index) => (
            <div key={index} className="glass rounded-xl p-6 text-center">
              <div className="flex justify-center mb-3">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-foreground">{stat.number}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FreelanceStats;