import { db } from './firebaseClient';
import firebase from 'firebase/compat/app';
import { OutfitHistoryEntry } from '../types';

const COLLECTION = 'outfitHistory';

export const outfitHistoryService = {
  async addOutfit(userId: string, payload: { outfit: any; weather?: any; source?: string; liked?: boolean | null }) {
    const docRef = await db.collection(COLLECTION).add({
      userId,
      outfit: payload.outfit,
      weather: payload.weather ?? null,
      source: payload.source ?? null,
      liked: payload.liked ?? null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return docRef.id;
  },

  async listOutfits(userId: string, limit = 30): Promise<OutfitHistoryEntry[]> {
    const snapshot = await db
      .collection(COLLECTION)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
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
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        feedbackAt: data.feedbackAt?.toDate ? data.feedbackAt.toDate().toISOString() : data.feedbackAt,
      });
    });
    return items;
  },

  async setFeedback(docId: string, userId: string, liked: boolean): Promise<void> {
    const ref = db.collection(COLLECTION).doc(docId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('Kayıt bulunamadı');
    const data = snap.data();
    if (data?.userId !== userId) throw new Error('Yetkisiz işlem');

    await ref.update({
      liked,
      feedbackAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  },
};
