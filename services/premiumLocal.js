// src/services/premiumLocal.ts
const KEY = "lova_premium_local_v1";
const DEFAULT_STATE = {
    isPremium: false,
    plan: null,
    updatedAt: 0,
};
export function getPremiumLocal() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw)
            return DEFAULT_STATE;
        const parsed = JSON.parse(raw);
        return {
            isPremium: Boolean(parsed.isPremium),
            plan: parsed.plan ?? null,
            updatedAt: Number(parsed.updatedAt) || Number(parsed.lastCheckedAt) || 0,
        };
    }
    catch {
        return DEFAULT_STATE;
    }
}
export function setPremiumLocal(p) {
    localStorage.setItem(KEY, JSON.stringify(p));
}
export function clearPremiumLocal() {
    localStorage.removeItem(KEY);
}
