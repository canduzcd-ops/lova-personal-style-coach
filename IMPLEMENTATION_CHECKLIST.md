# LOVA IMPLEMENTATION CHECKLIST
## Kıdemli PM/UX Lead Karar Listesi

---

## OKUMA LISTESI (Başlangıç)

Önce şunları oku (30 min):
- [x] [PRODUCT_QUICK_REF.md](PRODUCT_QUICK_REF.md) — 1-page karar matrisi
- [ ] [PRODUCT_STRATEGY.md](PRODUCT_STRATEGY.md) — Kapsamlı analiz (45 min)

---

## GO/NO-GO DECISION

**Soru**: Lova'yı "Series A ready" → "Growth-ready" seviyesine taşımalı mıyız?

**Cevap**: ✅ **GO** (8/10 confidence)

**Neden**:
- ✅ Mechanics solid (wardrobe, AI, history, IAP)
- ✅ Telemetry complete (33 events)
- ✅ Engagement system live (push + quiet hours + cooldown)
- ✅ Functions ready (Android FCM, iOS stub)
- ⚠️ Visual polish weak (dark mode, empty states)
- ⚠️ Retention low (12% D7, no streaks/collections)
- ⚠️ Revenue friction (2% conversion, no trial, no social)

**Risk Tolerance**: High (6-week sprint gamble, $19K spend)

**Timeline**: 6 weeks (2 weeks × 3 sprints)

---

## SPRINT 1 CHECKLIST (WEEKS 1-2) — Revenue Machine

### Task 1: Social Login (Google/Apple)
- [ ] Design: Social login UI mockup (AuthScreen)
- [ ] Dev: firebase.signInWithPopup (Google/Apple)
- [ ] Dev: Account linking (if email exists)
- [ ] QA: Test Google login (web + native)
- [ ] QA: Test Apple login (native only)
- [ ] QA: Test email fallback
- [ ] Deploy: Staging → prod
- **Expected**: Conv +40%, D1 Ret +15%
- **Effort**: 2-3 days (dev + QA)
- **Risk**: Account linking bugs, App Store review

### Task 2: Premium Trial (3-Day Free)
- [ ] Design: "3 gün ücretsiz" CTA
- [ ] Dev: premiumService.ts — trial expiry logic
- [ ] Dev: premiumLocal.ts — trial_end_date tracking
- [ ] Dev: Dashboard.tsx — trial countdown UI
- [ ] Dev: PremiumScreen.tsx — "3 gün kaldı" message
- [ ] Dev: Premium check (is trial OR paid)
- [ ] QA: Trial expiry at day 4 (hard paywall)
- [ ] QA: Auto-downgrade on expiry
- [ ] Deploy: Staging → prod
- **Expected**: Conv +35%
- **Effort**: 1.5-2 days
- **Risk**: Expiry logic bugs, backend sync

