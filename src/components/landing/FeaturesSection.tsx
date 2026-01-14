import { motion } from "framer-motion";
import { FileText, Receipt, Bell, Shield, Download, Search } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Document Storage",
    description: "Securely store all your important documents - Aadhaar, PAN, certificates, and more in one place.",
  },
  {
    icon: Receipt,
    title: "Bill Management",
    description: "Track and manage all your utility bills - electricity, water, gas, internet, and mobile.",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "Never miss a payment with intelligent notifications before your bills are due.",
  },
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description: "Your documents are encrypted with 256-bit encryption, same as banks use.",
  },
  {
    icon: Download,
    title: "Easy Access",
    description: "Download, view, or share your documents anytime, anywhere, from any device.",
  },
  {
    icon: Search,
    title: "Quick Search",
    description: "Find any document instantly with powerful search and smart categorization.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-medium uppercase tracking-wider">Features</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
            Everything You Need, <span className="gradient-text">In One Place</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Simplify your digital life with our comprehensive document and bill management solution.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="gradient-border h-full">
                <div className="relative bg-card p-6 rounded-lg h-full hover:bg-secondary/30 transition-colors">
                  {/* Icon */}
                  <div className="mb-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;