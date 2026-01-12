# IAP "Product Not Loaded" Debugging Guide

## Latest Changes
- ✅ Added `com.android.vending.BILLING` permission to `AndroidManifest.xml`
- ✅ Added 16+ console.log points to `iapService.init()`
- ✅ Added detailed logging to `getPlans()` function
- ✅ Added detailed logging to `purchase()` function

## Logging Output to Check

After running the app with these changes, check browser DevTools Console and Logcat:

### 1. **Initialization Logs**
```
[IAP] init başladı. Platform: android
[IAP] Store mevcut. Store API: [list of store methods]
[IAP] Android: Registering subscription lova_premium
[IAP] Android: Registering baseplan monthly
[IAP] Android: Registering baseplan yearly
[IAP] store.ready() callback tetiklendi.
[IAP] init tamamlandı. _inited = true
```

### 2. **getPlans() Logs**
```
[IAP] getPlans başladı. Platform: android
[IAP] getPlans: Android. subscriptionId = lova_premium
[IAP] getPlans: Android product: { id: 'lova_premium', state: 'owned'|'valid', offersCount: 2 }
[IAP] getPlans: Android offers: 2 items
  [Offer 0]: { id: 'monthly', basePlanId: 'monthly' }
  [Offer 1]: { id: 'yearly', basePlanId: 'yearly' }
```

### 3. **purchase() Logs**
```
[IAP] purchase başladı. Platform: android Plan: monthly
[IAP] purchase: Android product check: { found: true, id: 'lova_premium' }
[IAP] purchase: Looking for plan: monthly in 2 offers
[IAP] purchase: targetOffer (offerLooksLikePlan): true lova_premium/basePlanId:monthly
[IAP] purchase: Calling store.order() with offer: true
[IAP] purchase: After refresh, entitlement: { isPremium: true, activePlan: 'monthly' }
```

## Root Cause Analysis

If you see `[IAP] getPlans: Android product: null`, the issue is in **registration**:

### Problem 1: Store Not Available
**Symptom:** 
```
[IAP] Store bulunamadı...
[IAP] init başladı. Platform: android
```
**Cause:** `window.CdvPurchase.store` is undefined  
**Fix:**  
- Check `cordova.js` is loaded before app init
- Add manual delay: `await new Promise(r => setTimeout(r, 1000))` before init()

### Problem 2: Missing BILLING Permission
**Symptom:** 
```
[IAP] Android: Registering subscription lova_premium
[IAP] getPlans: Android product: null
```
**Cause:** Play Billing library blocked by missing permission  
**Fix:** ✅ ALREADY DONE - Added to AndroidManifest.xml
```xml
<uses-permission android:name="com.android.vending.BILLING" />
```

### Problem 3: Product ID Not in Play Console
**Symptom:**  
```
[IAP] Android product: { id: 'lova_premium', state: 'invalid' }
```
**Cause:** Subscription doesn't exist in Google Play Console  
**Fix:** 
1. Go to [Google Play Console](https://play.google.com/console)
2. Select "TheLova" app
3. Left menu → Monetization setup → Subscriptions
4. Verify `lova_premium` subscription exists and state is **"Active"**
5. Verify base plans exist: `monthly`, `yearly`

### Problem 4: Empty BILLING_KEY
**Symptom:** 
```
[IAP] Android: Registering subscription lova_premium
[IAP] product updated event
[IAP] getPlans: Android product: null
```
**Cause:** `capacitor.config.ts` BILLING_KEY is placeholder  
**Fix:**  
1. Go to Play Console → Settings → Setup → Licensing
2. Copy "Base64-encoded public key"
3. Update `capacitor.config.ts`:
```typescript
cordova: {
  preferences: {
    BILLING_KEY: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...',
  },
},
```

### Problem 5: Billing Client Not Connected
**Symptom:** 
```
[IAP] Android: Registering subscription lova_premium
(Long delay or timeout)
[IAP] getPlans: Android product: null
```
**Cause:** `billingclient` failed to connect to Play Services  
**Fix:**  
- Check `android/app/build.gradle` has:
  ```gradle
  implementation 'com.android.billingclient:billing:6.1.0'
  ```
- Run full rebuild: `npx cap sync android && cd android && ./gradlew clean build`

## Testing Steps

### 1. Test Initialization
```typescript
// In browser console
await window.iapService?.init?.()
console.log('[TEST] Store available:', !!window.CdvPurchase?.store)
console.log('[TEST] Product:', window.CdvPurchase?.store?.get?.('lova_premium'))
```

### 2. Test getPlans()
```typescript
const plans = await window.iapService?.getPlans?.()
console.log('[TEST] Plans:', plans)
// Should return: [{ id: 'monthly', price: {...} }, { id: 'yearly', price: {...} }]
```

### 3. Test Purchase Flow
```typescript
try {
  const ent = await window.iapService?.purchase?.('monthly')
  console.log('[TEST] Purchase result:', ent)
} catch (e) {
  console.error('[TEST] Purchase error:', e.message)
}
```

## Debugging Tools

### Android Logcat
```bash
npx cap run android
# Or in Android Studio: Logcat filter
adb logcat | grep -i "billing\|iap\|purchase"
```

### Browser DevTools
```
Open: chrome://inspect/#devices
Select device → Open DevTools
Console tab → Check [IAP] logs
```

### Play Console Test Setup
1. Go to [Play Console](https://play.google.com/console)
2. App → Setup → License testing
3. Add your Google account to "License testers"
4. Add test subscription:
   - Settings → License testing → Managed products
   - Create test subscription ID (e.g., `lova_premium_test`)

## Checklist for Production

- [ ] ✅ `BILLING_KEY` filled with real RSA key
- [ ] ✅ Android permission `com.android.vending.BILLING` added
- [ ] ✅ Subscription `lova_premium` created in Play Console
- [ ] ✅ Base plans `monthly`, `yearly` added
- [ ] ✅ Subscription state set to "Active"
- [ ] ✅ App signed with release keystore
- [ ] [ ] Backend receipt verification implemented (Cloud Functions)
- [ ] [ ] Premium state synced to Firestore
- [ ] [ ] Test purchase flow with Test subscription
- [ ] [ ] Test restore on new device
- [ ] [ ] Test APK on real device

## File Reference

| File | Purpose | Status |
|------|---------|--------|
| `services/iapService.ts` | Core IAP logic | ✅ Logging added |
| `capacitor.config.ts` | BILLING_KEY config | ⚠️ Needs real key |
| `android/app/src/main/AndroidManifest.xml` | Permissions | ✅ BILLING added |
| `screens/PremiumScreen.tsx` | Premium UI | Can add error recovery |
| `android/app/build.gradle` | Billing library | ✅ Dependency present |

## Next Actions

1. **Fill BILLING_KEY** in `capacitor.config.ts` with actual Play Console RSA key
2. **Verify Play Console Setup:**
   - Subscription `lova_premium` exists and Active
   - Base plans `monthly`, `yearly` exist
3. **Test Build:** `npx cap sync android && cd android && ./gradlew build`
4. **Monitor Logs:** Check console during init/getPlans/purchase
5. **Implement Backend Verification:** Cloud Functions to validate receipts
6. **Add Error Recovery:** Retry logic in PremiumScreen useEffect

## Related Issues

- iOS Firebase plist still needed
- Backend receipt verification not implemented (P1 blocker)
- Premium state not synced to Firestore (requires authService update)
