# LOVA — QUICK REFERENCE SHEET
## PM/UX Karar Matris

---

## USER JOURNEY BOTTLENECKS

| Aşama | Durum | Ana Risk | Fix |
|-------|-------|----------|-----|
| **Intro** | Good | Beneşler soyut | Somut example ("Sadece 3 click") |
| **Auth** | Weak | Şifre gereksinimleri katı | Social login (Google/Apple) |
| **Activation** | Good | Trial limit too low | 3-day free (yerine 2-combo) |
| **Engagement** | Good | Retention loop zayıf | Streaks + Collections |
| **Wardrobe** | OK | Upload friction | AI auto-categorize (snap) |
| **Monetization** | Weak | Low conversion <5% | Trial + trust signals + soft paywall |
| **Retention** | Weak | Single-loop (combo only) | Social sharing + leaderboard |

---

## CRITICAL METRICS TO TRACK

```
D1 Retention: Intro → Auth → First Combo
├─ Current: Unknown (needs measurement)
├─ Target: >50% (social login + 3-day trial)
└─ Impact: LTV improvement +300%

D7 Retention: Habit Formation
├─ Current: Unknown (needs measurement)
├─ Target: >20% (streaks + collections)
└─ Impact: DAU +35%

Conversion (Trial → Paid)
├─ Current: Unknown (needs measurement)
├─ Target: >8% (soft wall + trial)
└─ Impact: Revenue +5x

CAC (Customer Acquisition Cost)
├─ Current: Unknown (needs measurement)
├─ Target: <$0.50 (referral loop)
└─ Impact: Profitability positive

Session Time
├─ Current: Unknown (needs measurement)
├─ Target: >20 min (discovery + social)
└─ Impact: Engagement improvement
```

---

## TOP 5 BLOCKERS & QUICK FIXES

| Blocker | Fix | Time | Impact |
|---------|-----|------|--------|
| **Conversion <2%** | Add 3-day trial + social login | 2d | Rev +5x |
| **Retention <15%** | Add streaks + collections | 3d | DAU +30% |
| **Wardrobe dropout** | AI auto-categorize snap | 2d | Waits -80% |
| **Support flood** | Restore purchase + FAQ | 0.5d | Support -50% |
| **Premium feels weak** | Dark mode + trust signals | 1d | Conv +10% |

---

## PREMIUM FEEL CHECKLIST (MUST-HAVES)

