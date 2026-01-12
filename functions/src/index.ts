import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { SendPushRequest, SendPushResponse } from './types';
import { sendPushToUser } from './messaging';
import { logger } from 'firebase-functions';

// Initialize Firebase Admin SDK
// In emulator, this will connect to local Firebase instance
const isEmulator = process.env.FIRESTORE_EMULATOR_HOST !== undefined;
if (isEmulator) {
  logger.info('Firebase Functions running in emulator mode');
}

// Only initialize if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * HTTP endpoint to send test push notifications
 * POST /sendTestPush
 * Body: { userId: string, title: string, body: string }
 *
 * Response:
 * {
 *   "success": boolean,
 *   "sent": number,
 *   "failed": number,
 *   "skipped": number,
 *   "notImplemented": number,
 *   "errors": [{ platform: string, error: string }]
 * }
 */
export const sendTestPush = functions.https.onRequest(
  async (req, res): Promise<void> => {
    // Only allow POST
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed. Use POST.' });
      return;
    }

    // Validate request body
    const { userId, title, body } = req.body as Partial<SendPushRequest>;

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      res.status(400).json({ error: 'Missing or invalid userId' });
      return;
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
      res.status(400).json({ error: 'Missing or invalid title' });
      return;
    }

    if (!body || typeof body !== 'string' || body.trim() === '') {
      res.status(400).json({ error: 'Missing or invalid body' });
      return;
    }

    // Limit message sizes
    if (title.length > 200) {
      res.status(400).json({ error: 'Title too long (max 200 chars)' });
      return;
    }

    if (body.length > 4000) {
      res.status(400).json({ error: 'Body too long (max 4000 chars)' });
      return;
    }

    logger.info('sendTestPush endpoint called', {
      userId,
      titleLength: title.length,
      bodyLength: body.length,
    });

    try {
      const response = await sendPushToUser(userId, title, body);
      res.status(200).json(response);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error('sendTestPush error', { userId, error: errorMsg });

      const response: SendPushResponse = {
        success: false,
        sent: 0,
        failed: 1,
        skipped: 0,
        notImplemented: 0,
        errors: [{ platform: 'server', error: errorMsg }],
      };

      res.status(500).json(response);
    }
  }
);

/**
 * Health check endpoint
 */
export const health = functions.https.onRequest(async (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    emulator: isEmulator,
  });
});
