import { db } from './firebaseClient';
import firebase from 'firebase/compat/app';
import { OutfitHistoryEntry } from '../types';
import { cacheService, CACHE_KEYS } from './cacheService';

const COLLECTION = 'outfitHistory';

export const outfitHistoryService = {
  async addOutfit(userId: string, payload: { outfit: any; weather?: any; source?: string; liked?: boolean | null }) {
    try {
      const docRef = await db.collection(COLLECTION).add({
        userId,
        outfit: payload.outfit,
        weather: payload.weather ?? null,
        source: payload.source ?? null,
        liked: payload.liked ?? null,
        isFavorite: false,
        collectionTag: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      
      // Update cache
      const cachedOutfits = await cacheService.get<OutfitHistoryEntry[]>(CACHE_KEYS.OUTFIT_HISTORY) || [];
      const newEntry: OutfitHistoryEntry = {
        id: docRef.id,
        userId,
        outfit: payload.outfit,
        weather: payload.weather,
        source: payload.source,
        liked: payload.liked ?? null,
        isFavorite: false,
        collectionTag: null,
        createdAt: new Date().toISOString(),
      };
      cachedOutfits.unshift(newEntry);
      await cacheService.set(CACHE_KEYS.OUTFIT_HISTORY, cachedOutfits.slice(0, 50)); // Keep last 50
      console.log('[OutfitHistory] Added and cached:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('[OutfitHistory] Add error, queueing for sync:', error);
      
      // Optimistic cache update
      const cachedOutfits = await cacheService.get<OutfitHistoryEntry[]>(CACHE_KEYS.OUTFIT_HISTORY) || [];
      const tempId = `temp_${Date.now()}`;
      const newEntry: OutfitHistoryEntry = {
        id: tempId,
        userId,
        outfit: payload.outfit,
        weather: payload.weather,
        source: payload.source,
        liked: payload.liked ?? null,
        isFavorite: false,
        collectionTag: null,
        createdAt: new Date().toISOString(),
      };
      cachedOutfits.unshift(newEntry);
      await cacheService.set(CACHE_KEYS.OUTFIT_HISTORY, cachedOutfits.slice(0, 50));
      
      // Queue for sync
      await cacheService.addPendingChange({
        type: 'create',
        collection: 'outfitHistory',
        data: {
          userId,
          outfit: payload.outfit,
          weather: payload.weather ?? null,
          source: payload.source ?? null,
          liked: payload.liked ?? null,
          isFavorite: false,
          collectionTag: null,
        },
      });
      console.log('[OutfitHistory] Add queued for sync');
      
      throw error;
    }
  },

  async listOutfits(userId: string, limit = 50): Promise<OutfitHistoryEntry[]> {
    try {
      const cappedLimit = 50; // fixed batch size; infinite scroll not supported yet
      const snapshot = await db
        .collection(COLLECTION)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(cappedLimit)
        .get();

      const items: OutfitHistoryEntry[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          userId: data.userId,
          outfit: data.outfit,
          weather: data.weather || undefined,
          source: data.source || undefined,
          liked: data.liked ?? null,
          isFavorite: data.isFavorite ?? false,
          collectionTag: data.collectionTag ?? null,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          feedbackAt: data.feedbackAt?.toDate ? data.feedbackAt.toDate().toISOString() : data.feedbackAt,
        });
      });
      
      // Update cache with fresh data
      await cacheService.set(CACHE_KEYS.OUTFIT_HISTORY, items);
      console.log('[OutfitHistory] Fetched from Firestore and cached:', items.length);
      
      return items;
    } catch (error) {
      console.error('[OutfitHistory] Firestore fetch error, trying cache:', error);
      
      // Fallback to cache
      const cachedOutfits = await cacheService.get<OutfitHistoryEntry[]>(CACHE_KEYS.OUTFIT_HISTORY);
      if (cachedOutfits && cachedOutfits.length > 0) {
        // Filter by userId (cache might have multiple users' data)
        const userOutfits = cachedOutfits.filter(item => item.userId === userId);
        console.log('[OutfitHistory] Using cached data:', userOutfits.length);
        return userOutfits;
      }
      
      // No cache available
      throw error;
    }
  },

  async setFeedback(docId: string, userId: string, liked: boolean): Promise<void> {
    try {
      const ref = db.collection(COLLECTION).doc(docId);
      const snap = await ref.get();
      if (!snap.exists) throw new Error('Kayıt bulunamadı');
      const data = snap.data();
      if (data?.userId !== userId) throw new Error('Yetkisiz işlem');

      await ref.update({
        liked,
        feedbackAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      
      // Update cache
      const cachedOutfits = await cacheService.get<OutfitHistoryEntry[]>(CACHE_KEYS.OUTFIT_HISTORY);
      if (cachedOutfits) {
        const updated = cachedOutfits.map(item => 
          item.id === docId ? { ...item, liked, feedbackAt: new Date().toISOString() } : item
        );
        await cacheService.set(CACHE_KEYS.OUTFIT_HISTORY, updated);
        console.log('[OutfitHistory] Feedback updated in cache:', docId);
      }
    } catch (error) {
      console.error('[OutfitHistory] Feedback update error:', error);
      
      // Optimistic cache update
      const cachedOutfits = await cacheService.get<OutfitHistoryEntry[]>(CACHE_KEYS.OUTFIT_HISTORY);
      if (cachedOutfits) {
        const updated = cachedOutfits.map(item => 
          item.id === docId ? { ...item, liked, feedbackAt: new Date().toISOString() } : item
        );
        await cacheService.set(CACHE_KEYS.OUTFIT_HISTORY, updated);
        
        // Queue for sync
        await cacheService.addPendingChange({
          type: 'update',
          collection: 'outfitHistory',
          docId,
          data: { liked },
        });
        console.log('[OutfitHistory] Feedback queued for sync');
      }
      
      throw error;
    }
  },

  async setFavorite(docId: string, userId: string, isFavorite: boolean): Promise<void> {
    try {
      const ref = db.collection(COLLECTION).doc(docId);
      const snap = await ref.get();
      if (!snap.exists) throw new Error('Kayıt bulunamadı');
      const data = snap.data();
      if (data?.userId !== userId) throw new Error('Yetkisiz işlem');

      await ref.update({
        isFavorite,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      
      // Update cache
      const cachedOutfits = await cacheService.get<OutfitHistoryEntry[]>(CACHE_KEYS.OUTFIT_HISTORY);
      if (cachedOutfits) {
        const updated = cachedOutfits.map(item => 
          item.id === docId ? { ...item, isFavorite } : item
        );
        await cacheService.set(CACHE_KEYS.OUTFIT_HISTORY, updated);
        console.log('[OutfitHistory] Favorite updated in cache:', docId);
      }
    } catch (error) {
      console.error('[OutfitHistory] Favorite update error:', error);
      
      // Optimistic cache update
      const cachedOutfits = await cacheService.get<OutfitHistoryEntry[]>(CACHE_KEYS.OUTFIT_HISTORY);
      if (cachedOutfits) {
        const updated = cachedOutfits.map(item => 
          item.id === docId ? { ...item, isFavorite } : item
        );
        await cacheService.set(CACHE_KEYS.OUTFIT_HISTORY, updated);
        
        // Queue for sync
        await cacheService.addPendingChange({
          type: 'update',
          collection: 'outfitHistory',
          docId,
          data: { isFavorite },
        });
        console.log('[OutfitHistory] Favorite queued for sync');
      }
      
      throw error;
    }
  },

  async setCollectionTag(docId: string, userId: string, collectionTag: 'work' | 'weekend' | 'date' | null): Promise<void> {
    try {
      const ref = db.collection(COLLECTION).doc(docId);
      const snap = await ref.get();
      if (!snap.exists) throw new Error('Kayıt bulunamadı');
      const data = snap.data();
      if (data?.userId !== userId) throw new Error('Yetkisiz işlem');

      await ref.update({
        collectionTag,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      
      // Update cache
      const cachedOutfits = await cacheService.get<OutfitHistoryEntry[]>(CACHE_KEYS.OUTFIT_HISTORY);
      if (cachedOutfits) {
        const updated = cachedOutfits.map(item => 
          item.id === docId ? { ...item, collectionTag } : item
        );
        await cacheService.set(CACHE_KEYS.OUTFIT_HISTORY, updated);
        console.log('[OutfitHistory] Collection tag updated in cache:', docId);
      }
    } catch (error) {
      console.error('[OutfitHistory] Collection tag update error:', error);
      
      // Optimistic cache update
      const cachedOutfits = await cacheService.get<OutfitHistoryEntry[]>(CACHE_KEYS.OUTFIT_HISTORY);
      if (cachedOutfits) {
        const updated = cachedOutfits.map(item => 
          item.id === docId ? { ...item, collectionTag } : item
        );
        await cacheService.set(CACHE_KEYS.OUTFIT_HISTORY, updated);
        
        // Queue for sync
        await cacheService.addPendingChange({
          type: 'update',
          collection: 'outfitHistory',
          docId,
          data: { collectionTag },
        });
        console.log('[OutfitHistory] Collection tag queued for sync');
      }
      
      throw error;
    }
  },
};
