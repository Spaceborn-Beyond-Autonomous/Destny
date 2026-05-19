import { motion } from "framer-motion";
import { BadgeCheck, Code, Lightbulb, Wrench, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const roles = [
  { icon: Code, title: "Campus Ambassadors", copy: "Students connect Destny with clubs, HODs, workshops, client leads, and regional college partnerships." },
  { icon: Lightbulb, title: "Intern Builders", copy: "Developers, designers, operators, and marketers work on real client projects with a path to full-time roles." },
  { icon: Wrench, title: "Delivery Specialists", copy: "Hands-on support for printing, drone software, automation, content, workshop delivery, and client success." },
];

interface HireSectionProps {
  onResumeClick: () => void;
}

const HireSection = ({ onResumeClick }: HireSectionProps) => (
  <section id="developers" className="py-28 relative">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto text-center mb-14"
      >
        <span className="text-primary text-sm font-medium tracking-widest uppercase">Developers</span>
        <h2 className="font-display text-4xl sm:text-5xl font-bold mt-3">
          Built for <span className="text-gradient-primary">serious makers</span>
        </h2>
        <p className="text-muted-foreground mt-4">
          Destny grows through a practical talent flywheel: ambassadors bring opportunity, interns build real skills, and the strongest contributors become long-term team members.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {roles.map(({ icon: Icon, title, copy }, index) => (
          <motion.article
            key={title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="glass rounded-2xl p-7"
          >
            <div className="flex items-center gap-3 mb-4">
              <Icon className="h-5 w-5 text-primary" />
              <BadgeCheck className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-display text-xl font-bold">{title}</h3>
            <p className="text-sm text-muted-foreground mt-3">{copy}</p>
          </motion.article>
        ))}
      </div>

      {/* Share Your Resume CTA */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="max-w-2xl mx-auto mt-16"
      >
        <div className="glass rounded-3xl p-8 sm:p-12 text-center glow-primary border border-primary/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 opacity-50 group-hover:opacity-85 transition-opacity duration-500" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(249,115,22,0.1)] group-hover:shadow-[0_0_25px_rgba(249,115,22,0.2)] transition-all duration-300">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-bold mb-3 tracking-tight">
              Ready to execute? <span className="text-gradient-primary">Share your resume</span>
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base mb-8 max-w-md leading-relaxed">
              Drop your resume to get matched with active client projects, builder internships, or core team roles. No signup required.
            </p>
            <Button
              id="share-resume-btn"
              size="lg"
              className="glow-primary hover:glow-secondary gap-2 px-8 font-medium transition-all duration-300 scale-100 hover:scale-[1.02]"
              onClick={onResumeClick}
            >
              <Upload className="h-4 w-4" /> Share Your Resume
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default HireSection;
