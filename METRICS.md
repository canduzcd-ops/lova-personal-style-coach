# LOVA METRICS & FUNNEL TRACKING

## Overview

This document maps the user journey through key funnel steps, tracking telemetry events at each stage. All events are whitelisted in `services/telemetry.ts` and captured via Sentry breadcrumbs.

---

## FUNNEL DEFINITION

### 1. INTRO_COMPLETE

**Event**: `onboarding_shown`

**Triggered In**: `screens/IntroScreen.tsx` — When onboarding modal is displayed

**Purpose**: Track awareness of app benefits

**Expected Props**:
| Prop | Type | Example | Required |
|------|------|---------|----------|
| (none) | — | — | — |

**Success Criteria**: User sees introductory benefits modal

**Next Step**: → AUTH_SUCCESS (after login)

---

### 2. AUTH_SUCCESS

**Event**: `auth_login_success` OR `auth_register_success`

**Triggered In**: `services/authService.ts` — After successful Firebase auth completion

**Purpose**: Track acquisition and account creation

**Expected Props**:
| Prop | Type | Example | Required |
|------|------|---------|----------|
| `hasUser` | boolean | `true` | ✅ Yes |
| `errorCode` | string | `"SOCIAL_LOGIN"` | No |

**Success Criteria**: User authenticated with Firebase, profile created

**Next Step**: → FIRST_WARDROBE_ADD (after first item uploaded)

---

### 3. FIRST_WARDROBE_ADD

**Event**: `wardrobe_add_success`

**Triggered In**: `screens/WardrobeScreen.tsx` — After first successful image/clothing item added to wardrobe

**Purpose**: Track activation (user invests in app by adding items)

**Expected Props**:
| Prop | Type | Example | Required |
|------|------|---------|----------|
| `hasImage` | boolean | `true` | ✅ Yes |
| `reason` | string | `"camera"` OR `"upload"` | No |
| `durationMs` | number | `2341` | No |

**Success Criteria**: Wardrobe contains ≥1 item, image stored in Firestore

**Engagement Trigger**: First item added → `maybeNotify('wardrobe_first_item_added')` with 24h cooldown

**Next Step**: → FIRST_GENERATE_SUCCESS (after generating first outfit)

---

### 4. FIRST_GENERATE_SUCCESS

**Event**: `ai_generate_success`

**Triggered In**: `screens/Dashboard.tsx` — After successful outfit generation from AI

**Purpose**: Track core feature engagement (user gets value)

**Expected Props**:
| Prop | Type | Example | Required |
|------|------|---------|----------|
| `modelVersion` | string | `"gemini-1.5-pro"` | No |
| `durationMs` | number | `3200` | No |

**Success Criteria**: Outfit generated, returned to Dashboard, displayed in history

**Engagement Trigger**: Outfit generated → `maybeNotify('outfit_generated_success')` with 2s delay + 6h cooldown

**Notes**:
- Free tier: 5 free generates per subscription period
- Generate #6+ triggers premium paywall (soft wall, not hard block)

