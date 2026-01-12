# Social Login Implementation Plan & Setup Guide

**Date**: 10 Ocak 2026  
**Status**: MVP - Google Sign-In Web + Apple Sign-In iOS Stub  
**Owner**: Product Engineering

---

## Overview

This document outlines the social login implementation for LOVA, enabling Google and Apple authentication while maintaining backward compatibility with email/password auth.

**MVP Scope**: 
- ✅ Google Sign-In (Web via Firebase `signInWithPopup`)
- ✅ Apple Sign-In (iOS stub with "not yet supported" message)
- ✅ Automatic profile creation from social provider data
- ✅ Optional social buttons (no breaking changes to email auth)

---

## Architecture

### Firebase Authentication Flow

```
┌─────────────────────────────────────────────────────┐
│ AuthScreen.tsx                                      │
├─────────────────────────────────────────────────────┤
│ Email/Password Form (existing)                      │
│ + Google Button (new)                               │
│ + Apple Button (iOS only, new)                      │
└─────────────────────────────────────────────────────┘
         │
         ├─→ handleGoogleLogin()
         │       ↓
         │   authService.loginWithGoogle()
         │       ↓
         │   [Web]: auth.signInWithPopup(GoogleAuthProvider)
         │   [Native iOS/Android]: TODO - Capacitor GoogleSignIn plugin
         │       ↓
         │   Check/Create Firestore profile
         │       ↓
         │   setUserContext + track('auth_login_success')
         │       ↓
         │   onLogin(user)
         │
         └─→ handleAppleLogin()
                 ↓
             authService.loginWithApple()
                 ↓
             [iOS native]: TODO - Capacitor AppleSignIn plugin
             [Web/Android]: Error "Not supported"
                 ↓
             onLogin(user)
```

### Data Model

**outfitHistory** collection gains:
```typescript
export interface OutfitHistoryEntry {
  // ... existing fields
  isFavorite?: boolean;                          // NEW
  collectionTag?: 'work' | 'weekend' | 'date' | null;  // NEW
}
```

**users** collection remains unchanged:
```typescript
// Social login users get same profile structure
// displayName, email, photoURL from provider auto-populate name
{
  id: "uid",
  email: "user@example.com",
  name: "User Name",  // from provider displayName
  styles: ["minimal"],  // defaults to ["minimal"]
  joined_at: "2026-01-10T10:00:00Z",
  is_premium: false,
  // ... rest of profile
}
```

---

## Implementation Details

### 1. authService.ts Methods

#### loginWithGoogle()
```typescript
loginWithGoogle: async (): Promise<UserProfile> => {
  // On web: auth.signInWithPopup(new GoogleAuthProvider())
  // On native: throw "Not yet supported"
  // Handles profile creation via createDefaultProfileFallback()
  // Tracks: auth_login_success | auth_login_failed
}
```

**Platform Support**:
- ✅ Web: GoogleAuthProvider popup flow
- 🔄 Native (iOS/Android): Stub + error message (requires plugin)

#### loginWithApple()
```typescript
loginWithApple: async (): Promise<UserProfile> => {
  // iOS native only: auth.signInWithCredential(AppleAuthProvider.credential())
  // Web: Error "Only on iOS"
  // Stub implementation with clear error messaging
}
```

**Platform Support**:
- ✅ iOS native: Future implementation (requires @capacitor-community/apple-sign-in)
- ❌ Web: Error message
- ❌ Android: Error message

### 2. AuthScreen.tsx Components

**New Handlers**:
```typescript
const handleGoogleLogin = async () => {
  // Call authService.loginWithGoogle()
  // Catch errors → setError()
  // Success → onLogin(user)
}

const handleAppleLogin = async () => {
  // Call authService.loginWithApple()
  // Catch errors → setError()
  // Success → onLogin(user)
}
```

**New UI**:
```tsx
{(view === 'login' || view === 'register') && (
  <>
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-white/20" />
      <span className="text-[10px] font-bold uppercase text-secondary/60 px-2">ya da</span>
      <div className="flex-1 h-px bg-white/20" />
    </div>

    <div className="space-y-2">
      {/* Google - Always available */}
      <button onClick={handleGoogleLogin} className="...">
        <Chrome size={16} /> Google ile Giriş Yap
      </button>

      {/* Apple - iOS only */}
      {Capacitor.getPlatform() === 'ios' && (
        <button onClick={handleAppleLogin} className="...">
          <Apple size={16} /> Apple ile Giriş Yap
        </button>
      )}
    </div>
  </>
)}
```