- [ ] Dark mode: True-black (#0a0a0a), not gray
- [ ] Empty states: Illustration + clear CTA, not blank
- [ ] Loading: Skeleton screens, not spinners
- [ ] Micro-copy: "Stilin Asistanı" not "AI Engine"
- [ ] Trust signals: 4.8 ⭐ badge on Premium screen
- [ ] Onboarding: 1-minute WoW (first outfit in 60s)
- [ ] Error: Friendly message + retry button, not code
- [ ] Mobile: 0 horizontal scroll, optimized 375px width

---

## RETENTION MECHANICS (CURRENT vs NEEDED)

**Current (Unknown - needs measurement)**:
- Outfit generator (daily)
- Outfit history (save/rate)
- Push notifications (quiet hours + cooldown)
- Engagement tracker (dormant alerts)

**Missing (Kill 90% churn)**:
- ❌ Streaks (habit formation)
- ❌ Collections (context groups)
- ❌ Social leaderboard (FOMO)
- ❌ Referral (viral loop)
- ❌ Achievements (gamification)
- ❌ Personalized recs (discovery)

---

## MONETIZATION FUNNEL (HYPOTHESIS)

**Current (BROKEN)**:
```
1,000 DAU (Hypothesis)
  ↓ 70% (Hypothesis)
700 Auth
  ↓ 40% (Hypothesis)
280 First Combo (no social)
  ↓ 65% (Hypothesis)
182 Trial Ended
  ↓ 2% (Hypothesis)
3.6 Premium ❌ HARD WALL
```

**Fixed (SOFT PAYWALL + TRIAL)**:
```
1,000 DAU (Hypothesis)
  ↓ 85% (Hypothesis)
850 Auth (with social)
  ↓ 60% (Hypothesis)
510 First Combo
  ↓ 50% (Hypothesis)
255 Trial Start (3 days free)
  ↓ 20% (Hypothesis)
51 Premium ✅ 14x improvement
```

---

## SPRINT ROADMAP (6 WEEKS)

```
Sprint 1 (P0): Revenue Machine Fix
├─ Social login (Google/Apple)
├─ Premium trial (3 days)
├─ Trust signals (App Store rating)
├─ Empty state UX
└─ Restore Purchase
   GOAL: Conv +35%, Support -50%, DAU +15%

Sprint 2 (Retention): Habit Formation
├─ Streak counter (🔥 N-day)
├─ Collections (Work/Weekend/Date)
├─ AI item categorize (snap)
├─ Achievement badges
└─ Personalized daily tip
   GOAL: DAU +30%, Retention +20%, Time +45 min/week

Sprint 3 (Growth): Viral Loop
├─ Referral program (invite + reward)
├─ Outfit leaderboard (trending)
├─ Social share (Instagram/Pinterest/TikTok)
├─ Dark mode polish
└─ Similar outfits AI discovery
   GOAL: CAC ↓30%, Viral coeff 0.8→1.1, Sharing +50%
```

---

## CODE FILES TO CHANGE (Priority Order)

### P0 (Sprint 1)
1. `authService.ts` — Social login integration
2. `premiumService.ts` + `premiumLocal.ts` — Trial tracking
3. `PremiumScreen.tsx` — Trust signals, trial CTA
4. `OutfitHistoryScreen.tsx` + `WardrobeScreen.tsx` — Empty states
5. `App.tsx` — Skip intro for returns

### P1 (Sprint 2)
6. `engagementLocal.ts` — Streak counter
7. `outfitHistoryService.ts` — Collections CRUD
8. `aiService.ts` — Item categorization endpoint
9. `Dashboard.tsx` — Achievement badges
10. `WardrobeScreen.tsx` — AI snap UI

### P2 (Sprint 3)
11. `authService.ts` — Referral system
12. `Dashboard.tsx` — Leaderboard view
13. `ResultModal.tsx` — Social share buttons
14. `tailwind.config.js` — Dark mode colors
15. `firestore.rules` — Collections security

---

## SUCCESS METRICS (6-Month Goals)

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| DAU | Unknown | 200+ | Hypothesis, track weekly |
| D1 Retention | Unknown | >50% | Hypothesis, track weekly |
| D7 Retention | Unknown | >20% | Hypothesis, track weekly |
| Premium Conv | Unknown | >8% | Hypothesis, needs soft wall |
| CAC | Unknown | <$0.50 | Hypothesis, needs referral |
| LTV | Unknown | >$30 | Hypothesis, depends on retention |
| LTV:CAC Ratio | Unknown | >60:1 | Hypothesis, venture scale |
| Session Time | Unknown | >20 min | Hypothesis, needs discovery |

---

## RISK MITIGATION

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Trial → High Churn | -40% users | Increase trial to 7d, add streaks |
| App Store Rejection | $0 revenue | QA IAP on real devices, test Restore |
| Firebase Overrun | -$1000s | Billing alerts ($500/mo cap), optimize Firestore queries |
| AI API Down | 50% unavailable | Fallback cached templates, circuit breaker |
| Photo Storage Abuse | Storage + cost | Firestore rules (user owns images), lifecycle policy (delete 30d+), compression (WebP 80%), signed URLs, image audit quota |
| Can't Restore Purchase | Support flood | Robust restore logic, transaction logs |

---

## ONE-PAGE DECISION TREE

```
Q: Should we proceed with 3-sprint plan?
A: YES ✅

Q: Is revenue path clear?
A: YES ✅ (Trial + social login + soft wall = 8%+ conv hypothesis)

Q: Do we have engineering?
A: ASSUME YES (4 weeks × $4K/week = $16K)

Q: Timeline realistic?
A: YES ✅ (6 weeks, no major refactors)

Q: What's the biggest risk?
A: Social login bugs + IAP rejection (mitigate: extra QA)

Q: When to launch?
A: After Sprint 1 complete (2 weeks)
   → 3-day trial + social login live
   → Monitor D7 retention baseline
   → Then Sprint 2 (weeks 3-4)
   → Then Sprint 3 (weeks 5-6)

Q: Success criteria (realistic, not aspirational)?
A: D7 retention: 20%+ (currently unknown)
   Conv: 8%+ (currently unknown)
   DAU: 200+ (currently unknown)
   → All labeled "Hypothesis" until measured

GO/NO-GO: ✅ GO (with measurement plan)
```

---

**Prepared by**: Senior Product Lead  
**Date**: 10 Ocak 2026  
**Confidence**: 8/10 (mechanics solid, growth TBD)  
**Next Step**: Prioritize Sprint 1, allocate engineering
