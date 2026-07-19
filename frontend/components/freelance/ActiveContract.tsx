import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Clock } from "lucide-react";
import { contractService } from "@/services/contract.service";
import type { Contract } from "@/types/freelance";

const ActiveContract: React.FC = () => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadContract = async () => {
      try {
        const activeContract = await contractService.getActiveContract();
        if (mounted) {
          setContract(activeContract);
        }
      } catch {
        if (mounted) {
          setContract(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadContract();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !contract) {
    return null;
  }

  return (
    <section className="py-16 px-6 bg-background">
      <div className="container mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass rounded-2xl border border-border overflow-hidden"
        >
          <div className="p-6 border-b border-border bg-muted/20">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-green-500/10 text-green-500 text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Active
              </span>
              <span className="text-xs text-muted-foreground">Contract</span>
              <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1 bg-background/50 px-3 py-1 rounded-full">
                <Clock className="h-3 w-3" />
                {contract.createdAt ? new Date(contract.createdAt).toLocaleDateString() : "Started"}
              </span>
            </div>
            <h3 className="text-xl font-bold text-foreground">{contract.title}</h3>
          </div>

          <div className="px-6 py-4 border-b border-border hover:bg-muted/10 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border-2 border-primary/20">
                {(contract.freelancerName || "F").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground text-lg">{contract.freelancerName || "Freelancer"}</div>
                <div className="text-sm text-muted-foreground">{contract.freelancerEmail || "Marketplace freelancer"}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-foreground text-xl">₹{Number(contract.amount || 0).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">{contract.status}</div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-b border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Milestones
            </div>
            {contract.milestones?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {contract.milestones.map((milestone) => (
                  <div key={milestone._id || milestone.id || milestone.title} className="bg-muted/20 p-3 rounded-xl border border-border">
                    <div className="text-xs text-muted-foreground mb-1 font-medium">{milestone.title}</div>
                    <div className="font-semibold text-foreground">₹{Number(milestone.amount || 0).toLocaleString()}</div>
                    <div className="text-xs mt-1 font-medium text-muted-foreground">{milestone.status}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No milestones added yet.</p>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ActiveContract;