### Task 3: Trust Signals (App Store Rating)
- [ ] Design: Rating badge mockup (PremiumScreen)
- [ ] Dev: Fetch App Store rating (API call)
- [ ] Dev: Cache rating (don't fetch every session)
- [ ] Dev: PremiumScreen badge display
- [ ] QA: Test rating display
- [ ] Deploy: Staging → prod
- **Expected**: Conv +10%
- **Effort**: 0.5-1 day
- **Risk**: App Store API rate limit

### Task 4: Empty State UX + Copy
- [ ] Design: Illustration sketches (wardrobe empty, history empty)
- [ ] Dev: OutfitHistoryScreen.tsx — empty state
- [ ] Dev: WardrobeScreen.tsx — empty state with CTA
- [ ] Dev: Copy refinement ("Dolabın boş" → "Fotoğraf çek!" + icon)
- [ ] QA: Test empty state flows
- [ ] Deploy: Staging → prod
- **Expected**: Clarity +40%, Wardrobe +5%
- **Effort**: 1-1.5 days
- **Risk**: Illustration time (consider simple UI instead)

### Task 5: Restore Purchase Button
- [ ] Dev: PremiumScreen.tsx — "Satın Alımı Geri Yükle" button
- [ ] Dev: iapService.restore() on-click
- [ ] Dev: Toast feedback (success/error)
- [ ] QA: Test on iOS + Android real devices
- [ ] Deploy: Staging → prod
- **Expected**: Support -50%
- **Effort**: 0.5-1 day
- **Risk**: IAP receipt validation edge cases

---

## SPRINT 2 CHECKLIST (WEEKS 3-4) — Retention & Habit

### Task 6: Streak Counter (Daily Habit)
- [ ] Design: 🔥 badge mockup (Dashboard hero)
- [ ] Dev: engagementLocal.ts — lastComboDate tracking
- [ ] Dev: Dashboard.tsx — streak calculation + display
- [ ] Dev: Reset streak at 23:59 UTC (if no combo)
- [ ] QA: Test streak increment/reset
- [ ] Deploy: Staging → prod
- **Expected**: DAU +35%, D7 Ret +8%
- **Effort**: 1-1.5 days
- **Risk**: Timezone edge cases

### Task 7: Collections (Save by Context)
- [ ] Design: Collection UI (tabs: Work/Weekend/Date)
- [ ] Dev: Firestore schema (outfits collection + tags)
- [ ] Dev: outfitHistoryService.ts — add/edit/delete collections
- [ ] Dev: OutfitHistoryScreen.tsx — collection tabs
- [ ] Dev: Save outfit → "Add to Collection" dialog
- [ ] Dev: Firestore rules (user can only read own)
- [ ] QA: Create/edit/delete collection
- [ ] Deploy: Staging → prod
- **Expected**: Retention +25%, Session +20 min
- **Effort**: 2-2.5 days
- **Risk**: Schema migration (existing outfits)

### Task 8: AI Item Categorization (Snap)
- [ ] Design: Snap → auto-category UI
- [ ] Dev: Create new AI endpoint /categorizeItem (Google Vision)
- [ ] Dev: WardrobeScreen.tsx — snap UI
- [ ] Dev: Error handling (can't detect category)
- [ ] Dev: User can override category
- [ ] QA: Test with 10+ items (accuracy)
- [ ] Deploy: Staging → prod
- **Expected**: Wardrobe completion +80%
- **Effort**: 2-2.5 days
- **Risk**: API cost (Vision per-image), accuracy <80%

### Task 9: Achievement Badges
- [ ] Design: 5 badges (First Outfit, 5-Day, 10 Saves, Curator, Consistent)
- [ ] Dev: telemetry.ts — achievement event types
- [ ] Dev: Dashboard.tsx — achievement display
- [ ] Dev: Logic (detect when earned, show toast)
- [ ] QA: Test all 5 achievement paths
- [ ] Deploy: Staging → prod
- **Expected**: Session +8 min, Sharing +10%
- **Effort**: 1-1.5 days
- **Risk**: Too many achievements (feature creep)

### Task 10: Personalized Daily Tip
- [ ] Dev: Dashboard.tsx — replace generateStaticStyleTips with user.styles-based
- [ ] Dev: Keep fallback (if no styles, random)
- [ ] QA: Test personalization
- [ ] Deploy: Staging → prod
- **Expected**: Engagement +5%
- **Effort**: 0.5 days
- **Risk**: None (low risk)

---

## SPRINT 3 CHECKLIST (WEEKS 5-6) — Growth & Viral

### Task 11: Referral Program
- [ ] Design: Share code UI + reward message
- [ ] Dev: Generate unique referral code (per user)
- [ ] Dev: Deep link (lova://ref?code=ABC123)
- [ ] Dev: Track referral signup (source code)
- [ ] Dev: Award 1 free outfit (referrer) + 3-day trial (referee)
- [ ] Dev: Dashboard → "Invite Friend" button
- [ ] Dev: Referral stats ("You've invited 3 friends")
- [ ] QA: Test end-to-end referral flow
- [ ] Deploy: Staging → prod
- **Expected**: CAC ↓30%, DAU +20%
- **Effort**: 2-3 days
- **Risk**: Abuse (self-refer), CAC tracking

### Task 12: Outfit Leaderboard (Trending)
- [ ] Design: Leaderboard UI (top 3, weekly reset)
- [ ] Dev: New Dashboard view "Trending"
- [ ] Dev: Query (top 3 by likes/saves, this week)
- [ ] Dev: Show user avatar + outfit image + stats
- [ ] QA: Test query performance (large scale)
- [ ] Deploy: Staging → prod
- **Expected**: FOMO +20%, Sharing +30%
- **Effort**: 1.5-2 days
- **Risk**: Featured user privacy, gaming (likes spam)

### Task 13: Social Share (Instagram/Pinterest/TikTok)
- [ ] Design: Share button mockup (ResultModal)
- [ ] Dev: ResultModal.tsx — "Share" button
- [ ] Dev: Generate shareable image (outfit + quote)
- [ ] Dev: Deep links (Instagram story, Pinterest pin, TikTok)
- [ ] Dev: Fallback (clipboard copy if deep link fails)
- [ ] QA: Test on iOS + Android
- [ ] Deploy: Staging → prod
- **Expected**: Viral coeff +0.3, CAC ↓20%
- **Effort**: 1.5-2 days
- **Risk**: Deep link app install detection

### Task 14: Dark Mode Polish
- [ ] Design: Dark mode color palette (true-black base)
- [ ] Dev: tailwind.config.js — update dark: colors
- [ ] Dev: Test all screens in dark mode
- [ ] Dev: Fix contrast issues (WCAG AA)
- [ ] QA: Dark mode on all screens
- [ ] Deploy: Staging → prod
- **Expected**: Premium feel +10%, AMOLED battery +20%
- **Effort**: 1-1.5 days
- **Risk**: Contrast accessibility

### Task 15: Similar Outfits AI Discovery
- [ ] Design: UI (carousel "Buna Benzer")
- [ ] Dev: Create new AI endpoint /similarOutfits (embedding)
- [ ] Dev: OutfitHistoryScreen.tsx — similar carousel
- [ ] Dev: Click similar → show outfit
- [ ] QA: Test accuracy
- [ ] Deploy: Staging → prod
- **Expected**: Session +20 min, Discovery +30%
- **Effort**: 2 days (includes AI endpoint)
- **Risk**: API cost, accuracy

---

## TESTING CHECKLIST

### QA Gates (Per Sprint)
- [ ] Unit tests passing (vitest)
- [ ] E2E on web (Chrome)
- [ ] E2E on native (iOS + Android simulators)
- [ ] Performance (Lighthouse >80)
- [ ] Accessibility (WCAG AA)
- [ ] Offline support (no crashes)
- [ ] Dark mode tested
- [ ] RTL (if Arabic/Hebrew added)

### Beta Testing
- [ ] Internal beta (team + friends)
- [ ] Beta feedback (Google Play/TestFlight)
- [ ] Crash telemetry (Sentry clean)
- [ ] Performance monitoring (under 3s load)

### Store Submission
- [ ] iOS: Privacy + terms compliance
- [ ] iOS: IAP pricing verification
- [ ] Android: Same compliance check
- [ ] Both: App description + screenshots updated

---

## GO/NO-GO GATES (Per Sprint)

### After Sprint 1
**Metrics to Hit** (or PAUSE Sprint 2):
- [ ] DAU +10% (100 → 110)
- [ ] D1 Retention +15% (30% → 45%)
- [ ] Conv +25% (2% → 2.5%, target 3%+)
- [ ] No critical bugs (Sentry clean)

**If metrics missed**: Extend Sprint 1 (+1 week for social login polish)

### After Sprint 2
**Metrics to Hit** (or PAUSE Sprint 3):
- [ ] DAU +25% (110 → 138)
- [ ] D7 Retention +10% (12% → 22%)
- [ ] Session time +15 min (8 → 23 min)
- [ ] 50+ collections created (adoption >30%)

**If metrics missed**: Extend Sprint 2 (+1 week for streak/collection marketing)

### After Sprint 3
**Metrics to Hit** (Series A Readiness):
- [ ] DAU >200
- [ ] D7 Retention 20%+ (target: 25%)
- [ ] Conv >5% (target: 8%)
- [ ] CAC <$1 (target: <$0.50)
- [ ] LTV:CAC >20:1 (target: 80:1)
- [ ] Churn rate <2%/month

**If all hit**: ✅ Series A pitch ready

---

## MARKETING & LAUNCH PLAN (Parallel Track)

### Week 1-2 (Sprint 1 live)
- [ ] "New: Social Login + Free Trial" tweet
- [ ] Update App Store description
- [ ] Beta testing with micro-influencers (10-50K followers)
- [ ] Collect testimonials

### Week 3-4 (Sprint 2 live)
- [ ] "3-Day Streak Challenge" campaign
- [ ] Feature referral code in profiles
- [ ] Partner with fashion micro-bloggers (collections feature)
- [ ] Podcast appearance (PM story)

### Week 5-6 (Sprint 3 live)
- [ ] "User-Generated Outfit" campaign (trending leaderboard)
- [ ] TikTok/Instagram Reels (share feature promo)
- [ ] Press release (viral loop + leaderboard)
- [ ] Series A prep (metrics ready)

---

## BUDGET ESTIMATE

### Engineering (6 weeks)
- 1 Senior Backend: $4K/week × 6 = $24K
- 1 Mobile Frontend: $4K/week × 6 = $24K
- 1 QA: $2K/week × 6 = $12K
- **Subtotal**: $60K

### Design
- 1 Product Designer: $2K/week × 6 = $12K
- **Subtotal**: $12K

### Ops
- PM oversight: $1K/week × 6 = $6K
- Cloud costs (Firebase overrun): +$200/week × 6 = $1.2K
- **Subtotal**: $7.2K

### **TOTAL**: ~$79K (estimate for full 6-week sprint)

---

## DECISION LOG

**Date**: 10 Ocak 2026  
**Decision**: Approve 3-sprint product roadmap  
**Confidence**: 8/10  
**Approved By**: [Kıdemli PM]  
**Next Review**: After Sprint 1 (Week 2)

---

## FINAL CHECKLIST (Before Execution)

- [ ] Read PRODUCT_STRATEGY.md fully
- [ ] Align with CTO (engineering feasibility)
- [ ] Align with designer (UI/UX scope)
- [ ] Secure $79K budget
- [ ] Set up Jira/Asana sprints
- [ ] Schedule weekly PM syncs
- [ ] Set up Sentry monitoring
- [ ] Brief team on goals (metrics + deadline)
- [ ] Prepare beta testing plan
- [ ] Create App Store launch checklist

---

**Status**: ✅ **READY TO EXECUTE**

**Next Step**: Kickoff Sprint 1 Monday (15 Ocak 2026)  
**Target Go-Live**: Sprint 1 → 29 Ocak 2026

---

*Prepared by: Senior Product Strategy Lead*  
*Confidence: 8/10 (mechanics solid, growth execution TBD)*  
*Good luck! 🚀*
