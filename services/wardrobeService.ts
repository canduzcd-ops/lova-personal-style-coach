
import { db, auth } from './firebaseClient';
import firebase from "firebase/compat/app";
import { WardrobeItem } from '../types';
import { uploadWardrobeImage } from './storageService';
import { normalizeTagList } from './tagNormalize';
import { track } from './telemetry';
import { cacheService, CACHE_KEYS } from './cacheService';

const COLLECTION_NAME = 'wardrobeItems';
const UPLOAD_ERROR_MESSAGE = "Fotoğraf yüklenemedi, tekrar deneyin";
type UploadOptions = { onUploadProgress?: (progress: number) => void };

export const wardrobeService = {
  /**
   * Adds a new item to the user's wardrobe in Firestore.
   * Caches the result for offline access.
   */
  addWardrobeItem: async (
    data: Omit<WardrobeItem, 'id' | 'userId' | 'createdAt'>,
    options?: UploadOptions
  ): Promise<WardrobeItem> => {
    const user = auth.currentUser;
    if (!user) throw new Error("Kullanıcı oturumu kapalı.");

    track('wardrobe_add_start', {});

    let imageUrl: string | null = null;
    try {
      if (typeof data.image === 'string' && data.image.startsWith('data:image/')) {
        try {
          imageUrl = await uploadWardrobeImage(user.uid, data.image, data.name || data.type, options?.onUploadProgress);
        } catch (err) {
          console.error('Wardrobe image upload failed, aborting add.', err);
          track('wardrobe_add_failed', { reason: 'upload_failed', hasImage: true });
          throw new Error(UPLOAD_ERROR_MESSAGE);
        }
      } else if (typeof data.image === 'string') {
        imageUrl = data.image;
      }

      // Firestore throws error if a field value is undefined. 
      // We explicitly map optional fields to null if they are undefined.
      const aiTags = data.aiTags ? {
        season: data.aiTags.season ?? [],
        occasion: data.aiTags.occasion ?? [],
        style: data.aiTags.style ?? [],
        fabric: data.aiTags.fabric ?? null,
        fit: data.aiTags.fit ?? null,
        pattern: data.aiTags.pattern ?? null,
        aesthetic: data.aiTags.aesthetic ?? []
      } : null;

      const stylesSource = (data as any).styleTags ?? aiTags?.style ?? aiTags?.aesthetic ?? [];
      const colorsSource = (data as any).colorTags ?? (data.color ? [data.color] : []);
      const tagsNormalized = {
        styles: normalizeTagList(stylesSource),
        colors: normalizeTagList(colorsSource),
      };

      const payload = {
        type: data.type,
        name: data.name,
        color: data.color ?? null,
        note: data.note ?? null,
        image: imageUrl ?? null,
        aiTags: aiTags,
        tagsNormalized,
        userId: user.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection(COLLECTION_NAME).add(payload);
      
      track('wardrobe_add_success', { hasImage: !!imageUrl });

      const newItem: WardrobeItem = {
        id: docRef.id,
        userId: user.uid,
        ...data,
        image: imageUrl ?? undefined,
        tagsNormalized,
        createdAt: new Date().toISOString() // Approximate for immediate UI update
      };
      
      // Update cache
      const cachedItems = await cacheService.get<WardrobeItem[]>(CACHE_KEYS.WARDROBE) || [];
      cachedItems.unshift(newItem);
      await cacheService.set(CACHE_KEYS.WARDROBE, cachedItems);
      
      return newItem;
    } catch (error) {
      console.error("Wardrobe add error:", error);
      if ((error as Error).message !== UPLOAD_ERROR_MESSAGE) {
        track('wardrobe_add_failed', { reason: 'firestore_error', hasImage: !!imageUrl });
      }
      throw error;
    }
  },

  /**
   * Fetches all wardrobe items for the current authenticated user.
   * Uses cache for offline access, falls back to Firestore when online.
   */
  getWardrobeItemsForCurrentUser: async (): Promise<WardrobeItem[]> => {
    const user = auth.currentUser;
    if (!user) return [];

    try {
      // Try to fetch from Firestore
      const querySnapshot = await db.collection(COLLECTION_NAME)
        .where("userId", "==", user.uid)
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();

      const items: WardrobeItem[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          type: data.type,
          name: data.name,
          color: data.color,
          note: data.note || undefined, // Map null back to undefined
          image: data.image || undefined, // Map null back to undefined
          userId: data.userId,
          aiTags: data.aiTags || undefined,
          tagsNormalized: data.tagsNormalized || undefined,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || undefined)
        });
      });

      // Client-side sort by creation time
      const sortedItems = items.sort((a, b) => {
          const dateA = a.createdAt || '';
          const dateB = b.createdAt || '';
          return dateB.localeCompare(dateA);
      });

      // Update cache with fresh data
      await cacheService.set(CACHE_KEYS.WARDROBE, sortedItems);
      console.log('[Wardrobe] Fetched from Firestore and cached:', sortedItems.length);

      return sortedItems;
    } catch (error) {
      console.error("[Wardrobe] Firestore fetch error, trying cache:", error);
      
      // Fallback to cache if network error
      const cachedItems = await cacheService.get<WardrobeItem[]>(CACHE_KEYS.WARDROBE);
      if (cachedItems && cachedItems.length > 0) {
        console.log('[Wardrobe] Using cached data:', cachedItems.length);
        return cachedItems;
      }

      // No cache available, re-throw error
      throw error;
    }
  },

  /**
   * Updates a specific wardrobe item.
   * Updates cache and marks as pending if offline.
   */
  updateWardrobeItem: async (id: string, updates: Partial<WardrobeItem>, options?: UploadOptions): Promise<void> => {
    const user = auth.currentUser;
    if (!user) throw new Error("Kullanıcı oturumu kapalı.");

    let imageUpdate = updates.image;
    if (typeof imageUpdate === 'string' && imageUpdate.startsWith('data:image/')) {
      try {
        imageUpdate = await uploadWardrobeImage(user.uid, imageUpdate, updates.name || updates.type, options?.onUploadProgress);
      } catch (err) {
        console.error('Wardrobe image upload failed, aborting update.', err);
        throw new Error(UPLOAD_ERROR_MESSAGE);
      }
    }

    try {
      const docRef = db.collection(COLLECTION_NAME).doc(id);
      
      // Filter out undefined values from updates to avoid Firestore errors
      // and allow 'null' to clear values if passed explicitly
      const updatesWithImage = { ...updates, image: imageUpdate } as Partial<WardrobeItem>;
      const cleanUpdates = Object.entries(updatesWithImage).reduce((acc, [key, value]) => {
          if (value !== undefined) {
              acc[key] = value;
          }
          return acc;
      }, {} as any);

      const aiTagsUpdate = (updates as any).aiTags;
      const stylesUpdateSource = (updates as any).styleTags ?? aiTagsUpdate?.style ?? aiTagsUpdate?.aesthetic;
      const colorsUpdateSource = (updates as any).colorTags ?? (updates as any).color;
      if (stylesUpdateSource !== undefined || colorsUpdateSource !== undefined) {
        cleanUpdates.tagsNormalized = {
          styles: normalizeTagList(stylesUpdateSource ?? []),
          colors: normalizeTagList(colorsUpdateSource ? [colorsUpdateSource].flat() : []),
        };
      }

      await docRef.update({
        ...cleanUpdates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      console.log('[Wardrobe] Updated in Firestore:', id);

      // Update cache
      const cachedItems = await cacheService.get<WardrobeItem[]>(CACHE_KEYS.WARDROBE);
      if (cachedItems) {
        const updatedCache = cachedItems.map(item => 
          item.id === id ? { ...item, ...updatesWithImage } : item
        );
        await cacheService.set(CACHE_KEYS.WARDROBE, updatedCache);
        console.log('[Wardrobe] Cache updated for item:', id);
      }
    } catch (error) {
      console.error('[Wardrobe] Update error:', error);
      
      // Update cache optimistically for offline support
      const cachedItems = await cacheService.get<WardrobeItem[]>(CACHE_KEYS.WARDROBE);
      if (cachedItems) {
        const updatesWithImage = { ...updates, image: imageUpdate } as Partial<WardrobeItem>;
        const updatedCache = cachedItems.map(item => 
          item.id === id ? { ...item, ...updatesWithImage } : item
        );
        await cacheService.set(CACHE_KEYS.WARDROBE, updatedCache);
        
        // Queue for sync when online
        await cacheService.addPendingChange({
          type: 'update',
          collection: 'wardrobe',
          docId: id,
          data: updates
        });
        console.log('[Wardrobe] Update queued for sync');
      }

      throw error;
    }
  },

  /**
   * Deletes a specific wardrobe item.
   * Updates cache and marks as pending if offline.
   */
  deleteWardrobeItem: async (id: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user) throw new Error("Kullanıcı oturumu kapalı.");

    try {
      await db.collection(COLLECTION_NAME).doc(id).delete();
      console.log('[Wardrobe] Deleted from Firestore:', id);

      // Update cache
      const cachedItems = await cacheService.get<WardrobeItem[]>(CACHE_KEYS.WARDROBE);
      if (cachedItems) {
        const updatedCache = cachedItems.filter(item => item.id !== id);
        await cacheService.set(CACHE_KEYS.WARDROBE, updatedCache);
        console.log('[Wardrobe] Cache updated, item removed:', id);
      }
    } catch (error) {
      console.error('[Wardrobe] Delete error:', error);
      
      // Update cache optimistically for offline support
      const cachedItems = await cacheService.get<WardrobeItem[]>(CACHE_KEYS.WARDROBE);
      if (cachedItems) {
        const updatedCache = cachedItems.filter(item => item.id !== id);
        await cacheService.set(CACHE_KEYS.WARDROBE, updatedCache);
        
        // Queue for sync when online
        await cacheService.addPendingChange({
          type: 'delete',
          collection: 'wardrobe',
          docId: id
        });
        console.log('[Wardrobe] Delete queued for sync');
      }

      throw error;
    }
  }
};