**Features**:
- Shows on both "Login" and "Register" views
- Google button always visible (web works, native shows stub error)
- Apple button iOS-only (platform detection via Capacitor)
- Disabled during loading state
- Platform-aware error messages

### 3. Profile Creation

When social login succeeds, if user doesn't exist in Firestore:

```typescript
await authService.createDefaultProfileFallback(user, { source: 'google' })
// Creates profile with:
{
  name: user.displayName || user.email.split('@')[0],
  email: user.email,
  styles: ['minimal'],  // Default style preference
  joined_at: now,
  is_premium: false,
  // ... other defaults
}
```

---

## Firebase Console Setup

### 1. Enable Google Sign-In

1. Go to **Firebase Console** → Project Settings → Authentication
2. Click **Sign-In Method** tab
3. Enable **Google** provider
4. Configure OAuth Consent Screen (Google Cloud Console):
   - Authorized domains: Add your web domain (e.g., `lova.example.com`)
   - Add scopes: `email`, `profile`
5. Get **Web Client ID** from Firebase config

### 2. Enable Apple Sign-In (Future)

1. **Apple Developer Account Required** (paid)
2. In **Firebase Console**:
   - Enable **Apple** provider
   - Add `com.lova.app` as Bundle ID
   - Link Apple Developer account
3. In **Apple Developer Portal**:
   - Create Service ID for LOVA
   - Enable "Sign in with Apple"
   - Configure return URLs: `https://lova.example.com/__/auth/handler`

### 3. Web Domain Configuration

In **Firebase Console** → Authentication → Settings:
1. Add authorized domains:
   - `localhost`
   - `lova.example.com` (production)
   - Any custom domains

### 4. Security Rules for users Collection

Rules already support social login users:
```firestore
match /users/{userId} {
  allow create: if request.auth.uid == userId;
  allow read: if request.auth.uid == userId;
  allow update: if request.auth.uid == userId;
  allow delete: if request.auth.uid == userId;
}
```

---

## Testing Checklist

### Local Development (Web)

- [ ] Open http://localhost:5173
- [ ] Click "Google ile Giriş Yap"
- [ ] Popup opens → Select Google account
- [ ] Redirects to Dashboard (new user auto-created)
- [ ] Check Firestore: new `users/{uid}` document created
- [ ] Logout → Login again with same account (loads existing profile)

### Native Testing (iOS)

- [ ] Run `npm run build` + build iOS app
- [ ] Click "Google ile Giriş Yap" → Shows stub error message
- [ ] Click "Apple ile Giriş Yap" → Shows stub error message
- [ ] Email/password auth still works

### Native Testing (Android)

- [ ] Run `npm run build` + build Android app
- [ ] Click "Google ile Giriş Yap" → Shows stub error message (no Apple button shown)
- [ ] Email/password auth still works

---

## Future Work (Sprints 2-3)

### Native Google Sign-In (Sprint 2)
```bash
npm install @capacitor-community/google-signin
npm install @react-oauth/google
```

**Implementation**:
1. Install plugin + configure with Firebase Web Client ID
2. Replace `auth.signInWithPopup()` with plugin
3. Test on Android device

**Estimated Time**: 2-3 hours

### Native Apple Sign-In (Sprint 2)
```bash
npm install @capacitor-community/apple-sign-in
```

**Implementation**:
1. Install plugin
2. Configure Bundle ID + Apple Developer account
3. Exchange credential for Firebase token
4. Replace stub with real flow
5. Test on iOS device

**Estimated Time**: 3-4 hours

### Email Link Sign-In (Sprint 3) - Optional
- Passwordless auth for users without provider access
- Useful for marketing emails: "Click to login"

---

## Error Handling

### Google Sign-In Errors

| Error Code | Message | Solution |
|----------|---------|----------|
| `auth/popup-closed-by-user` | User closed popup | Try again |
| `auth/popup-blocked` | Browser blocked popup | Allow popups in settings |
| `auth/network-request-failed` | Network error | Check connection |
| `auth/invalid-credential` | Bad credential | Sign out + try again |

