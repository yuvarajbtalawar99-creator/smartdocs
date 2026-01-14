import { motion } from "framer-motion";
import { Shield, Lock, Eye, Server } from "lucide-react";

const securityFeatures = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "All your data is encrypted using AES-256, the same standard used by governments and banks.",
  },
  {
    icon: Eye,
    title: "Privacy First",
    description: "Your documents are only visible to you. We never access, share, or sell your data.",
  },
  {
    icon: Server,
    title: "Secure Cloud Storage",
    description: "Your files are stored in enterprise-grade data centers with 99.9% uptime.",
  },
  {
    icon: Shield,
    title: "Regular Backups",
    description: "Automatic backups ensure your documents are never lost, even in worst-case scenarios.",
  },
];

const SecuritySection = () => {
  return (
    <section id="security" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-primary text-sm font-medium uppercase tracking-wider">Security</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
              Your Data is <span className="gradient-text">Safe With Us</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              We take security seriously. SmartDocs uses industry-leading security measures 
              to protect your sensitive documents and personal information.
            </p>

            <div className="space-y-6">
              {securityFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-3xl" />
              
              {/* Shield Visual */}
              <div className="relative glass rounded-3xl border border-border/50 p-8 flex flex-col items-center justify-center aspect-square max-w-md mx-auto">
                <div className="absolute inset-4 rounded-2xl border border-primary/20 animate-pulse-glow" />
                
                <Shield className="h-32 w-32 text-primary mb-6 animate-float" />
                
                <h3 className="text-2xl font-bold text-foreground mb-2 text-center">
                  256-bit Encryption
                </h3>
                <p className="text-muted-foreground text-center text-sm">
                  Military-grade protection for your documents
                </p>

                {/* Trust Badges */}
                <div className="flex gap-4 mt-8">
                  <div className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary">
                    GDPR Compliant
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary">
                    SSL Secured
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;