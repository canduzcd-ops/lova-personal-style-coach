import { Preferences } from '@capacitor/preferences';
/**
 * Cache Service - Offline data storage using Capacitor Storage API
 * Manages local caching of wardrobe items, outfit history, and user preferences
 */
const CACHE_KEYS = {
    WARDROBE: 'lova_cache_wardrobe',
    OUTFIT_HISTORY: 'lova_cache_outfit_history',
    USER_PROFILE: 'lova_cache_user_profile',
    LAST_SYNC: 'lova_last_sync_timestamp',
    PENDING_CHANGES: 'lova_pending_changes',
};
class CacheService {
    CACHE_VERSION = '1.0';
    CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
    /**
     * Set data in cache with metadata
     */
    async set(key, data) {
        try {
            const cacheData = {
                data,
                metadata: {
                    timestamp: Date.now(),
                    version: this.CACHE_VERSION,
                },
            };
            await Preferences.set({
                key,
                value: JSON.stringify(cacheData),
            });
            console.log(`[Cache] Set: ${key}`, data);
        }
        catch (error) {
            console.error(`[Cache] Error setting ${key}:`, error);
            throw error;
        }
    }
    /**
     * Get data from cache
     */
    async get(key) {
        try {
            const { value } = await Preferences.get({ key });
            if (!value) {
                console.log(`[Cache] Miss: ${key}`);
                return null;
            }
            const cacheData = JSON.parse(value);
            const { data, metadata } = cacheData;
            // Check if cache is expired
            if (this.isCacheExpired(metadata)) {
                console.log(`[Cache] Expired: ${key}`);
                await this.remove(key);
                return null;
            }
            // Check version compatibility
            if (metadata.version !== this.CACHE_VERSION) {
                console.log(`[Cache] Version mismatch: ${key}`);
                await this.remove(key);
                return null;
            }
            console.log(`[Cache] Hit: ${key}`, data);
            return data;
        }
        catch (error) {
            console.error(`[Cache] Error getting ${key}:`, error);
            return null;
        }
    }
    /**
     * Remove data from cache
     */
    async remove(key) {
        try {
            await Preferences.remove({ key });
            console.log(`[Cache] Removed: ${key}`);
        }
        catch (error) {
            console.error(`[Cache] Error removing ${key}:`, error);
        }
    }
    /**
     * Clear all cache
     */
    async clearAll() {
        try {
            await Preferences.clear();
            console.log('[Cache] Cleared all cache');
        }
        catch (error) {
            console.error('[Cache] Error clearing cache:', error);
        }
    }
    /**
     * Check if cache is expired
     */
    isCacheExpired(metadata) {
        const age = Date.now() - metadata.timestamp;
        return age > this.CACHE_EXPIRY_MS;
    }
    /**
     * Get last sync timestamp
     */
    async getLastSyncTimestamp() {
        try {
            const { value } = await Preferences.get({ key: CACHE_KEYS.LAST_SYNC });
            return value ? parseInt(value, 10) : null;
        }
        catch (error) {
            console.error('[Cache] Error getting last sync timestamp:', error);
            return null;
        }
    }
    /**
     * Set last sync timestamp
     */
    async setLastSyncTimestamp(timestamp = Date.now()) {
        try {
            await Preferences.set({
                key: CACHE_KEYS.LAST_SYNC,
                value: timestamp.toString(),
            });
        }
        catch (error) {
            console.error('[Cache] Error setting last sync timestamp:', error);
        }
    }
    /**
     * Add pending change (for offline sync)
     */
    async addPendingChange(change) {
        try {
            const pendingChanges = await this.getPendingChanges();
            const newChange = {
                ...change,
                id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Date.now(),
            };
            pendingChanges.push(newChange);
            await this.set(CACHE_KEYS.PENDING_CHANGES, pendingChanges);
            console.log('[Cache] Added pending change:', newChange);
        }
        catch (error) {
            console.error('[Cache] Error adding pending change:', error);
        }
    }
    /**
     * Get all pending changes
     */
    async getPendingChanges() {
        try {
            const changes = await this.get(CACHE_KEYS.PENDING_CHANGES);
            return changes || [];
        }
        catch (error) {
            console.error('[Cache] Error getting pending changes:', error);
            return [];
        }
    }
    /**
     * Clear pending changes
     */
    async clearPendingChanges() {
        try {
            await this.remove(CACHE_KEYS.PENDING_CHANGES);
            console.log('[Cache] Cleared pending changes');
        }
        catch (error) {
            console.error('[Cache] Error clearing pending changes:', error);
        }
    }
    /**
     * Remove specific pending change
     */
    async removePendingChange(id) {
        try {
            const changes = await this.getPendingChanges();
            const filtered = changes.filter(c => c.id !== id);
            await this.set(CACHE_KEYS.PENDING_CHANGES, filtered);
            console.log('[Cache] Removed pending change:', id);
        }
        catch (error) {
            console.error('[Cache] Error removing pending change:', error);
        }
    }
}
export const cacheService = new CacheService();
export { CACHE_KEYS };
