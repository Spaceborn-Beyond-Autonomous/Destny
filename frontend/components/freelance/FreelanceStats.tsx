import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, IndianRupee, TrendingUp, Clock } from "lucide-react";
import { freelancerService } from "@/services/freelancer.service";
import { jobService } from "@/services/job.service";
import { contractService } from "@/services/contract.service";

const FreelanceStats: React.FC = () => {
  const [stats, setStats] = useState([
    { icon: Users, number: "0", label: "Verified freelancers" },
    { icon: IndianRupee, number: "₹0", label: "Released in payouts" },
    { icon: TrendingUp, number: "0", label: "Open jobs" },
    { icon: Clock, number: "0", label: "Active contracts" },
  ]);

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      try {
        const [freelancers, jobs, contracts] = await Promise.all([
          freelancerService.getFreelancers({ limit: 1 }),
          jobService.getJobs({ limit: 1 }),
          contractService.getContractStats(),
        ]);

        if (!mounted) return;

        setStats([
          { icon: Users, number: String(freelancers.total || 0), label: "Verified freelancers" },
          { icon: IndianRupee, number: `₹${Number(contracts.totalValue || 0).toLocaleString()}`, label: "Contract value" },
          { icon: TrendingUp, number: String(jobs.total || 0), label: "Open jobs" },
          { icon: Clock, number: String(contracts.active || 0), label: "Active contracts" },
        ]);
      } catch {
        if (mounted) {
          setStats([
            { icon: Users, number: "0", label: "Verified freelancers" },
            { icon: IndianRupee, number: "₹0", label: "Contract value" },
            { icon: TrendingUp, number: "0", label: "Open jobs" },
            { icon: Clock, number: "0", label: "Active contracts" },
          ]);
        }
      }
    };

    loadStats();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="py-16 px-6 bg-muted/30 border-y border-border">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="glass rounded-xl p-6 text-center">
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
