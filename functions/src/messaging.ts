import * as admin from 'firebase-admin';
import { PushToken, SendPushResponse } from './types';
import { logger } from 'firebase-functions';

/**
 * Safe logging helper - never log tokens or sensitive data
 */
function logPushAttempt(
  platform: string,
  result: 'success' | 'failed' | 'skipped' | 'not_implemented',
  details?: { error?: string; tokenCount?: number }
) {
  const safeLog = {
    platform,
    result,
    ...(details?.tokenCount && { tokenCount: details.tokenCount }),
    ...(details?.error && { error: details.error.substring(0, 100) }), // Truncate errors
  };
  logger.info('Push send attempt', safeLog);
}

/**
 * Send push notification via Firebase Cloud Messaging (Android)
 */
export async function sendAndroidPush(
  tokens: PushToken[]
): Promise<{ sent: number; failed: number; errors: string[] }> {
  if (tokens.length === 0) {
    logPushAttempt('android', 'skipped', { tokenCount: 0 });
    return { sent: 0, failed: 0, errors: [] };
  }

  const messaging = admin.messaging();
  const tokenStrings = tokens.map((t) => t.token);
  const errors: string[] = [];
  let sent = 0;
  let failed = 0;

  try {
    const response = await messaging.sendMulticast({
      tokens: tokenStrings,
      notification: {
        title: '', // Will be set by caller
        body: '', // Will be set by caller
      },
      data: {
        sentAt: new Date().toISOString(),
        platform: 'android',
      },
      android: {
        priority: 'high',
        ttl: 86400, // 24 hours
      },
    });

    sent = response.successCount;
    failed = response.failureCount;

    // Log failed token indices
    if (response.failureCount > 0) {
      response.responses.forEach((resp) => {
        if (!resp.success) {
          const error = resp.error?.message || 'Unknown error';
          errors.push(error);
        }
      });
    }

    logPushAttempt('android', 'success', { tokenCount: sent });
    return { sent, failed, errors };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logPushAttempt('android', 'failed', { error: errorMsg });
    return { sent: 0, failed: tokens.length, errors: [errorMsg] };
  }
}

/**
 * iOS push stub - APNs to be implemented next
 */
export async function sendIOSPush(
  tokens: PushToken[]
): Promise<{ sent: number; failed: number; errors: string[] }> {
  if (tokens.length === 0) {
    logPushAttempt('ios', 'skipped', { tokenCount: 0 });
    return { sent: 0, failed: 0, errors: [] };
  }

  // APNs implementation pending
  logPushAttempt('ios', 'not_implemented', { tokenCount: tokens.length });

  return {
    sent: 0,
    failed: tokens.length,
    errors: [
      'iOS push via APNs not yet implemented. Use /admin/apns-config to set up APNs certificate.',
    ],
  };
}

/**
 * Main push sender - routes to platform-specific handlers
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string
): Promise<SendPushResponse> {
  const db = admin.firestore();
  const response: SendPushResponse = {
    success: true,
    sent: 0,
    failed: 0,
    skipped: 0,
    notImplemented: 0,
    errors: [],
  };

  try {
    // Query enabled tokens for this user
    const snapshot = await db
      .collection('pushTokens')
      .where('userId', '==', userId)
      .where('isEnabled', '==', true)
      .get();

    if (snapshot.empty) {
      logger.info('No enabled push tokens found', { userId });
      response.skipped = 1;
      return response;
    }

    const tokens = snapshot.docs.map((doc) => doc.data() as PushToken);

    // Partition by platform
    const androidTokens = tokens.filter((t) => t.platform === 'android');
    const iosTokens = tokens.filter((t) => t.platform === 'ios');

    // Send to Android
    if (androidTokens.length > 0) {
      const messaging = admin.messaging();
      const androidTokenStrings = androidTokens.map((t) => t.token);

      const androidResponse = await messaging.sendMulticast({
        tokens: androidTokenStrings,
        notification: {
          title,
          body,
        },
        data: {
          sentAt: new Date().toISOString(),
          platform: 'android',
        },
        android: {
          priority: 'high',
          ttl: 86400, // 24 hours
        },
      });

      response.sent += androidResponse.successCount;
      response.failed += androidResponse.failureCount;

      if (androidResponse.failureCount > 0) {
        androidResponse.responses.forEach((resp) => {
          if (!resp.success && resp.error) {
            response.errors?.push({
              platform: 'android',
              error: resp.error.message,
            });
          }
        });
      }

      logger.info('Android push sent', {
        userId,
        successCount: androidResponse.successCount,
        failureCount: androidResponse.failureCount,
      });
    }

    // iOS stub (not implemented)
    if (iosTokens.length > 0) {
      response.notImplemented = iosTokens.length;
      response.errors?.push({
        platform: 'ios',
        error: 'iOS push via APNs not yet implemented',
      });
      logger.info('iOS push not implemented', {
        userId,
        tokenCount: iosTokens.length,
      });
    }

    response.success = response.failed === 0;
    return response;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error('Error sending push', { userId, error: errorMsg });

    response.success = false;
    response.failed = 1;
    response.errors?.push({
      platform: 'general',
      error: errorMsg,
    });

    return response;
  }
}
