import { Capacitor } from '@capacitor/core';
import { iapService } from './iapService';
import { getPremiumLocal, setPremiumLocal, } from './premiumLocal';
function normalize(local) {
    return {
        isPremium: Boolean(local.isPremium),
        plan: local.plan ?? null,
        updatedAt: Number(local.updatedAt) || 0,
    };
}
function nowTs() {
    return Date.now();
}
export const premiumService = {
    get() {
        return normalize(getPremiumLocal());
    },
    setPremium(plan) {
        const next = {
            isPremium: true,
            plan,
            updatedAt: nowTs(),
        };
        setPremiumLocal(next);
        return normalize(next);
    },
    clear() {
        const cleared = {
            isPremium: false,
            plan: null,
            updatedAt: nowTs(),
        };
        setPremiumLocal(cleared);
        return normalize(cleared);
    },
    async refreshFromStore() {
        // Web ortamında noop
        if (!Capacitor.isNativePlatform()) {
            return this.get();
        }
        try {
            const ent = await iapService.restore();
            if (ent?.isPremium) {
                const plan = ent.activePlan ?? null;
                return this.setPremium(plan ?? 'monthly');
            }
        }
        catch (err) {
            console.warn('premium refresh failed', err);
        }
        return this.clear();
    },
};
