import React, { useState, useEffect } from "react";
import { useUser } from "@/integrations/supabase/hooks/useUser";
import LockScreen from "@/components/security/LockScreen";
import { supabase } from "@/integrations/supabase/client";
import { SecurityContext, SecurityContextType } from "./SecurityContext";

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { data: user } = useUser();
    const [isLocked, setIsLocked] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasPin, setHasPin] = useState(false);
    const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(false);
    const [dbPinHash, setDbPinHash] = useState<string | null>(null);

    useEffect(() => {
        const fetchSecuritySettings = async () => {
            if (user) {
                try {
                    const { data, error } = await supabase
                        .from('user_security')
                        .select('pin_hash, biometrics_enabled')
                        .eq('user_id', user.id)
                        .maybeSingle();

                    if (error) throw error;

                    if (data) {
                        setDbPinHash(data.pin_hash);
                        setHasPin(!!data.pin_hash);
                        setIsBiometricsEnabled(data.biometrics_enabled);

                        // Check session-based lock
                        const isUnlockedInSession = sessionStorage.getItem(`sd_unlocked_${user.id}`) === "true";
                        if (data.pin_hash && !isUnlockedInSession) {
                            setIsLocked(true);
                        }
                    }
                } catch (err) {
                    console.error("Error fetching security settings:", err);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        };

        fetchSecuritySettings();

        // Add visibility change listener for auto-locking
        let backgroundedTime: number | null = null;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                backgroundedTime = Date.now();
                // Persist the hidden time to handle app restarts
                localStorage.setItem(`sd_last_hidden_${user?.id}`, backgroundedTime.toString());
            } else if (document.visibilityState === 'visible') {
                const now = Date.now();
                const lastHidden = localStorage.getItem(`sd_last_hidden_${user?.id}`);
                const hasPinSet = !!dbPinHash;

                if (hasPinSet && lastHidden) {
                    const hiddenDuration = Date.now() - parseInt(lastHidden);
                    // Lock if backgrounded for more than 1 minute, or if session was cleared
                    if (hiddenDuration > 60000) {
                        setIsLocked(true);
                        sessionStorage.removeItem(`sd_unlocked_${user?.id}`);
                    }
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user, dbPinHash]);

    const lock = () => {
        if (user && hasPin) {
            sessionStorage.removeItem(`sd_unlocked_${user.id}`);
            setIsLocked(true);
        }
    };

    const unlock = (pin: string): boolean => {
        if (!user || !dbPinHash) return false;
        // Simple comparison for now - in production use a better hashing strategy
        if (pin === dbPinHash) {
            sessionStorage.setItem(`sd_unlocked_${user.id}`, "true");
            setIsLocked(false);
            return true;
        }
        return false;
    };

    const setPin = async (pin: string) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('user_security')
                .upsert({
                    user_id: user.id,
                    pin_hash: pin || null,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            setDbPinHash(pin || null);
            setHasPin(!!pin);

            if (pin) {
                sessionStorage.setItem(`sd_unlocked_${user.id}`, "true");
            } else {
                sessionStorage.removeItem(`sd_unlocked_${user.id}`);
                setIsLocked(false);
            }
        } catch (err) {
            console.error("Error setting pin:", err);
            throw err;
        }
    };

    const setBiometricsEnabled = async (enabled: boolean) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('user_security')
                .upsert({
                    user_id: user.id,
                    biometrics_enabled: enabled,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            setIsBiometricsEnabled(enabled);
        } catch (err) {
            console.error("Error setting biometrics:", err);
            throw err;
        }
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <SecurityContext.Provider
            value={{
                isLocked,
                isLoading,
                lock,
                unlock,
                hasPin,
                setPin,
                isBiometricsEnabled,
                setBiometricsEnabled,
            }}
        >
            {isLocked && <LockScreen />}
            <div className={isLocked ? "blur-sm pointer-events-none select-none transition-all duration-500" : "transition-all duration-500"}>
                {children}
            </div>
        </SecurityContext.Provider>
    );
};
