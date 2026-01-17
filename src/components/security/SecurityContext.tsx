import { createContext, useContext } from "react";

export interface SecurityContextType {
    isLocked: boolean;
    isLoading: boolean;
    lock: () => void;
    unlock: (pin: string) => boolean;
    hasPin: boolean;
    setPin: (pin: string) => Promise<void>;
    isBiometricsEnabled: boolean;
    setBiometricsEnabled: (enabled: boolean) => Promise<void>;
}

export const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurity = () => {
    const context = useContext(SecurityContext);
    if (context === undefined) {
        throw new Error("useSecurity must be used within a SecurityProvider");
    }
    return context;
};
