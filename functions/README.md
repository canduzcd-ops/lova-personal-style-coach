# Lova Push Notification Functions

Firebase Cloud Functions for handling push notifications.

## Setup

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Build TypeScript

```bash
npm run build
```

### 3. Run Emulator

```bash
npm run emulators
```

This starts:
- Firestore Emulator (http://localhost:8080)
- Functions Emulator (http://localhost:5001)
- Emulator UI (http://localhost:4000)

## Endpoints

### POST /sendTestPush

Send a test push notification to a user's enabled push tokens.

**URL**: `http://localhost:5001/lova-style-coach/us-central1/sendTestPush`

**Request Body**:
```json
{
  "userId": "user123",
  "title": "Test Notification",
  "body": "This is a test push notification"
}
```

**Response**:
```json
{
  "success": true,
  "sent": 1,
  "failed": 0,
  "skipped": 0,
  "notImplemented": 0,
  "errors": []
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:5001/lova-style-coach/us-central1/sendTestPush \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "title": "Welcome back!",
    "body": "Check out your new outfit suggestions"
  }'
```

### GET /health

Health check endpoint.

**URL**: `http://localhost:5001/lova-style-coach/us-central1/health`

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-10T12:00:00.000Z",
  "emulator": true
}
```

## Firestore Data Format

Tokens are queried from the `pushTokens` collection:

```
pushTokens/
  user123_ios/
    - userId: "user123"
    - token: "ExponentPushToken[...]"
    - platform: "ios"
    - isEnabled: true
    - createdAt: Timestamp
    - updatedAt: Timestamp
    - lastSeenAt: Timestamp
```

## Platform Support

- **Android**: ✅ Full FCM support (sendMulticast)
- **iOS**: 🚧 Stub only - APNs integration pending

## Logging

All operations are logged to Firebase Cloud Logging. Sensitive data (tokens) is never logged.

Example log entries:
```
Push send attempt {
  platform: "android",
  result: "success",
  tokenCount: 1
}
```

## Development

### Watch Mode

```bash
npm run build:watch
```

Then in another terminal:
```bash
npm run emulators
```

### Testing Locally

1. Start emulator: `npm run emulators`
2. Add test data to Firestore Emulator (via UI at http://localhost:4000)
3. Call endpoint with cURL or Postman
4. View logs in Emulator UI

## Environment Variables

Currently using placeholder configuration. To add:

- `FIREBASE_ADMIN_KEY_PATH`: Path to service account JSON (for production)
- `APNS_KEY_ID`: APNs key identifier (when iOS support added)
- `APNS_TEAM_ID`: Apple Team ID (when iOS support added)

## Troubleshooting

### Connection Refused
Ensure emulators are running: `npm run emulators`

### "No tokens found"
- Check Firestore has `pushTokens` collection with test data
- Verify `userId` matches and `isEnabled` is true
- Check Emulator UI (http://localhost:4000) for data

### Multicast Error
- Token format invalid? Check Emulator logs
- Token might be expired in production

## Next Steps

1. ✅ Basic setup + Android FCM
2. 🚧 iOS APNs integration
3. 🚧 Admin endpoint to manage token subscriptions
4. 🚧 Scheduled reminders (Cloud Tasks)
5. 🚧 Analytics tracking (on-delivery events)
