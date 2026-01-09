// src/services/premiumLocal.ts
const KEY = "lova_premium_local_v1";

type LocalPlan = 'monthly' | 'yearly' | null;

export type PremiumLocalState = {
  isPremium: boolean;
  plan: LocalPlan;
  updatedAt: number;
};

const DEFAULT_STATE: PremiumLocalState = {
  isPremium: false,
  plan: null,
  updatedAt: 0,
};

export function getPremiumLocal(): PremiumLocalState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);

    return {
      isPremium: Boolean(parsed.isPremium),
      plan: (parsed.plan as LocalPlan) ?? null,
      updatedAt: Number(parsed.updatedAt) || Number(parsed.lastCheckedAt) || 0,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function setPremiumLocal(p: PremiumLocalState) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function clearPremiumLocal() {
  localStorage.removeItem(KEY);
}
