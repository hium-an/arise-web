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

### W2 — Auth
- [ ] Login page (`app/(auth)/login/page.tsx`)
- [ ] Signup page (`app/(auth)/signup/page.tsx`)
- [ ] Auth guard layout (`app/(app)/layout.tsx`)
- [ ] Connect Zustand authStore với Firebase Auth listeners

### W3 — App Shell & Layout
- [ ] Root layout với providers (QueryClient, AuthProvider)
- [ ] Sidebar navigation (desktop)
- [ ] Bottom navigation bar (mobile)
- [ ] Top bar (mobile hamburger + user avatar)

### W4 — Player Profile & Dashboard
- [ ] Dashboard page (`app/(app)/home/page.tsx`)
- [ ] `StatBar` component — glowing RPG stat progress bar
- [ ] `LevelBadge` component — hexagonal level badge
- [ ] `XPProgress` component — XP bar với animated fill
- [ ] `ClassBadge` component — player class icon + label
- [ ] Player profile screen (15 stats, level, class, title)

### W5 — Habit Tracking
- [ ] Habit list page (`app/(app)/habits/page.tsx`)
- [ ] Habit creation form
- [ ] Daily check-off với streak counter
- [ ] Firestore CRUD cho habits (`lib/queries/useHabits.ts`)

### W6 — Quest System
- [ ] Quest list page (`app/(app)/quests/page.tsx`) — tabs: Daily/Weekly/Main/Side/Boss
- [ ] Quest creation form (manual)
- [ ] Quest completion → XP gain → stat update
- [ ] `QuestCard` component — quest list item
- [ ] Firestore CRUD cho quests (`lib/queries/useQuests.ts`)

### W7 — Level-Up Experience
- [ ] `LevelUpOverlay` component — full-screen animation (Framer Motion)
- [ ] `useLevelUp` hook — detect + trigger overlay
- [ ] XP gain animation trên quest completion

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

## 🔖 Dừng lại tại đây — 2026-05-13

### Đã xong hôm nay
- [x] W1 hoàn thành toàn bộ infrastructure
- [x] Vercel deployment setup (vercel.ts + CI jobs + GitHub Secrets)
- [x] task.md tạo mới để tracking

### Làm tiếp ngày mai
1. **[W8 còn lại]** Thêm Firebase env vars vào Vercel Dashboard → smoke test URL production
2. **[W2]** Auth screens: Login + Signup pages
3. **[W2]** Kết nối Firebase Auth → Zustand authStore
4. **[W3]** App layout: Sidebar (desktop) + Bottom nav (mobile)
