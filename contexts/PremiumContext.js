import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { premiumService } from '../services/premiumService';
const PremiumContext = createContext(undefined);
export const PremiumProvider = ({ children }) => {
    const [state, setState] = useState(premiumService.get());
    const refresh = async () => {
        const next = await premiumService.refreshFromStore();
        setState(next);
        return next;
    };
    const setPlan = (plan) => {
        const next = premiumService.setPremium(plan);
        setState(next);
    };
    const clear = () => {
        const next = premiumService.clear();
        setState(next);
    };
    useEffect(() => {
        if (!Capacitor.isNativePlatform())
            return;
        refresh();
    }, []);
    const value = useMemo(() => ({ ...state, refresh, setPlan, clear }), [state]);
    return _jsx(PremiumContext.Provider, { value: value, children: children });
};
export function usePremium() {
    const ctx = useContext(PremiumContext);
    if (!ctx)
        throw new Error('usePremium must be used within PremiumProvider');
    return ctx;
}
