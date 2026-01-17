import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Cloud, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/10" />
        {/* Animated code pattern - Reduced for mobile */}
        <div className="absolute inset-0 opacity-[0.03]">
          {[...Array(typeof window !== 'undefined' && window.innerWidth < 1024 ? 8 : 15)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{
                duration: 4,
                delay: i * 0.3,
                repeat: Infinity,
              }}
              className="absolute text-[10px] md:text-xs font-mono text-foreground whitespace-nowrap"
              style={{
                left: `${(i * 13) % 100}%`,
                top: `${(i * 17) % 100}%`,
              }}
            >
              {["AADHAAR", "PAN", "SECURE", "DOCS", "BILLS", "ENCRYPT"][i % 6]}
            </motion.div>
          ))}
        </div>
        {/* Glow effects - Simplified for mobile */}
        <div className="absolute top-1/4 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-primary/5 md:bg-primary/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-emerald-500/5 md:bg-emerald-500/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDuration: '5s', animationDelay: '1.5s' }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-sm text-primary mb-8"
          >
            <Shield className="h-4 w-4" />
            <span>Bank-grade security for your documents</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            Your Digital Life,{" "}
            <span className="gradient-text">Organized</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-balance"
          >
            Store, manage, and access all your important documents and bills in one secure place.
            Never miss a payment with smart reminders.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/auth?mode=signup">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary text-lg px-8 py-6">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="border-border hover:bg-secondary text-foreground text-lg px-8 py-6">
                Sign In
              </Button>
            </Link>
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4 mt-12"
          >
            {[
              { icon: Shield, text: "256-bit Encryption" },
              { icon: Cloud, text: "Cloud Storage" },
              { icon: Bell, text: "Smart Reminders" },
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-border/50 text-sm text-muted-foreground"
              >
                <feature.icon className="h-4 w-4 text-primary" />
                <span>{feature.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-muted-foreground text-sm"
        >
          <span>Scroll to explore</span>
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-primary"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;