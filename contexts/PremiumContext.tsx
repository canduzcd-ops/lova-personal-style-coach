import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PlanId } from '../services/iapService';
import { premiumService, PremiumState } from '../services/premiumService';

type PremiumContextValue = PremiumState & {
  refresh: () => Promise<PremiumState>;
  setPlan: (plan: PlanId) => void;
  clear: () => void;
};

const PremiumContext = createContext<PremiumContextValue | undefined>(undefined);

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PremiumState>(premiumService.get());

  const refresh = async () => {
    const next = await premiumService.refreshFromStore();
    setState(next);
    return next;
  };

  const setPlan = (plan: PlanId) => {
    const next = premiumService.setPremium(plan);
    setState(next);
  };

  const clear = () => {
    const next = premiumService.clear();
    setState(next);
  };

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    refresh();
  }, []);

  const value = useMemo<PremiumContextValue>(
    () => ({ ...state, refresh, setPlan, clear }),
    [state]
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
};

export function usePremium(): PremiumContextValue {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used within PremiumProvider');
  return ctx;
}
