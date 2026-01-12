import { auth, db } from './firebaseClient';
import { captureError, track } from './telemetry';
import firebase from 'firebase/compat/app';
/**
 * Generate deterministic document ID for push token
 * Format: ${uid}_${platform}
 */
export function getDocId(uid, platform) {
    return `${uid}_${platform}`;
}
/**
 * Upsert (insert or update) a push token to Firestore
 * If currentUser is not authenticated, silently returns (native edge case)
 */
export async function upsertToken(params) {
    const { token, platform, deviceId } = params;
    // Validate platform
    if (!['ios', 'android'].includes(platform)) {
        throw new Error(`Invalid platform: ${platform}`);
    }
    // Check if user is authenticated
    const currentUser = auth.currentUser;
    if (!currentUser) {
        console.warn('pushTokenService: No current user, skipping token upsert');
        return;
    }
    try {
        const docId = getDocId(currentUser.uid, platform);
        const docRef = db.collection('pushTokens').doc(docId);
        const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp();
        // Get existing doc to check if it's a new write
        const existingDoc = await docRef.get();
        // Prepare data for upsert
        const data = {
            userId: currentUser.uid,
            token,
            platform,
            deviceId: deviceId || null,
            isEnabled: true,
            updatedAt: serverTimestamp,
            lastSeenAt: serverTimestamp,
        };
        // Only set createdAt on first write
        if (!existingDoc.exists) {
            data.createdAt = serverTimestamp;
        }
        // Merge-true upsert
        await docRef.set(data, { merge: true });
        track('push_token_upsert_success', {
            platform,
            isNewToken: !existingDoc.exists,
        });
    }
    catch (err) {
        captureError('push_token_upsert_failed', { error: err });
        track('push_token_upsert_failed', {
            platform,
            reason: String(err),
        });
        throw err;
    }
}
/**
 * Disable a push token by setting isEnabled=false
 * If currentUser is not authenticated or doc doesn't exist, silently returns
 */
export async function disableToken(params) {
    const { platform } = params;
    // Validate platform
    if (!['ios', 'android'].includes(platform)) {
        throw new Error(`Invalid platform: ${platform}`);
    }
    // Check if user is authenticated
    const currentUser = auth.currentUser;
    if (!currentUser) {
        console.warn('pushTokenService: No current user, skipping token disable');
        return;
    }
    try {
        const docId = getDocId(currentUser.uid, platform);
        const docRef = db.collection('pushTokens').doc(docId);
        // Check if doc exists before updating
        const existingDoc = await docRef.get();
        if (!existingDoc.exists) {
            console.warn(`pushTokenService: Token doc does not exist for ${platform}`);
            return;
        }
        const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp();
        await docRef.update({
            isEnabled: false,
            updatedAt: serverTimestamp,
        });
        track('push_token_disable_success', { platform });
    }
    catch (err) {
        // Swallow error on logout (don't throw)
        console.warn('pushTokenService: Error disabling token', err);
        track('push_token_disable_failed', {
            platform,
            reason: String(err),
        });
    }
}