### Apple Sign-In Errors

| Scenario | Message | Solution |
|----------|---------|----------|
| Web/Android | "Apple Sign-In yalnızca iOS uygulamasında desteklenir" | Use Google or email |
| iOS stub | "Native Apple Sign-In bu sürümde henüz desteklenmiyor" | Wait for plugin implementation |

---

## Backward Compatibility

✅ **Email/Password Auth**:
- No changes to existing flows
- Works alongside social login
- `login()`, `register()`, `resetPassword()` unchanged

✅ **Existing Users**:
- Can still login with email/password
- Can add social login to existing account (future feature)

✅ **Profile Data**:
- Same Firestore schema for all users
- Social users auto-populate `name` from provider
- `styles` defaults to `['minimal']` for social users

---

## Metrics to Track

**Telemetry Events** (already in telemetry.ts):
- `auth_login_success` — Tracks all logins (email + social)
- `auth_login_failed` — Tracks failed logins with error code

**Future Enhancements**:
```typescript
// Could add specific tracking:
track('social_login_google_start');
track('social_login_google_success');
track('social_login_apple_start');
track('social_login_apple_success');
```

**Analytics Goals** (6 months):
- Measure % of new signups via social vs email
- Compare D1 retention: social vs email users
- Track social login error rates

---

## Security Considerations

### 1. Token Management
- Firebase handles token refresh automatically
- Tokens stored securely in auth state
- Push tokens persisted separately in Firestore (already implemented)

### 2. Account Linking
- Current MVP: Social account = new account
- Future: Link multiple providers to same account
- Requires UID merge logic in Firestore

### 3. Profile Data Privacy
- Social providers share: `displayName`, `email`, `photoURL`
- We don't request: location, contacts, calendar, etc.
- Firestore rules enforce user-only access

### 4. Suspicious Activity
- Firebase Cloud Functions can detect:
  - Multiple accounts from same email
  - Rapid registration attempts
  - Unusual provider activity
- Alert via Sentry if needed

---

## File Changes Summary

| File | Change |
|------|--------|
| `services/authService.ts` | Added `loginWithGoogle()`, `loginWithApple()` |
| `screens/AuthScreen.tsx` | Added Google/Apple buttons, handlers, platform detection |
| `screens/AuthScreen.js` | JS variant (auto-generated) |
| `firebaseClient.ts` | No changes needed (uses existing auth instance) |
| `types.ts` | No changes needed (OutfitHistory changes from previous task) |

**No Breaking Changes**:
- Email/password flows untouched
- Existing users unaffected
- All new code is opt-in

---

## Commands

```bash
# Test build
npm run build

# Run tests (existing pass, new code tested manually)
npm run test:run

# Local dev (Google popup works on localhost)
npm run dev

# Native build (stub messages shown until plugin installed)
npx cap build ios
npx cap build android
```

---

## Rollback Plan

If social login causes issues:

1. **Disable in UI**: Comment out social buttons in AuthScreen.tsx
2. **Keep service methods**: Leave `loginWithGoogle()` + `loginWithApple()` (stubs for future)
3. **Revert commit**: `git revert <commit-hash>`
4. **Redeploy**: `npm run build` + deploy to Firebase Hosting

Users unaffected — email/password auth always works.

---

## Appendix: OAuth Scopes

### Google
- `email` — User's email
- `profile` — User's display name + photo

### Apple
- `email` — User's email (optional, hidden by default)
- `fullName` — First + last name (optional)

Both providers respect user privacy — we request minimal scopes.

---

**Next Steps**:
1. ✅ Enable Google in Firebase Console
2. ✅ Deploy web version with Google button
3. ⏳ (Sprint 2) Install native plugins + remove stubs
4. ⏳ (Sprint 2) Test on iOS/Android devices
5. ⏳ (Sprint 3) Add email link sign-in (optional)

---

**Questions?** Check Firebase docs:
- https://firebase.google.com/docs/auth/web/google-signin
- https://firebase.google.com/docs/auth/ios/apple
- https://capacitorjs.com/community/plugins
