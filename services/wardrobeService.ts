
import { db, auth } from './firebaseClient';
import firebase from "firebase/compat/app";
import { WardrobeItem } from '../types';
import { uploadWardrobeImage } from './storageService';
import { normalizeTagList } from './tagNormalize';

const COLLECTION_NAME = 'wardrobeItems';

export const wardrobeService = {
  /**
   * Adds a new item to the user's wardrobe in Firestore.
   */
  addWardrobeItem: async (data: Omit<WardrobeItem, 'id' | 'userId' | 'createdAt'>): Promise<WardrobeItem> => {
    const user = auth.currentUser;
    if (!user) throw new Error("Kullanıcı oturumu kapalı.");

    let imageUrl: string | null | undefined = data.image;
    if (typeof data.image === 'string' && data.image.startsWith('data:image/')) {
      try {
        imageUrl = await uploadWardrobeImage(user.uid, data.image, data.name || data.type);
      } catch (err) {
        console.error('Wardrobe image upload failed, keeping base64 inline.', err);
        imageUrl = data.image;
      }
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

    try {
      const docRef = await db.collection(COLLECTION_NAME).add(payload);
      
      // Return the item with the new ID
      return {
        id: docRef.id,
        userId: user.uid,
        ...data,
        image: imageUrl ?? undefined,
        tagsNormalized,
        createdAt: new Date().toISOString() // Approximate for immediate UI update
      };
    } catch (error) {
      console.error("Wardrobe add error:", error);
      throw error;
    }
  },

  /**
   * Fetches all wardrobe items for the current authenticated user.
   */
  getWardrobeItemsForCurrentUser: async (): Promise<WardrobeItem[]> => {
    const user = auth.currentUser;
    if (!user) return [];

    try {
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
      return items.sort((a, b) => {
          const dateA = a.createdAt || '';
          const dateB = b.createdAt || '';
          return dateB.localeCompare(dateA);
      });
    } catch (error) {
      console.error("Wardrobe fetch error:", error);
      throw error;
    }
  },

  /**
   * Updates a specific wardrobe item.
   */
  updateWardrobeItem: async (id: string, updates: Partial<WardrobeItem>): Promise<void> => {
    const user = auth.currentUser;
    if (!user) throw new Error("Kullanıcı oturumu kapalı.");

    try {
      const docRef = db.collection(COLLECTION_NAME).doc(id);
      
      // Filter out undefined values from updates to avoid Firestore errors
      // and allow 'null' to clear values if passed explicitly
      const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
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
    } catch (error) {
      console.error("Wardrobe update error:", error);
      throw error;
    }
  },

  /**
   * Deletes a specific wardrobe item.
   */
  deleteWardrobeItem: async (id: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user) throw new Error("Kullanıcı oturumu kapalı.");

    try {
      await db.collection(COLLECTION_NAME).doc(id).delete();
    } catch (error) {
      console.error("Wardrobe delete error:", error);
      throw error;
    }
  }
};
