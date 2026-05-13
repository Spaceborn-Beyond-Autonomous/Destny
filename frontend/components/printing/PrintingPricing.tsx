import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    price: "₹8/g",
    desc: "Student-friendly PLA prints",
    features: [
      "PLA standard material",
      "Standard quality (0.2mm)",
      "₹250 minimum order",
      "24-72 hour delivery window",
      "Minor STL repair included",
    ],
    highlight: false,
  },
  {
    name: "Professional",
    price: "₹12-15/g",
    desc: "Functional PETG and ABS parts",
    features: [
      "PETG and ABS material options",
      "High quality (0.1mm)",
      "₹300-350 minimum order",
      "QC before dispatch",
      "Pan-India tracked shipping",
      "Rush available at +30%",
    ],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "Labs, startups, and repeat production",
    features: [
      "Lab subscriptions from ₹5K-25K",
      "Startup MVP enclosure batches",
      "Branded swag and event sets",
      "Priority quote and production slots",
      "Volume discounts",
      "NDA and IP protection",
    ],
    highlight: false,
  },
];

const PrintingPricing = () => (
  <section id="pricing" className="py-24">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          Simple <span className="text-gradient-primary">Pricing</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Transparent per-gram pricing, 50% advance before printing, QC before dispatch, and balance on delivery.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`rounded-2xl p-8 flex flex-col ${
              plan.highlight
                ? "glass border-primary/40 glow-primary"
                : "glass"
            }`}
          >
            {plan.highlight && (
              <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                Most Popular
              </span>
            )}
            <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{plan.desc}</p>
            <div className="text-3xl font-bold text-foreground mb-6">{plan.price}</div>
            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              className={plan.highlight ? "glow-primary" : ""}
              variant={plan.highlight ? "default" : "outline"}
              size="lg"
              asChild
            >
              {plan.name === "Enterprise" ? (
                <a href="mailto:hello@destny.in">Contact Sales</a>
              ) : (
                <Link to="/3d-printing#upload">Get Started</Link>
              )}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default PrintingPricing;
