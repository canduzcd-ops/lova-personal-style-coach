# Firebase Functions Setup & Testing Guide

## Quick Start

### 1. First Time Setup

```bash
cd functions
npm install
npm run build
```

### 2. Start Emulator Suite

```bash
npm run emulators
```

**Output:**
```
i  emulators: Starting emulators...
i  firestore: Listening on 127.0.0.1:8080
i  functions: Listening on 127.0.0.1:5001
i  Emulator UI is running on http://localhost:4000
```

### 3. View Emulator UI

Open http://localhost:4000 in your browser:
- Firestore tab: View/edit test data
- Functions tab: View logs
- Logs tab: Real-time function logs

---

## Testing the sendTestPush Endpoint

### Option A: cURL (Recommended)

```bash
curl -X POST http://localhost:5001/lova-style-coach/us-central1/sendTestPush \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-001",
    "title": "Welcome to Lova!",
    "body": "Your personal style coach is ready"
  }'
```

**Success Response (200):**
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

**No tokens found (200):**
```json
{
  "success": true,
  "sent": 0,
  "failed": 0,
  "skipped": 1,
  "notImplemented": 0,
  "errors": []
}
```

### Option B: Postman

1. **Method:** POST
2. **URL:** `http://localhost:5001/lova-style-coach/us-central1/sendTestPush`
3. **Headers:** 
   ```
   Content-Type: application/json
   ```
4. **Body (raw JSON):**
   ```json
   {
     "userId": "test-user-001",
     "title": "Test Title",
     "body": "Test message body"
   }
   ```
5. **Send** → Check response

### Option C: Browser DevTools

```javascript
fetch('http://localhost:5001/lova-style-coach/us-central1/sendTestPush', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'test-user-001',
    title: 'Test Push',
    body: 'Testing from browser console'
  })
}).then(r => r.json()).then(console.log)
```

---

## Test Data Setup

### Add Test User with Push Tokens

1. Open Emulator UI: http://localhost:4000
2. Go to **Firestore** tab
3. Click **Create Collection**: `pushTokens`
4. Click **Create Document**: `test-user-001_android`
5. Set fields:

```json
{
  "userId": "test-user-001",
  "token": "ExponentPushToken[test-token-android-12345]",
  "platform": "android",
  "deviceId": "device-123",
  "isEnabled": true,
  "createdAt": (Auto-generate - timestamp)
  "updatedAt": (Auto-generate - timestamp)
  "lastSeenAt": (Auto-generate - timestamp)
}
```

### Test with Multiple Tokens (Android + iOS)

Create two documents:

**Document 1: `test-user-002_android`**
```json
{
  "userId": "test-user-002",
  "token": "ExponentPushToken[android-token-xyz]",
  "platform": "android",
  "isEnabled": true
}
```

**Document 2: `test-user-002_ios`**
```json
{
  "userId": "test-user-002",
  "token": "ExponentPushToken[ios-token-abc]",
  "platform": "ios",
  "isEnabled": true
}
```

Then call endpoint:
```bash
curl -X POST http://localhost:5001/lova-style-coach/us-central1/sendTestPush \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-002",
    "title": "Multi-platform test",
    "body": "Android will succeed, iOS will show not implemented"
  }'
```

**Response:**
```json
{
  "success": false,
  "sent": 1,
  "failed": 1,
  "skipped": 0,
  "notImplemented": 1,
  "errors": [
    {
      "platform": "ios",
      "error": "iOS push via APNs not yet implemented"
    }
  ]
}
```

---

## Validation Checklist

- [ ] `npm run build` compiles with no errors
- [ ] Emulator starts: `npm run emulators`
- [ ] Health endpoint responds: `curl http://localhost:5001/lova-style-coach/us-central1/health`
- [ ] Firestore Emulator UI loads: http://localhost:4000
- [ ] Can create pushTokens collection in Emulator
- [ ] sendTestPush endpoint returns 400 for missing userId
- [ ] sendTestPush endpoint returns 200 for valid request
- [ ] Logs appear in Emulator UI Functions tab
- [ ] Android tokens are queried correctly
- [ ] iOS tokens show "not_implemented"

---

## Debugging

### View Live Logs

In Emulator UI → **Logs** tab, you'll see:

```
Push send attempt {
  "platform": "android",
  "result": "success",
  "tokenCount": 1
}

Android push sent {
  "userId": "test-user-001",
  "successCount": 1,
  "failureCount": 0
}
```

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "No tokens found" | pushTokens collection empty | Add test documents (see above) |
| "Method not allowed" | Using GET instead of POST | Use POST method |
| Connection refused | Emulator not running | Run `npm run emulators` |
| CORS error | Browser request blocked | Use cURL or Postman instead |
| Timestamp errors | Invalid field format | Use Emulator UI to set timestamps auto |

---

## Next Steps

1. **iOS APNs Integration** (Prompt P2-3.3)
   - Add APNs certificate configuration
   - Implement sendIOSPush() in messaging.ts

2. **Admin Endpoints** (Future)
   - GET /admin/tokens/:userId - List user's tokens
   - DELETE /admin/tokens/:tokenId - Revoke token
   - POST /admin/push - Send with authentication

3. **Scheduled Functions** (Future)
   - Dormant user nudge reminders
   - Daily digest compilations

4. **Analytics** (Future)
   - Track delivery events
   - Monitor failure rates
   - Segment by platform

---

## Production Deployment

When ready to deploy to Firebase:

```bash
npm run build
firebase deploy --only functions
```

Requires:
- Service account credentials
- APNs certificate (for iOS)
- Firebase project with Functions enabled
- Firestore database in production mode
