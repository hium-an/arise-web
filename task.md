# Solo Leveling — Arise Web

## Tổng quan
Web version của app Solo Leveling — gamify personal development với RPG mechanics. Build bằng Next.js 14, Firebase, Tailwind CSS. Deploy trên Vercel.

---

## Web Phase 1 — Validate Core Loop

### W1 — Project Init & Infrastructure
- [x] Next.js 14 project setup (App Router, TypeScript, Tailwind, shadcn/ui)
- [x] Firebase config (`lib/firebase/config.ts`, `auth.ts`, `firestore.ts`)
- [x] TypeScript types (`types/index.ts` — mirror Dart models)
- [x] Dark RPG theme (Tailwind config + `globals.css` + CSS variables)
- [x] XP/stat gain logic (`lib/rpg/xp.ts`, `lib/rpg/stats.ts`)
- [x] Zustand auth store (`lib/store/authStore.ts`)
- [x] CI workflow (GitHub Actions — lint + typecheck + build)
- [x] Setup Vercel deployment + environment variables (`vercel.ts`, deploy/preview jobs in CI)

### W2 — Auth ✅
- [x] Login page (`app/(auth)/login/page.tsx`) — Email/Password + Google, error messages tiếng Việt
- [x] Signup page (`app/(auth)/signup/page.tsx`) — validate client-side, password complexity
- [x] Auth guard layout (`app/(app)/layout.tsx`) — redirect `/login` nếu chưa login
- [x] Connect Zustand authStore với Firebase Auth listeners (atomic state, no flicker)
- [x] Landing page `/` với ARISE hero + redirect logic
- [x] Password visibility toggle (eye icon, accessible)
- [x] Security headers `next.config.mjs` (CSP prod-only)
- [x] Test files: authStore, firebase-auth, AuthProvider, login, signup

### W3 (GitHub #19) — App Shell & Layout ✅
- [x] Root layout với providers (QueryClient, AuthProvider)
- [x] Sidebar navigation (desktop) — NavSidebar
- [x] Bottom navigation bar (mobile) — NavBottom
- [x] Top bar (mobile hamburger + user avatar) — NavTopBar
- [x] Active state highlight với glow effect

### W3 (GitHub #12–17) — RPG Components & Player Profile
> ⚠️ Đây là W3 thật theo GitHub board — cần làm trước W4 Dashboard
- [ ] `StatBar` component (#12) — glowing RPG stat progress bar (`components/rpg/StatBar.tsx`)
- [ ] `LevelBadge` component (#13) — hexagonal level badge (`components/rpg/LevelBadge.tsx`)
- [ ] `XPProgress` component (#14) — XP bar với animated fill (`components/rpg/XPProgress.tsx`)
- [ ] `ClassBadge` component (#15) — player class icon + label (`components/rpg/ClassBadge.tsx`)
- [ ] XP service + Stat service (#16) — `applyStatGains`, `checkLevelUp` vào `lib/rpg/`
- [ ] Player profile screen (#17) — `app/(app)/profile/page.tsx` (15 stats, level, class, title)

### W4 (GitHub #18–20) — Dashboard & Level-Up
- [ ] Dashboard page (#20) — `app/(app)/home/page.tsx` ⚠️ hiện đang 404
- [ ] `LevelUpOverlay` component (#18) — full-screen animation (Framer Motion)
- [ ] `useLevelUp` hook — detect + trigger overlay

### W5 (GitHub #21–25) — Quest System
- [ ] Quest data model + TanStack Query hooks (#21)
- [ ] Quest list screen (#22)
- [ ] `QuestCard` component (#23)
- [ ] Quest creation form (#24)
- [ ] Quest completion → XP gain → stat update (#25)

### W6 (GitHub #26–29) — Habit Tracking
- [ ] Habit data model + TanStack Query hooks (#26)
- [ ] Habit list screen (#27)
- [ ] Habit check-off + streak logic (#28)
- [ ] Habit creation form (#29)

### W8 — Vercel Deploy
- [x] `vercel.ts` config (security headers, cache, region sin1)
- [x] CI/CD pipeline (auto deploy production + preview per PR)
- [x] GitHub Secrets configured (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)
- [ ] Add Firebase env vars vào Vercel Dashboard (Settings → Environment Variables)
- [ ] Smoke test — verify production URL load được

---

## Web Phase 2 — AI + Credits
- [ ] Goal Planner + AI quest generation (Cloud Functions)
- [ ] Daily quest display (từ scheduled Cloud Function)
- [ ] Stripe integration (credit packages)
- [ ] Credit balance + spend tracking

---

## Web Phase 3 — Full Feature Parity
- [ ] Boss challenges
- [ ] Journal screen
- [ ] Mood tracker screen
- [ ] Stats & analytics (Recharts)
- [ ] Notifications (Web Push via FCM)

---

## Ghi chú
- Firebase project: dùng chung schema với mobile app
- Cloud Functions: dùng chung với mobile (AI proxy, credit ledger)
- Payments: Stripe trên web (thay vì IAP của mobile)
- Priority: hoàn thành Phase 1 trước khi bắt đầu Phase 2

---

## 🔖 Dừng lại tại đây — 2026-05-21

### Đã xong hôm nay
- [x] W3 hoàn thành: NavSidebar, NavBottom, NavTopBar, AppLayout responsive
- [x] Jest setup: 79 tests passing / 5 suites
- [x] Extract `getAuthErrorMessage` → `lib/firebase/authErrors.ts`
- [x] Fix UTF-8 encoding garbled trong login/page.tsx
- [x] Fix `aria-invalid` hardcoded false trên email input (signup)
- [x] PR #46 merged vào main

### Làm tiếp — W4
1. **[W4]** Dashboard page `/home` — StatBar, LevelBadge, XPProgress, ClassBadge
2. **[W4]** Player profile screen (15 stats, level, class, title)
3. **[W8]** Thêm Firebase env vars vào Vercel Dashboard → smoke test

### Ghi chú kỹ thuật
- CSP headers chỉ apply trong production
- jest 30 + ts-jest 29: chưa upgrade ts-jest 30 (còn beta)
- `auth/account-exists-with-different-credential` chưa có trong authErrors map
