import React, { useState, useEffect } from "react";
import { useSecurity } from "./SecurityProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, Delete, Lock, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const LockScreen: React.FC = () => {
    const { unlock, isBiometricsEnabled } = useSecurity();
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);
    const { toast } = useToast();

    const handleNumberClick = (num: string) => {
        if (pin.length < 6) {
            setPin((prev) => prev + num);
            setError(false);
        }
    };

    const handleDelete = () => {
        setPin((prev) => prev.slice(0, -1));
        setError(false);
    };

    useEffect(() => {
        if (pin.length === 6) {
            const success = unlock(pin);
            if (!success) {
                setError(true);
                setPin("");
                // Haptic feedback simulation
                if (window.navigator.vibrate) {
                    window.navigator.vibrate([100, 50, 100]);
                }
            }
        }
    }, [pin, unlock]);

    const handleBiometricUnlock = async () => {
        // This is a simplified biometric unlock simulation for the browser.
        // In a real mobile app (Capacitor/React Native), you'd use a plugin.
        try {
            // Check if WebAuthn is supported
            if (window.PublicKeyCredential) {
                // In a real implementation, you would trigger a credential request here.
                // For this demo/web version, we'll simulate the success if enabled.
                toast({
                    title: "Biometric Unlock",
                    description: "Simulating fingerprint scan...",
                });

                setTimeout(() => {
                    // Simulation: just unlock if it was enabled in settings
                    unlock(localStorage.getItem(`sd_pin_demo`) || ""); // Fallback logic would be needed
                    // For now, let's just show it's enabled and ask for PIN
                    toast({
                        title: "Success",
                        description: "Biometrics verified. (Simulation)",
                    });
                }, 1000);
            }
        } catch (err) {
            console.error("Biometric error:", err);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm p-8 flex flex-col items-center"
            >
                <div className="mb-8 flex flex-col items-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/20 shadow-[0_0_30px_rgba(var(--primary),0.2)]">
                        <Lock className="h-10 w-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Vault Locked</h2>
                    <p className="text-slate-400 text-sm">Enter your 6-digit PIN to unlock</p>
                </div>

                {/* PIN Indicators */}
                <div className="flex gap-4 mb-12">
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                            transition={{ duration: 0.4 }}
                            className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${pin.length > i
                                    ? "bg-primary border-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                                    : "border-slate-700 bg-transparent"
                                } ${error ? "border-destructive bg-destructive/20" : ""}`}
                        />
                    ))}
                </div>

                {/* Number Pad */}
                <div className="grid grid-cols-3 gap-6 w-full">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <motion.button
                            key={num}
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ scale: 1.05 }}
                            onClick={() => handleNumberClick(num.toString())}
                            className="h-16 w-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl font-semibold text-white hover:bg-white/10 transition-colors"
                        >
                            {num}
                        </motion.button>
                    ))}

                    {/* Biometrics Toggle */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={isBiometricsEnabled ? handleBiometricUnlock : undefined}
                        disabled={!isBiometricsEnabled}
                        className={`h-16 w-16 rounded-full flex items-center justify-center transition-colors ${isBiometricsEnabled
                                ? "bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                                : "bg-transparent text-slate-700 cursor-not-allowed"
                            }`}
                    >
                        <Fingerprint className="h-8 w-8" />
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => handleNumberClick("0")}
                        className="h-16 w-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl font-semibold text-white hover:bg-white/10 transition-colors"
                    >
                        0
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={handleDelete}
                        className="h-16 w-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-destructive/20 hover:border-destructive/30 transition-colors"
                    >
                        <Delete className="h-6 w-6" />
                    </motion.button>
                </div>

                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 text-destructive text-sm font-medium flex items-center gap-2"
                    >
                        <ShieldAlert className="h-4 w-4" />
                        Incorrect PIN. Please try again.
                    </motion.p>
                )}
            </motion.div>
        </div>
    );
};

export default LockScreen;
