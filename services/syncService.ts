/**
 * syncService.ts
 * 
 * Background synchronization service for offline changes.
 * Processes pending changes queue when the device comes back online.
 */

import { db } from './firebaseClient';
import { cacheService, CACHE_KEYS, PendingChange } from './cacheService';
import firebase from 'firebase/compat/app';

/**
 * Syncs all pending changes to Firestore.
 * Returns the number of successfully synced changes.
 */
export async function syncAll(): Promise<number> {
  const pendingChanges = await cacheService.getPendingChanges();
  
  if (pendingChanges.length === 0) {
    console.log('[Sync] No pending changes to sync');
    return 0;
  }

  console.log(`[Sync] Starting sync for ${pendingChanges.length} pending changes`);
  
  let successCount = 0;
  const failedChanges: PendingChange[] = [];

  for (const change of pendingChanges) {
    try {
      await syncChange(change);
      successCount++;
      console.log(`[Sync] Successfully synced ${change.type} for ${change.collection}/${change.docId || 'new'}`);
    } catch (error) {
      console.error(`[Sync] Failed to sync ${change.type} for ${change.collection}/${change.docId}:`, error);
      failedChanges.push(change);
    }
  }

  // Update pending changes - keep only failed ones
  await cacheService.set(CACHE_KEYS.PENDING_CHANGES, failedChanges);
  
  console.log(`[Sync] Completed: ${successCount} succeeded, ${failedChanges.length} failed`);
  
  return successCount;
}

/**
 * Syncs a single pending change to Firestore.
 */
async function syncChange(change: PendingChange): Promise<void> {
  const { type, collection, docId, data } = change;

  switch (type) {
    case 'create':
      if (!data) throw new Error('Create operation requires data');
      
      // For create operations, we need to handle the case where the doc might already exist
      // (if it was created offline and synced partially)
      if (docId) {
        await db.collection(collection).doc(docId).set(data, { merge: true });
      } else {
        await db.collection(collection).add({
          ...data,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      break;

    case 'update':
      if (!docId) throw new Error('Update operation requires docId');
      if (!data) throw new Error('Update operation requires data');
      
      await db.collection(collection).doc(docId).update({
        ...data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      break;

    case 'delete':
      if (!docId) throw new Error('Delete operation requires docId');
      await db.collection(collection).doc(docId).delete();
      break;

    default:
      throw new Error(`Unknown change type: ${type}`);
  }
}

/**
 * Checks if there are any pending changes.
 */
export async function hasPendingChanges(): Promise<boolean> {
  const pendingChanges = await cacheService.getPendingChanges();
  return pendingChanges.length > 0;
}

/**
 * Clears all pending changes.
 * Use with caution - only when you're sure changes are synced or should be discarded.
 */
export async function clearPendingChanges(): Promise<void> {
  await cacheService.set(CACHE_KEYS.PENDING_CHANGES, []);
  console.log('[Sync] Cleared all pending changes');
}

export const syncService = {
  syncAll,
  hasPendingChanges,
  clearPendingChanges
};
