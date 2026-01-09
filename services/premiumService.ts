import { Capacitor } from '@capacitor/core';
import { PlanId, iapService } from './iapService';
import {
  getPremiumLocal,
  setPremiumLocal,
  clearPremiumLocal,
  PremiumLocalState,
} from './premiumLocal';

export type PremiumState = {
  isPremium: boolean;
  plan: PlanId | null;
  updatedAt: number;
};

function normalize(local: PremiumLocalState): PremiumState {
  return {
    isPremium: Boolean(local.isPremium),
    plan: (local.plan as PlanId | null) ?? null,
    updatedAt: Number(local.updatedAt) || 0,
  };
}

function nowTs() {
  return Date.now();
}

export const premiumService = {
  get(): PremiumState {
    return normalize(getPremiumLocal());
  },

  setPremium(plan: PlanId): PremiumState {
    const next: PremiumLocalState = {
      isPremium: true,
      plan,
      updatedAt: nowTs(),
    };
    setPremiumLocal(next);
    return normalize(next);
  },

  clear(): PremiumState {
    const cleared: PremiumLocalState = {
      isPremium: false,
      plan: null,
      updatedAt: nowTs(),
    };
    setPremiumLocal(cleared);
    return normalize(cleared);
  },

  async refreshFromStore(): Promise<PremiumState> {
    // Web ortamında noop
    if (!Capacitor.isNativePlatform()) {
      return this.get();
    }

    try {
      const ent = await iapService.restore();
      if (ent?.isPremium) {
        const plan = (ent.activePlan as PlanId | undefined) ?? null;
        return this.setPremium(plan ?? 'monthly');
      }
    } catch (err) {
      console.warn('premium refresh failed', err);
    }

    return this.clear();
  },
};