**Next Step**: → PREMIUM_OPENED (if user attempts generate #6+)

---

### 5. PREMIUM_OPENED

**Event**: `premium_opened`

**Triggered In**: `screens/PremiumScreen.tsx` — When premium features modal/screen opened

**Purpose**: Track monetization funnel entry (user aware of upgrade)

**Expected Props**:
| Prop | Type | Example | Required |
|------|------|---------|----------|
| `source` | string | `"soft_wall"` OR `"settings"` | No |

**Success Criteria**: Premium screen rendered, user sees pricing + features

**Funnel Conversion**: ~3% of premium_opened → purchase_start (click "Buy")

**Next Step**: → PURCHASE_START (if user taps "Buy")

---

### 6. PURCHASE_START

**Event**: `premium_purchase_start`

**Triggered In**: `services/iapService.ts` — When purchase flow initiated (native IAP dialog opened)

**Purpose**: Track purchase intent (highest engagement signal)

**Expected Props**:
| Prop | Type | Example | Required |
|------|------|---------|----------|
| `source` | string | `"premium_screen"` | No |
| `plan` | string | `"monthly"` OR `"yearly"` OR `"lifetime"` | No |

**Success Criteria**: IAP dialog shown, waiting for user confirmation

**Funnel Conversion**: ~20% of purchase_start → purchase_success (payment confirmed)

**Failure Cases**:
- `premium_purchase_failed` — Payment failed, retry prompted
- `premium_restore_start` / `premium_restore_success` — Restore previous purchase

**Final Step**: → Subscription Active

---

## FULL FUNNEL FUNNEL (HYPOTHESIS)

```
1,000 DAU (Hypothesis)
   ↓ 95% (onboarding_shown)
950 Intro Shown
   ↓ 85% (auth_login_success OR auth_register_success)
807 Auth Complete
   ↓ 60% (wardrobe_add_success)
484 First Item Added [ACTIVATION]
   ↓ 25% (ai_generate_success)
121 First Outfit Generated [ENGAGEMENT]
   ↓ 3% (premium_opened, from soft wall)
3.6 Premium Screen Shown
   ↓ 20% (premium_purchase_start)
0.72 Purchase Started
   ↓ 100% (premium_purchase_success)
0.72 Premium Purchased ❌ TOO LOW
   
FIX: Add social login + trial
   ↓ Updated conversion rates
Premium Purchased: 50+ (70x improvement)
```

---

## EVENT CATALOG (FULL REFERENCE)

### Authentication

| Event | File | Trigger | Props |
|-------|------|---------|-------|
| `auth_login_success` | authService.ts | Firebase auth resolved | `hasUser` |
| `auth_login_failed` | authService.ts | Firebase auth failed | `error`, `errorCode` |
| `auth_register_success` | authService.ts | New account created | `hasUser` |
| `auth_register_failed` | authService.ts | Registration failed | `error`, `errorCode` |

### Onboarding

| Event | File | Trigger | Props |
|-------|------|---------|-------|
| `onboarding_shown` | IntroScreen.tsx | Benefits modal displayed | (none) |
| `onboarding_step_done` | IntroScreen.tsx | User completes step | `step` |

### Wardrobe

| Event | File | Trigger | Props |
|-------|------|---------|-------|
| `wardrobe_add_start` | WardrobeScreen.tsx | User taps add button | (none) |
| `wardrobe_add_success` | WardrobeScreen.tsx | Image uploaded to Firestore | `hasImage`, `reason` |
| `wardrobe_add_failed` | WardrobeScreen.tsx | Upload/validation failed | `error`, `reason` |

### AI Features

| Event | File | Trigger | Props |
|-------|------|---------|-------|
| `ai_analyze_start` | WardrobeScreen.tsx | User categorizes items | (none) |
| `ai_analyze_success` | aiService.ts | Item tags returned | `modelVersion`, `durationMs` |
| `ai_analyze_failed` | aiService.ts | Categorization failed | `error` |
| `ai_generate_start` | Dashboard.tsx | User taps generate | (none) |
| `ai_generate_success` | aiService.ts | Outfit returned | `modelVersion`, `durationMs` |
| `ai_generate_failed` | aiService.ts | Generation API failed | `error` |

### Premium & Monetization

| Event | File | Trigger | Props |
|-------|------|---------|-------|
| `premium_opened` | PremiumScreen.tsx | Premium screen shown | `source` |
| `premium_purchase_start` | iapService.ts | IAP dialog opened | `source`, `plan` |
| `premium_purchase_success` | iapService.ts | Payment confirmed | `plan` |
| `premium_purchase_failed` | iapService.ts | Payment failed | `error`, `plan` |
| `premium_restore_start` | iapService.ts | Restore initiated | (none) |
| `premium_restore_success` | iapService.ts | Previous subscription found | (none) |
| `premium_restore_failed` | iapService.ts | Restore failed | `error` |

### Push Notifications

| Event | File | Trigger | Props |
|-------|------|---------|-------|
| `push_register_start` | pushService.ts | Capacitor.PushNotifications.addListener() | (none) |
| `push_register_success` | pushService.ts | Device token registered | (none) |
| `push_register_failed` | pushService.ts | Token registration failed | `error` |
| `notif_enable_start` | notificationService.ts | Permission request shown | (none) |
| `notif_enable_success` | notificationService.ts | Permission granted | (none) |
| `notif_enable_failed` | notificationService.ts | Permission denied | (none) |
| `push_token_upsert_success` | pushTokenService.ts | Token saved to Firestore | (none) |
| `push_token_upsert_failed` | pushTokenService.ts | Firestore write failed | `error` |
| `push_token_disable_success` | pushTokenService.ts | Token disabled on logout | (none) |
| `push_token_disable_failed` | pushTokenService.ts | Token disable failed | `error` |

### Engagement

| Event | File | Trigger | Props |
|-------|------|---------|-------|
| `engagement_notif_sent` | engagementService.ts | Notification delivered | `reason` |
| `engagement_notif_blocked` | engagementService.ts | Notification blocked (quiet hours/cooldown) | `reason` |

---

## USAGE

### Tracking Events in Code

```typescript
import { track } from './services/telemetry';

// Auth
track('auth_login_success', { hasUser: true });

// Wardrobe
track('wardrobe_add_success', { 
  hasImage: true, 
  reason: 'camera',
  durationMs: 2341
});

// Premium
track('premium_purchase_start', { 
  source: 'premium_screen',
  plan: 'monthly'
});
```

### Viewing Events

- **Sentry Dashboard**: All events captured as breadcrumbs with context
- **Breadcrumb Format**: Event name + props object
- **Sampling**: Currently 0% sampled (development mode)

---

## METRICS AGGREGATION

### Key Ratios (6-Month Targets)

```
D1 Retention = Auth Complete on Day 1 / Intro Shown on Day 0
Target: >50% (with social login)

D7 Retention = Active on Day 7 / Auth Complete on Day 0
Target: >20% (with streaks + collections)

Activation Rate = First Wardrobe Add / Auth Complete
Target: >60% (with AI auto-categorize)

Core Engagement = First Generate Success / First Wardrobe Add
Target: >25% (expected in Sprint 1)

Premium Conversion = Purchase Success / Premium Opened
Target: >20% (trial + soft wall)

Trial Acceptance = Premium Opened / Soft Wall Hit
Target: >3% (soft wall at combo #6)
```

### Data Aggregation Pipeline

1. **Sentry Events** → Breadcrumbs captured with timestamp + user context
2. **Daily Export** → CSV export of events by user_id, event_name, timestamp, props
3. **Analytics Tool** → Import to Google Sheets or Mixpanel for funnel analysis
4. **Dashboard** → Real-time D1/D7/conversion tracking

---

## NEXT STEPS

- [ ] Enable Sentry in production (set `VITE_SENTRY_DSN`)
- [ ] Configure daily event exports
- [ ] Set up alerting for failed events (auth_login_failed, premium_purchase_failed)
- [ ] Dashboard: Real-time funnel visualization
- [ ] Track baseline metrics (D1: ?, D7: ?, Conv: ?)

---

**Last Updated**: 10 Ocak 2026  
**Owner**: Product Engineering  
**Status**: Live (Sentry-only, waiting for analytics export setup)
