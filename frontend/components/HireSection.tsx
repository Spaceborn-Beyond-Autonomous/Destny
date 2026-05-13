import { motion } from "framer-motion";
import { BadgeCheck, Code, Lightbulb, Wrench } from "lucide-react";

const roles = [
  { icon: Code, title: "Campus Ambassadors", copy: "Students connect Destny with clubs, HODs, workshops, client leads, and regional college partnerships." },
  { icon: Lightbulb, title: "Intern Builders", copy: "Developers, designers, operators, and marketers work on real client projects with a path to full-time roles." },
  { icon: Wrench, title: "Delivery Specialists", copy: "Hands-on support for printing, drone software, automation, content, workshop delivery, and client success." },
];

const HireSection = () => (
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
    </div>
  </section>
);

export default HireSection;
