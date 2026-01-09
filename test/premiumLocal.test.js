import { getPremiumLocal, setPremiumLocal, clearPremiumLocal } from '../services/premiumLocal';
const STORAGE_KEY = 'lova_premium_local_v1';
describe('premiumLocal storage', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    it('returns default when empty', () => {
        const state = getPremiumLocal();
        expect(state.isPremium).toBe(false);
        expect(state.plan).toBeNull();
    });
    it('roundtrips set and get', () => {
        const now = Date.now();
        setPremiumLocal({ isPremium: true, plan: 'monthly', updatedAt: now });
        const state = getPremiumLocal();
        expect(state).toEqual({ isPremium: true, plan: 'monthly', updatedAt: now });
        // ensure stored
        const raw = localStorage.getItem(STORAGE_KEY);
        expect(raw).not.toBeNull();
    });
    it('clears correctly', () => {
        setPremiumLocal({ isPremium: true, plan: 'yearly', updatedAt: 1 });
        clearPremiumLocal();
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
});
