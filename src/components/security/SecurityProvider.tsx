import React, { createContext, useContext, useState, useEffect } from "react";
import { useUser } from "@/integrations/supabase/hooks/useUser";
import LockScreen from "./LockScreen";

interface SecurityContextType {
    isLocked: boolean;
    lock: () => void;
    unlock: (pin: string) => boolean;
    hasPin: boolean;
    setPin: (pin: string) => void;
    isBiometricsEnabled: boolean;
    setBiometricsEnabled: (enabled: boolean) => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { data: user } = useUser();
    const [isLocked, setIsLocked] = useState(false);
    const [hasPin, setHasPin] = useState(false);
    const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(false);

    useEffect(() => {
        // Check if PIN exists in localStorage for this user
        if (user) {
            const savedPin = localStorage.getItem(`sd_pin_${user.id}`);
            const bioEnabled = localStorage.getItem(`sd_bio_${user.id}`) === "true";

            // Check if already unlocked in this specific browser session
            const isUnlockedInSession = sessionStorage.getItem(`sd_unlocked_${user.id}`) === "true";

            setHasPin(!!savedPin);
            setIsBiometricsEnabled(bioEnabled);

            // Lock the app if a PIN is set AND it hasn't been unlocked in this session yet
            if (savedPin && !isUnlockedInSession) {
                setIsLocked(true);
            }
        }
    }, [user]);

    const lock = () => {
        if (user && hasPin) {
            sessionStorage.removeItem(`sd_unlocked_${user.id}`);
            setIsLocked(true);
        }
    };

    const unlock = (pin: string): boolean => {
        if (!user) return false;
        const savedPin = localStorage.getItem(`sd_pin_${user.id}`);
        if (pin === savedPin) {
            // Mark as unlocked for this session
            sessionStorage.setItem(`sd_unlocked_${user.id}`, "true");
            setIsLocked(false);
            return true;
        }
        return false;
    };

    const setPin = (pin: string) => {
        if (!user) return;
        if (pin) {
            localStorage.setItem(`sd_pin_${user.id}`, pin);
            // After setting a new PIN, we consider it unlocked for this session
            sessionStorage.setItem(`sd_unlocked_${user.id}`, "true");
            setHasPin(true);
        } else {
            localStorage.removeItem(`sd_pin_${user.id}`);
            sessionStorage.removeItem(`sd_unlocked_${user.id}`);
            setHasPin(false);
            setIsLocked(false);
        }
    };

    const setBiometricsEnabled = (enabled: boolean) => {
        if (!user) return;
        localStorage.setItem(`sd_bio_${user.id}`, String(enabled));
        setIsBiometricsEnabled(enabled);
    };

    return (
        <SecurityContext.Provider
            value={{
                isLocked,
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

export const useSecurity = () => {
    const context = useContext(SecurityContext);
    if (context === undefined) {
        throw new Error("useSecurity must be used within a SecurityProvider");
    }
    return context;
};
