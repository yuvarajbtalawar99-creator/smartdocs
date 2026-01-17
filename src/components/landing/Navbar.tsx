import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur-lg group-hover:bg-primary/30 transition-colors" />
              <div className="relative bg-white p-1.5 rounded-lg border border-primary/20 shadow-sm overflow-hidden">
                <img src="/logo.png" alt="SmartDocs Logo" className="h-6 w-6 object-contain" />
              </div>
            </div>
            <span className="text-xl font-bold text-foreground">
              Smart<span className="text-primary">Docs</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How it Works
            </a>
            <a href="#security" className="text-muted-foreground hover:text-foreground transition-colors">
              Security
            </a>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Sign In
              </Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-foreground"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden pt-4 pb-2"
          >
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Features
              </a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                How it Works
              </a>
              <a href="#security" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Security
              </a>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Link to="/auth">
                  <Button variant="ghost" className="w-full justify-center">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;