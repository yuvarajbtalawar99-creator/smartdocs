import React, { createContext, useContext, useState, useEffect } from "react";
import { useUser } from "@/integrations/supabase/hooks/useUser";
import LockScreen from "./LockScreen";
import { supabase } from "@/integrations/supabase/client";

interface SecurityContextType {
    isLocked: boolean;
    isLoading: boolean;
    lock: () => void;
    unlock: (pin: string) => boolean;
    hasPin: boolean;
    setPin: (pin: string) => Promise<void>;
    isBiometricsEnabled: boolean;
    setBiometricsEnabled: (enabled: boolean) => Promise<void>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

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
    }, [user]);

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
                .update({
                    pin_hash: pin || null,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id);

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
                .update({
                    biometrics_enabled: enabled,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id);

            if (error) throw error;
            setIsBiometricsEnabled(enabled);
        } catch (err) {
            console.error("Error setting biometrics:", err);
            throw err;
        }
    };

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
            {isLocked && !isLoading && <LockScreen />}
            <div className={isLocked && !isLoading ? "blur-sm pointer-events-none select-none transition-all duration-500" : "transition-all duration-500"}>
                {children}
            </div>
        </SecurityContext.Provider>
    );
};

export const useSecurity = () => {
    const context = useContext(SecurityContext);
    if (context === undefined) {
        throw new Error("useSecurity must be used within a SecurityProvider");
    }
    return context;
};
