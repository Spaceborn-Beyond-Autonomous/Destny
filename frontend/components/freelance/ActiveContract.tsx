import { motion } from "framer-motion";
import { CheckCircle, Clock, User, Briefcase, MessageCircle } from "lucide-react";

const contractData = {
  title: 'EdTech MVP — Student Progress Dashboard',
  freelancer: {
    name: 'Arjun Sharma',
    role: 'Full-Stack Developer',
    rating: 4.9,
    reviews: 34,
    avatar: 'AS'
  },
  amount: '₹80,000',
  type: 'Fixed price',
  milestones: [
    { title: 'Discovery & Planning', amount: '₹12,000', status: 'Completed' },
    { title: 'Frontend Build', amount: '₹28,000', status: 'In Progress' },
    { title: 'Backend & APIs', amount: '₹28,000', status: 'Pending' }
  ],
  comment: {
    user: 'Rohit S.',
    time: 'just now',
    text: 'Staging looks great! The quiz chart is exactly what I envisioned 🔥'
  }
};

const ActiveContract: React.FC = () => {
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
                2 weeks left
              </span>
            </div>
            <h3 className="text-xl font-bold text-foreground">{contractData.title}</h3>
          </div>

          <div className="px-6 py-4 border-b border-border hover:bg-muted/10 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border-2 border-primary/20">
                {contractData.freelancer.avatar}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground text-lg">{contractData.freelancer.name}</div>
                <div className="text-sm text-muted-foreground">{contractData.freelancer.role}</div>
                <div className="flex items-center gap-2 text-sm mt-0.5">
                  <span className="text-yellow-500">⭐</span>
                  <span className="font-medium text-foreground">{contractData.freelancer.rating}</span>
                  <span className="text-muted-foreground">({contractData.freelancer.reviews} reviews)</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-foreground text-xl">{contractData.amount}</div>
                <div className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">{contractData.type}</div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-b border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Milestones
            </div>
            <div className="grid grid-cols-3 gap-3">
              {contractData.milestones.map((milestone, index) => (
                <div key={index} className="bg-muted/20 p-3 rounded-xl border border-border hover:border-primary/30 transition-colors">
                  <div className="text-xs text-muted-foreground mb-1 font-medium">{milestone.title}</div>
                  <div className="font-semibold text-foreground">{milestone.amount}</div>
                  <div className={`text-xs mt-1 font-medium ${
                    milestone.status === 'Completed' ? 'text-green-500' :
                    milestone.status === 'In Progress' ? 'text-yellow-500' :
                    'text-muted-foreground'
                  }`}>
                    {milestone.status === 'Completed' ? '✅' :
                     milestone.status === 'In Progress' ? '🔄' :
                     '⏳'} {milestone.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-4 bg-muted/20">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-sm border-2 border-border">
                {contractData.comment.user.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-foreground">{contractData.comment.user}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{contractData.comment.time}</span>
                </div>
                <p className="text-foreground mt-1 bg-background/50 p-3 rounded-xl border border-border">
                  {contractData.comment.text}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ActiveContract;