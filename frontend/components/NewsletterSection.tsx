import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "What can users request through Destny?",
    answer: "3D printing, AI automation, MVP development, drone software, workshops and training, plus growth, design, marketing, and content support.",
  },
  {
    question: "Who is Destny for?",
    answer: "Destny is for engineering students, colleges, founders, SMEs, drone and robotics teams, creators, and anyone who needs execution support.",
  },
  {
    question: "Who founded Destny?",
    answer: "Destny was founded by Adarsh Kumar with the goal of helping people move from raw ideas to useful, visible, and testable products.",
  },
  {
    question: "How does pricing work?",
    answer: "Quotes are scoped upfront with transparent pricing, 50% advance before work begins, and balance on delivery for most project work.",
  },
];

const NewsletterSection = () => (
  <section id="faq" className="py-28 gradient-mesh">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <span className="text-primary text-sm font-medium tracking-widest uppercase">FAQ</span>
        <h2 className="font-display text-4xl sm:text-5xl font-bold mt-3">
          Clear answers about <span className="text-gradient-primary">Destny</span>
        </h2>
      </motion.div>

      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, index) => (
          <motion.details
            key={faq.question}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: index * 0.08 }}
            className="glass rounded-2xl p-6 group"
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 font-display text-lg font-semibold">
              <HelpCircle className="h-5 w-5 text-primary shrink-0" />
              {faq.question}
            </summary>
            <p className="text-muted-foreground mt-4 pl-8">{faq.answer}</p>
          </motion.details>
        ))}
      </div>
    </div>
  </section>
);

export default NewsletterSection;
