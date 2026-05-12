# ⚔️ Solo Leveling (Arise) — App Architecture

> **Working title:** Solo Leveling | **Recommended release name:** Arise
>
> A personal development app with full RPG mechanics — set real goals, get AI-generated quests, complete them to earn XP, level up your stats, and evolve your player class. Aesthetic: dark manhwa-style, neon blue/purple glowing UI.

---

## 📋 Table of Contents

1. [App Overview](#-app-overview)
2. [Tech Stack](#-tech-stack)
3. [RPG System Design](#-rpg-system-design)
4. [Core Features](#-core-features)
5. [AI Integration](#-ai-integration)
6. [Monetization Model](#-monetization-model)
7. [Architecture Pattern](#-architecture-pattern)
8. [Folder Structure](#-folder-structure)
9. [Data Models](#-data-models)
10. [Firestore Schema](#-firestore-schema)
11. [Routing](#-routing)
12. [State Management](#-state-management)
13. [UI / Design System](#-ui--design-system)
14. [Notifications](#-notifications)
15. [Key Design Decisions](#-key-design-decisions)
16. [Phased Roadmap](#-phased-roadmap)
17. [App Name Alternatives](#-app-name-alternatives)
18. [Getting Started Checklist](#-getting-started-checklist)

---

## 🎮 App Overview

| Field | Value |
|-------|-------|
| **Working title** | Solo Leveling |
| **Release name** | Arise (recommended — see [alternatives](#-app-name-alternatives)) |
| **Concept** | Personal development app gamified as a solo RPG. Users set real-life goals; AI converts them into quests, milestones, and daily tasks. Completing quests earns XP and stat gains, driving level-ups and class evolution. |
| **Inspiration** | Manhwa *Solo Leveling* — dark aesthetic, dramatic level-up screens, stat system, player classes |
| **Platforms** | iOS 17+ and Android API 26+ |
| **Target users** | Self-improvement enthusiasts, productivity power users, RPG fans |
| **Language** | English (internationalisation planned post-MVP) |

---

## 🛠️ Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Flutter 3.x (Dart 3.x) | iOS 17+ / Android API 26+ |
| State management | Riverpod | Providers + code generation |
| Routing | GoRouter | Declarative, deep-link ready |
| Auth | Firebase Auth | Email/password + Google Sign-In |
| Database | Firestore | Real-time sync |
| Cloud logic | Cloud Functions (Node.js) | AI proxy, scheduled tasks, credit ledger |
| Crash reporting | Firebase Crashlytics | |
| Analytics | Firebase Analytics | |
| HTTP client | Dio | Interceptors for auth token injection |
| AI (primary) | Gemini 2.0 Flash | Free tier via Google AI Studio |
| AI (fallback) | GPT-4o-mini / Claude Haiku | Budget-controlled fallback |
| Local storage | Hive | Offline-first cache for habits/journal |
| Notifications | firebase_messaging + flutter_local_notifications | |
| Payments (Phase 4) | in_app_purchase | StoreKit 2 + Google Play Billing 5 |
| Data classes | freezed + json_serializable | Immutable models with JSON support |

### pubspec.yaml — Core Dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter

  # State & routing
  flutter_riverpod: ^2.5.1
  riverpod_annotation: ^2.3.5
  go_router: ^13.2.0

  # Firebase
  firebase_core: ^2.30.1
  firebase_auth: ^4.19.5
  cloud_firestore: ^4.17.3
  cloud_functions: ^4.7.3
  firebase_crashlytics: ^3.5.5
  firebase_analytics: ^10.10.5
  firebase_messaging: ^14.9.4

  # HTTP & serialization
  dio: ^5.4.3
  freezed_annotation: ^2.4.1
  json_annotation: ^4.9.0

  # Local storage
  hive_flutter: ^1.1.0

  # Notifications
  flutter_local_notifications: ^17.1.2

  # UI
  google_fonts: ^6.2.1
  fl_chart: ^0.67.0          # Charts for stats/analytics
  flutter_animate: ^4.5.0    # Animations for level-up effects
  lottie: ^3.1.0              # Lottie animations for RPG effects
  cached_network_image: ^3.3.1

  # Payments (Phase 4)
  in_app_purchase: ^3.1.13

  # Utilities
  intl: ^0.19.0
  uuid: ^4.4.0
  logger: ^2.3.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.2
  build_runner: ^2.4.11
  freezed: ^2.5.2
  json_serializable: ^6.8.0
  riverpod_generator: ^2.4.0
  custom_lint: ^0.6.4
  riverpod_lint: ^2.3.10
```

---

## ⚔️ RPG System Design

### Life Domains & Stats

Stat abbreviations use a hybrid of classic RPG (STR/VIT/AGI) and custom names for non-physical domains. Stats grow as users complete relevant quests and habits.

| Domain | Icon | Stats |
|--------|------|-------|
| Physical | 💪 | **STR** (Strength), **VIT** (Vitality), **AGI** (Agility) |
| Mental | 🧠 | **INT** (Intelligence), **WIS** (Wisdom), **FOC** (Focus) |
| Financial | 💰 | **WLT** (Wealth Score), **SAV** (Saving Habit), **INV** (Investment Activity) |
| Social | 🤝 | **CHA** (Charisma), **EMP** (Empathy), **NET** (Network Growth) |
| Discipline | 🎯 | **WIL** (Willpower), **PER** (Persistence), **CON** (Consistency) |

**Total stats: 15** — each displayed as an RPG-style progress bar on the player profile.

### Stat Gains per Action

Each quest and habit specifies a `statGains` map — e.g.:

```json
{
  "STR": 2,
  "VIT": 1
}
```

The RPG service accumulates these gains and caps per-day growth to avoid grinding exploits.

---

### Level System

| Rule | Detail |
|------|--------|
| XP sources | Quest completion, habit streaks, goal milestones, boss challenges |
| Threshold formula | `xpRequired(level) = 100 * (level ^ 1.5)` — exponential curve |
| Level-up event | Full-screen dramatic animation ("YOU HAVE LEVELED UP") — manhwa panel style |
| Max level | None — infinite progression |
| XP display | Current XP / XP-to-next-level shown as glowing progress bar |

### Player Class System

Class is computed from the user's dominant stat cluster. Recalculated on each level-up.

| Class | Trigger Condition |
|-------|------------------|
| Iron Body | STR + VIT + AGI highest |
| Shadow Scholar | INT + WIS + FOC highest |
| Silver Tongue | CHA + EMP + NET highest |
| Iron Will | WIL + PER + CON highest |
| Coin Sovereign | WLT + SAV + INV highest |
| Sovereign | All stat clusters balanced (within 15% variance) |
| Novice Hunter | Default — no dominant stat yet |

Class label displayed on profile card with a unique glyph/icon.

### Title System

Titles are achievement badges, displayed under the player's name. Examples:

| Title | Unlock Condition |
|-------|-----------------|
| Dawn Warrior | Complete a quest before 7 AM for 7 days |
| Streak Hunter | Maintain any habit streak for 30 days |
| The Consistent One | Complete 100 daily quests total |
| Shadow Walker | Log journal entries for 14 consecutive days |
| Iron Mind | FOC stat reaches 50 |
| First Arise | First ever quest completion |

Multiple titles can be earned; user selects the active displayed title.

---

### Quest Types

| Type | Description | Generation |
|------|-------------|------------|
| **Daily Quest** | 3–5 tasks for today, domain-balanced | AI pre-generated at midnight via Cloud Function |
| **Weekly Quest** | 1–2 bigger tasks spanning Mon–Sun | AI generated on Sunday night |
| **Main Quest** | A long-term goal broken into milestone quests | AI-generated from Goal Planner |
| **Side Quest** | Bonus tasks — user-created or AI-suggested | On demand |
| **Boss Challenge** | High-difficulty, time-limited, large XP reward | User-initiated or monthly AI suggestion |

---

## 🌟 Core Features

### 1. Auth
- Firebase Auth: email/password + Google Sign-In
- Same pattern as reelmake-ai reference app
- `AuthService` wraps Firebase calls; `AuthProvider` (Riverpod) exposes user state app-wide
- Redirect logic in GoRouter: unauthenticated → `/login`

### 2. Player Profile
- Displays: avatar, display name, level badge, player class, active title, XP bar
- Stat grid (15 stats) with RPG-style bars
- Total quests completed, current streak, join date

### 3. Quest System
- List view with tabs: Daily / Weekly / Main / Side / Boss
- Swipe-to-complete gesture with XP animation
- Quest detail: description, domain tag, XP reward, stat gains preview, deadline
- Manual quest creation (title, domain, XP estimate)
- AI quest generation via Goal Planner

### 4. Habit Tracker
- List of active habits with domain tags
- Daily check-off with visual streak counter (fire icon + number)
- Streak freeze mechanic (grace period: 1 missed day per 7-day window)
- Habit history: calendar heatmap view
- Domain tag drives which stats gain on completion

### 5. Goal Planner (AI Core)
- User inputs: goal title, description, deadline, domain
- AI (Gemini via Cloud Function) returns:
  - List of milestones (ordered)
  - Per-milestone: sub-tasks as quests, suggested duration, difficulty
  - Full quest sequence auto-added to user's quest collection
- Progress bar per goal based on completed quests ratio
- Goal detail: milestones checklist, linked quests, AI plan text

### 6. Challenge System (Boss Fights)
- Hard challenge with: title, description, deadline (hours/days), XP multiplier
- Accepting a challenge locks it in — failure deducts a small XP penalty
- Dramatic countdown timer on active challenge card
- Completion triggers full-screen level-up style animation

### 7. Journal
- Free-form daily text entries
- Mood selector (1–5 emoji scale) attached to entry
- AI can generate weekly reflection summary from entries (credit-gated)
- Entry list with date grouping; search by keyword

### 8. Mood & Energy Tracker
- Quick daily log: mood / energy / sleep hours / focus level (all 1–5)
- Single-screen quick-entry (≤10 seconds to log)
- Correlation view: mood vs habit streak, energy vs XP earned

### 9. Stats & Analytics
- Line charts: each stat growth over 30 / 90 / 365 days (fl_chart)
- Heatmap: daily XP earned (GitHub-style contribution graph)
- Top stats radar chart
- XP velocity: average XP per day this week vs last week

### 10. AI Planner
- Entry point from Goal Planner and Dashboard
- Accepts: goal description, time budget per day, current weak stats
- Returns: structured quest plan + scheduling suggestions
- Adaptive difficulty: AI reviews last 7 days completion rate → adjusts new quest difficulty

### 11. Credit / Subscription System (Phase 4)
- Free tier: 5 habits, 10 AI calls/month
- Credits purchased via IAP
- Credit deduction happens only on successful AI response (same pattern as reelmake-ai)
- All credit mutations go through Cloud Function — never trust client-side balance

### 12. Notifications & Reminders
- Daily quest reminder (configurable time, default 8 AM)
- Habit check-in reminder (per-habit custom time)
- Streak danger alert (23:00 if habit not logged)
- Level-up push notification from Cloud Function (for async XP events)
- Motivational daily message (AI-generated, delivered via push)

---

## 🤖 AI Integration

### Provider Strategy

```
Primary:   Gemini 2.0 Flash  (Google AI Studio free tier — zero cost in dev)
Fallback:  GPT-4o-mini       (when budget opens or free quota exhausted)
Reserve:   Claude Haiku       (cheapest Anthropic option)
```

**All AI calls route through Cloud Functions proxy.** Flutter client never holds API keys. Provider config lives in Firestore `ai_providers` collection — swap model without app update.

### Cloud Functions AI Endpoints

| Function | Trigger | Description |
|----------|---------|-------------|
| `generateDailyQuests` | Scheduled (00:01 daily) | Pre-generates daily quests for all active users |
| `generateQuestPlan` | HTTP (callable) | Goal → milestone + quest breakdown |
| `generateWeeklyReport` | Scheduled (Sunday 23:00) | AI progress summary per user |
| `generateJournalInsight` | HTTP (callable) | Reflect on a journal entry |
| `generateMotivationalMessage` | Scheduled (07:45 daily) | Push notification content |

### AI Prompt Patterns

**Goal → Quest Plan prompt template:**

```
You are a personal development coach designing an RPG quest system.

User goal: {goalTitle}
Description: {goalDescription}  
Deadline: {deadline}
Domain: {domain}
Current stats: {statsJson}
Daily time available: {minutesPerDay} minutes

Return a JSON quest plan:
{
  "milestones": [
    {
      "title": string,
      "description": string,
      "estimatedDays": number,
      "quests": [
        {
          "title": string,
          "description": string,
          "type": "daily|weekly|side",
          "xpReward": number,
          "statGains": { "STAT_CODE": number },
          "estimatedMinutes": number
        }
      ]
    }
  ]
}

Rules:
- Total XP across all quests ≈ {totalXpBudget}
- statGains must use only: STR,VIT,AGI,INT,WIS,FOC,WLT,SAV,INV,CHA,EMP,NET,WIL,PER,CON
- Keep individual quest descriptions under 100 words
- Difficulty must be achievable in the stated daily time budget
```

### AI Service Abstraction

`lib/services/ai/ai_service.dart` defines an abstract interface:

```dart
abstract class AIService {
  Future<QuestPlan> generateQuestPlan(GoalPlanRequest request);
  Future<List<Quest>> generateDailyQuests(DailyQuestRequest request);
  Future<String> generateJournalInsight(String journalContent);
  Future<WeeklyReport> generateWeeklyReport(WeeklyReportRequest request);
}
```

`GeminiService` implements this interface. Provider config from Firestore selects which implementation is instantiated at app start.

---

## 💳 Monetization Model

### Free Tier
- Habit tracking: up to 5 habits
- Manual quest creation: unlimited
- AI calls: 10 per month
- Basic stats + level system
- Journal: unlimited entries (no AI insight)

### Premium Credits
- Purchased via in_app_purchase
- Required for: AI quest planning, AI journal insights, weekly AI reports, additional habits (beyond 5)

| Package | Credits | Price (USD) |
|---------|---------|------------|
| Starter | 20 | $2.99 |
| Popular | 60 | $7.99 |
| Pro | 200 | $19.99 |

### Credit Costs per AI Feature

| Feature | Credits |
|---------|---------|
| Goal → Quest Plan | 5 |
| Weekly Report | 3 |
| Journal Insight | 1 |
| Extra daily quest set | 2 |

### Subscription (Phase 4+)
- Monthly: $4.99/month — unlimited AI calls
- Yearly: $39.99/year — 33% discount

---

## 🏗️ Architecture Pattern

Clean Architecture with feature-based folder structure. Dependency flow: UI → Providers → Services → Firebase/AI. Inner layers never depend on outer layers.

```
Presentation (screens, widgets)
     ↓ depends on
State (Riverpod providers)
     ↓ depends on
Domain (services, RPG logic)
     ↓ depends on
Data (Firestore, Hive, Cloud Functions)
```

### Error Handling

Use a `Result<T>` sealed class pattern for all service returns:

```dart
sealed class Result<T> {
  const Result();
}

final class Success<T> extends Result<T> {
  final T data;
  const Success(this.data);
}

final class Failure<T> extends Result<T> {
  final String message;
  final Object? error;
  const Failure(this.message, {this.error});
}
```

All repository and service methods return `Future<Result<T>>`. Providers map this to `AsyncValue<T>` for UI consumption.

---

## 📁 Folder Structure

```
lib/
├── config/
│   ├── routes.dart                    # GoRouter config — all named routes
│   ├── theme.dart                     # Dark RPG ThemeData
│   └── constants.dart                 # App-wide constants (XP formula, stat codes, etc.)
│
├── models/                            # Freezed data classes with JSON serialization
│   ├── user_model.dart                # UserProfile: level, XP, class, title, stats, credits
│   ├── quest_model.dart               # Quest: type, domain, XP reward, stat gains, status
│   ├── habit_model.dart               # Habit: frequency, streak, domain, completion log
│   ├── goal_model.dart                # Goal: deadline, milestones, AI plan, linked quests
│   ├── challenge_model.dart           # Boss challenge: deadline, XP multiplier, penalty
│   ├── journal_entry.dart             # Journal entry: content, mood, AI insight
│   ├── mood_log.dart                  # Daily mood/energy/sleep/focus log
│   ├── credit_package.dart            # IAP package definition
│   ├── quest_plan.dart                # AI-generated quest plan (milestones + quests)
│   └── weekly_report.dart             # AI weekly summary model
│
├── providers/                         # Riverpod providers
│   ├── auth_provider.dart             # Firebase auth state stream
│   ├── user_provider.dart             # UserProfile stream from Firestore
│   ├── quest_provider.dart            # Quest CRUD + completion logic
│   ├── habit_provider.dart            # Habit CRUD + streak management
│   ├── goal_provider.dart             # Goal CRUD + AI planning
│   ├── challenge_provider.dart        # Boss challenge state
│   ├── journal_provider.dart          # Journal CRUD
│   ├── mood_provider.dart             # Mood log CRUD
│   ├── stats_provider.dart            # Derived stat analytics
│   └── credit_provider.dart          # Credit balance + IAP
│
├── screens/
│   ├── auth/
│   │   ├── login_screen.dart
│   │   └── signup_screen.dart
│   ├── home/
│   │   └── home_screen.dart           # Dashboard: stats summary, today's quests, active streak
│   ├── quests/
│   │   ├── quest_list_screen.dart     # Tabbed: Daily / Weekly / Main / Side / Boss
│   │   └── quest_detail_screen.dart   # Full quest view + complete button
│   ├── habits/
│   │   ├── habit_list_screen.dart
│   │   └── habit_detail_screen.dart   # History heatmap + streak stats
│   ├── goals/
│   │   ├── goal_list_screen.dart
│   │   ├── goal_detail_screen.dart    # Milestone progress + linked quests
│   │   └── goal_planner_screen.dart   # AI planning form + result display
│   ├── challenges/
│   │   └── challenge_screen.dart      # Active boss + accept/complete flow
│   ├── journal/
│   │   └── journal_screen.dart        # Entry list + new entry form
│   ├── mood/
│   │   └── mood_tracker_screen.dart   # Quick daily log
│   ├── profile/
│   │   └── profile_screen.dart        # Player card: class, title, all 15 stats
│   ├── stats/
│   │   └── stats_screen.dart          # Charts, radar, heatmap
│   ├── credits/
│   │   └── credits_screen.dart        # Balance + IAP packages
│   └── settings/
│       └── settings_screen.dart
│
├── services/
│   ├── firebase/
│   │   ├── auth_service.dart          # Firebase Auth wrapper
│   │   └── firestore_service.dart     # Firestore CRUD helpers
│   ├── ai/
│   │   ├── ai_service.dart            # Abstract AIService interface
│   │   ├── gemini_service.dart        # Gemini implementation (via Cloud Function)
│   │   └── ai_planner_service.dart    # High-level: goal → quest plan orchestration
│   ├── payment/
│   │   └── iap_service.dart           # in_app_purchase wrapper
│   ├── notification/
│   │   └── notification_service.dart  # FCM + local notifications
│   ├── local/
│   │   └── hive_service.dart          # Hive init + offline cache helpers
│   └── rpg/
│       ├── xp_service.dart            # XP gain, level threshold, level-up detection
│       └── stat_service.dart          # Stat gain accumulation, class computation
│
└── widgets/
    ├── rpg/
    │   ├── stat_bar_widget.dart       # Glowing RPG stat bar
    │   ├── level_badge_widget.dart    # Level number in hexagon badge
    │   ├── xp_progress_widget.dart    # XP bar with animated fill
    │   ├── quest_card_widget.dart     # Quest list item with swipe-to-complete
    │   ├── level_up_overlay.dart      # Full-screen dramatic level-up animation
    │   └── class_badge_widget.dart    # Player class icon + label
    └── common/
        ├── loading_widget.dart        # Glowing spinner (RPG style)
        └── error_widget.dart          # Error state with retry
```

---

## 📊 Data Models

### UserModel

```dart
@freezed
class UserModel with _$UserModel {
  const factory UserModel({
    required String id,
    required String email,
    String? displayName,
    String? photoUrl,
    @Default(1) int level,
    @Default(0) int xp,
    required int xpToNextLevel,
    @Default('Novice Hunter') String playerClass,
    @Default('First Arise') String activeTitle,
    @Default([]) List<String> unlockedTitles,
    @Default({}) Map<String, int> stats,  // e.g. {"STR": 5, "VIT": 3, ...}
    @Default(0) int credits,
    @Default(0) int totalQuestsCompleted,
    @Default(0) int currentStreak,
    required DateTime createdAt,
    required DateTime lastActiveAt,
  }) = _UserModel;

  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);
}
```

### QuestModel

```dart
enum QuestType { daily, weekly, main, side, boss }
enum QuestStatus { pending, active, completed, failed }
enum LifeDomain { physical, mental, financial, social, discipline }

@freezed
class QuestModel with _$QuestModel {
  const factory QuestModel({
    required String id,
    required String userId,
    required String title,
    String? description,
    required QuestType type,
    required LifeDomain domain,
    required int xpReward,
    @Default({}) Map<String, int> statGains,
    @Default(QuestStatus.pending) QuestStatus status,
    DateTime? deadline,
    DateTime? completedAt,
    @Default(false) bool aiGenerated,
    String? parentGoalId,
    String? parentMilestoneId,
  }) = _QuestModel;

  factory QuestModel.fromJson(Map<String, dynamic> json) =>
      _$QuestModelFromJson(json);
}
```

### HabitModel

```dart
enum HabitFrequency { daily, weekly }

@freezed
class HabitModel with _$HabitModel {
  const factory HabitModel({
    required String id,
    required String userId,
    required String title,
    String? description,
    required LifeDomain domain,
    required HabitFrequency frequency,
    @Default({}) Map<String, int> statGains,
    @Default(0) int streak,
    @Default(0) int longestStreak,
    @Default([]) List<String> completionLog,  // ISO date strings
    @Default(true) bool isActive,
    required DateTime createdAt,
  }) = _HabitModel;

  factory HabitModel.fromJson(Map<String, dynamic> json) =>
      _$HabitModelFromJson(json);
}
```

### GoalModel

```dart
@freezed
class Milestone with _$Milestone {
  const factory Milestone({
    required String id,
    required String title,
    String? description,
    @Default(false) bool completed,
    @Default([]) List<String> linkedQuestIds,
  }) = _Milestone;

  factory Milestone.fromJson(Map<String, dynamic> json) =>
      _$MilestoneFromJson(json);
}

@freezed
class GoalModel with _$GoalModel {
  const factory GoalModel({
    required String id,
    required String userId,
    required String title,
    String? description,
    required LifeDomain domain,
    required DateTime deadline,
    @Default([]) List<Milestone> milestones,
    String? aiPlanSummary,
    @Default('active') String status,  // active | completed | abandoned
    @Default(0) int xpReward,
    @Default({}) Map<String, int> statGains,
    required DateTime createdAt,
  }) = _GoalModel;

  factory GoalModel.fromJson(Map<String, dynamic> json) =>
      _$GoalModelFromJson(json);
}
```

### JournalEntry

```dart
@freezed
class JournalEntry with _$JournalEntry {
  const factory JournalEntry({
    required String id,
    required String userId,
    required String content,
    @Default(3) int mood,           // 1-5
    @Default(3) int energy,         // 1-5
    @Default([]) List<String> tags,
    String? aiInsight,
    required DateTime createdAt,
  }) = _JournalEntry;

  factory JournalEntry.fromJson(Map<String, dynamic> json) =>
      _$JournalEntryFromJson(json);
}
```

### MoodLog

```dart
@freezed
class MoodLog with _$MoodLog {
  const factory MoodLog({
    required String id,
    required String userId,
    required int mood,       // 1-5
    required int energy,     // 1-5
    required double sleep,   // hours
    required int focus,      // 1-5
    String? note,
    required String date,    // ISO date string YYYY-MM-DD
    required DateTime createdAt,
  }) = _MoodLog;

  factory MoodLog.fromJson(Map<String, dynamic> json) =>
      _$MoodLogFromJson(json);
}
```

---

## 🔥 Firestore Schema

```
users/{userId}
  displayName: string
  email: string
  photoUrl: string | null
  level: number
  xp: number
  xpToNextLevel: number
  playerClass: string
  activeTitle: string
  unlockedTitles: string[]
  stats: {
    STR: number, VIT: number, AGI: number,
    INT: number, WIS: number, FOC: number,
    WLT: number, SAV: number, INV: number,
    CHA: number, EMP: number, NET: number,
    WIL: number, PER: number, CON: number
  }
  credits: number
  totalQuestsCompleted: number
  currentStreak: number
  createdAt: timestamp
  lastActiveAt: timestamp

users/{userId}/quests/{questId}
  title: string
  description: string | null
  type: 'daily' | 'weekly' | 'main' | 'side' | 'boss'
  domain: 'physical' | 'mental' | 'financial' | 'social' | 'discipline'
  xpReward: number
  statGains: map<string, number>
  status: 'pending' | 'active' | 'completed' | 'failed'
  deadline: timestamp | null
  completedAt: timestamp | null
  aiGenerated: boolean
  parentGoalId: string | null
  parentMilestoneId: string | null
  createdAt: timestamp

users/{userId}/habits/{habitId}
  title: string
  description: string | null
  domain: string
  frequency: 'daily' | 'weekly'
  statGains: map<string, number>
  streak: number
  longestStreak: number
  completionLog: string[]     # ['2024-01-15', '2024-01-16', ...]
  isActive: boolean
  createdAt: timestamp

users/{userId}/goals/{goalId}
  title: string
  description: string | null
  domain: string
  deadline: timestamp
  milestones: [
    {
      id: string,
      title: string,
      description: string | null,
      completed: boolean,
      linkedQuestIds: string[]
    }
  ]
  aiPlanSummary: string | null
  status: 'active' | 'completed' | 'abandoned'
  xpReward: number
  statGains: map<string, number>
  createdAt: timestamp

users/{userId}/journal/{entryId}
  content: string
  mood: number                # 1-5
  energy: number              # 1-5
  tags: string[]
  aiInsight: string | null
  createdAt: timestamp

users/{userId}/mood_logs/{logId}
  mood: number
  energy: number
  sleep: number               # hours
  focus: number
  note: string | null
  date: string                # 'YYYY-MM-DD'
  createdAt: timestamp

users/{userId}/transactions/{txId}
  type: 'purchase' | 'spend' | 'bonus'
  amount: number              # positive = gain, negative = spend
  balanceBefore: number
  balanceAfter: number
  description: string
  featureUsed: string | null  # 'goal_plan' | 'journal_insight' | etc.
  createdAt: timestamp

ai_providers/{providerId}
  name: string                # 'Gemini 2.0 Flash'
  model: string               # 'gemini-2.0-flash'
  endpointFunction: string    # Cloud Function name
  isActive: boolean
  priority: number            # Lower = try first
  costPerCall: number         # USD cents, for internal tracking
  category: string            # 'quest_plan' | 'daily_quests' | 'journal' | 'report'
```

### Firestore Security Rules (outline)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only read/write their own document
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;

      match /quests/{questId} {
        allow read, write: if request.auth.uid == userId;
      }
      match /habits/{habitId} {
        allow read, write: if request.auth.uid == userId;
      }
      match /goals/{goalId} {
        allow read, write: if request.auth.uid == userId;
      }
      match /journal/{entryId} {
        allow read, write: if request.auth.uid == userId;
      }
      match /mood_logs/{logId} {
        allow read, write: if request.auth.uid == userId;
      }
      match /transactions/{txId} {
        allow read: if request.auth.uid == userId;
        allow write: if false;  // Only Cloud Functions write transactions
      }
    }

    // AI provider config — read-only for all authenticated users
    match /ai_providers/{doc} {
      allow read: if request.auth != null;
      allow write: if false;  // Admin SDK only
    }
  }
}
```

---

## 🗺️ Routing

All routes defined in `lib/config/routes.dart` using GoRouter.

```dart
// Route name constants
class AppRoutes {
  static const splash    = '/';
  static const login     = '/login';
  static const signup    = '/signup';
  static const home      = '/home';
  static const quests    = '/quests';
  static const questDetail = '/quests/:questId';
  static const habits    = '/habits';
  static const habitDetail = '/habits/:habitId';
  static const goals     = '/goals';
  static const goalDetail  = '/goals/:goalId';
  static const goalPlanner = '/goals/planner';
  static const challenges  = '/challenges';
  static const journal     = '/journal';
  static const mood        = '/mood';
  static const profile     = '/profile';
  static const stats       = '/stats';
  static const credits     = '/credits';
  static const settings    = '/settings';
}
```

GoRouter redirect:
- No auth → `/login`
- Authenticated on `/login` or `/signup` → `/home`

Bottom navigation bar (ShellRoute) covers: Home / Quests / Habits / Goals / Profile.

---

## 🔄 State Management

### Provider Architecture

All providers in `lib/providers/`. Use `@riverpod` annotation with code generation.

**Auth flow:**

```dart
@riverpod
Stream<User?> authState(AuthStateRef ref) {
  return ref.read(authServiceProvider).authStateChanges();
}
```

**User profile (Firestore stream):**

```dart
@riverpod
Stream<UserModel?> userProfile(UserProfileRef ref) {
  final user = ref.watch(authStateProvider).value;
  if (user == null) return Stream.value(null);
  return ref.read(firestoreServiceProvider).userStream(user.uid);
}
```

**Quest completion (mutation):**

```dart
@riverpod
class QuestNotifier extends _$QuestNotifier {
  @override
  Future<List<QuestModel>> build() async {
    final uid = ref.watch(authStateProvider).value?.uid;
    if (uid == null) return [];
    return ref.read(firestoreServiceProvider).getQuests(uid);
  }

  Future<void> completeQuest(String questId) async {
    // 1. Mark quest completed in Firestore
    // 2. Call xpService to apply XP gain
    // 3. Call statService to apply stat gains
    // 4. Check for level-up → trigger overlay
    // 5. Invalidate userProfile provider
  }
}
```

### AsyncValue Pattern in UI

```dart
ref.watch(questsProvider).when(
  data: (quests) => QuestListView(quests: quests),
  loading: () => const LoadingWidget(),
  error: (e, _) => ErrorWidget(message: e.toString(), onRetry: () => ref.invalidate(questsProvider)),
);
```

---

## 🎨 UI / Design System

### Color Palette

```dart
class AppColors {
  // Backgrounds
  static const background     = Color(0xFF0A0A0F);   // Near-black
  static const surface        = Color(0xFF12121A);   // Dark card surface
  static const surfaceVariant = Color(0xFF1A1A28);   // Slightly lighter

  // Neon accents
  static const neonBlue       = Color(0xFF00D4FF);   // Primary accent
  static const neonPurple     = Color(0xFF8B5CF6);   // Secondary accent
  static const neonGreen      = Color(0xFF00FF88);   // Success / XP gain
  static const neonRed        = Color(0xFFFF4444);   // Danger / fail
  static const neonGold       = Color(0xFFFFD700);   // Legendary / boss

  // Text
  static const textPrimary    = Color(0xFFE8E8FF);
  static const textSecondary  = Color(0xFF8888AA);
  static const textDisabled   = Color(0xFF444466);
}
```

### Typography

```dart
// Recommended fonts:
// Headers: 'Rajdhani' or 'Orbitron' (futuristic RPG feel)
// Body:    'Inter' or 'Nunito' (clean readability in dark mode)

TextTheme rpgTextTheme = TextTheme(
  displayLarge: TextStyle(
    fontFamily: 'Orbitron',
    fontSize: 32,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimary,
    letterSpacing: 2.0,
  ),
  headlineMedium: TextStyle(
    fontFamily: 'Rajdhani',
    fontSize: 22,
    fontWeight: FontWeight.w600,
    color: AppColors.neonBlue,
  ),
  bodyMedium: TextStyle(
    fontFamily: 'Inter',
    fontSize: 14,
    color: AppColors.textPrimary,
  ),
);
```

### Glow Effect Pattern

```dart
// Reusable BoxDecoration for glowing RPG elements
BoxDecoration glowDecoration({
  required Color glowColor,
  double borderRadius = 12,
  double blurRadius = 16,
  double spreadRadius = 2,
}) {
  return BoxDecoration(
    borderRadius: BorderRadius.circular(borderRadius),
    boxShadow: [
      BoxShadow(
        color: glowColor.withOpacity(0.4),
        blurRadius: blurRadius,
        spreadRadius: spreadRadius,
      ),
    ],
    border: Border.all(
      color: glowColor.withOpacity(0.6),
      width: 1,
    ),
  );
}
```

### Key UI Components

| Component | File | Description |
|-----------|------|-------------|
| `StatBarWidget` | `widgets/rpg/stat_bar_widget.dart` | Glowing horizontal bar with stat label, value, and animated fill |
| `LevelBadgeWidget` | `widgets/rpg/level_badge_widget.dart` | Hexagonal badge with level number in neon |
| `XPProgressWidget` | `widgets/rpg/xp_progress_widget.dart` | XP bar with animated fill and "X / Y XP" label |
| `QuestCardWidget` | `widgets/rpg/quest_card_widget.dart` | Swipeable quest card with domain color coding |
| `LevelUpOverlay` | `widgets/rpg/level_up_overlay.dart` | Full-screen animation overlay (Lottie + flutter_animate) |
| `ClassBadgeWidget` | `widgets/rpg/class_badge_widget.dart` | Player class icon + label with glow |

### Level-Up Animation Flow

1. `xpService.applyXP()` detects threshold crossed → returns `LevelUpEvent`
2. Provider emits event via `StateNotifier`
3. Home screen listens → shows `LevelUpOverlay` widget
4. Overlay: dark flash → panel-style "LEVEL UP" text → stat gain summary → dismiss

---

## 🔔 Notifications

### Scheduled Local Notifications

| Notification | Trigger | Content |
|-------------|---------|---------|
| Daily Quest Reminder | 08:00 (user-configurable) | "Your quests await, Hunter." |
| Habit Check-in | Per-habit custom time | "{Habit name} — maintain your streak!" |
| Streak Danger | 23:00 if habit not logged | "Warning: {habit} streak will break at midnight!" |
| Mood Log Reminder | 21:00 daily | "Log today's energy before you rest." |

### Push Notifications (FCM)

| Notification | Source | Content |
|-------------|--------|---------|
| Daily quest ready | Cloud Function (00:30) | "New quests generated. Time to rise." |
| Weekly report ready | Cloud Function (Monday 08:00) | "Your weekly report is ready." |
| Level-up confirmation | Cloud Function (after async XP) | "YOU HAVE LEVELED UP — Level {n} achieved." |
| Motivational message | Cloud Function (07:45) | AI-generated daily message |

---

## 🧠 Key Design Decisions

1. **All AI via Cloud Functions proxy** — API keys never on client. Enables model swap via Firestore config without app release.

2. **Gemini 2.0 Flash free tier first** — Zero AI cost during personal development phase. Clear upgrade path (GPT-4o-mini fallback) when monetizing. Provider abstraction means swap is config-only.

3. **AI quests pre-generated at midnight** — `generateDailyQuests` Cloud Function runs at 00:01. Users open the app at 8 AM to find quests ready — no cold-start AI latency. Fallback: on-demand generation if scheduled job missed.

4. **RPG stats tied to real domains** — Physical stats use manhwa naming (STR/VIT/AGI) for instant recognition. Financial (WLT/SAV/INV), Social (CHA/EMP/NET), Discipline (WIL/PER/CON) use custom codes — more meaningful than forcing RPG names.

5. **Offline-first for habits and journal** — Hive caches habit completion log and journal drafts locally. Syncs to Firestore when online. Core daily logging never blocked by network.

6. **Freemium gate at AI depth** — Basic tracking (habits, manual quests, journal) always free. AI-powered features (goal planner, weekly analysis, journal insights) require credits. Keeps basic utility free while monetizing power users.

7. **Dark RPG theme from day 1** — Not bolted on later. ThemeData, color system, and custom widgets all designed for dark RPG aesthetic from the first commit.

8. **Single Firebase project for personal use** — Start with one project (dev = prod). Split dev/prod environments before App Store submission.

9. **Credit mutations via Cloud Functions only** — Client never mutates credit balance directly. All spend/earn goes through callable Cloud Functions that validate and apply atomically. Prevents cheating.

10. **Class computed client-side, stored on profile** — Player class is derived from stats map — recomputed after every level-up and stored on `userModel.playerClass`. No separate collection needed.

---

## 🗓️ Phased Roadmap

### Phase 1 — MVP (Personal Use)
**Goal: Working app for personal daily use**

- [ ] Firebase project setup (Auth, Firestore, Functions)
- [ ] Auth screens (email/password + Google Sign-In)
- [ ] `UserModel` with stats, level, XP in Firestore
- [ ] Player profile screen (stats bars, level badge, XP bar)
- [ ] Manual habit tracking + streak counter
- [ ] Manual quest creation + completion (XP gain)
- [ ] `XPService` + `StatService` logic
- [ ] Level-up detection + overlay animation
- [ ] Dark RPG theme + core widget library
- [ ] GoRouter setup with auth redirect

**Deliverable:** Usable daily for habit/quest tracking. No AI yet.

---

### Phase 2 — AI Core
**Goal: AI-powered quest planning and daily quest generation**

- [ ] Cloud Functions project setup (Node.js + TypeScript)
- [ ] Gemini 2.0 Flash integration in Cloud Functions
- [ ] `generateQuestPlan` callable function (goal → milestones + quests)
- [ ] Goal Planner screen + AI plan display
- [ ] `generateDailyQuests` scheduled function (midnight cron)
- [ ] `generateWeeklyReport` scheduled function
- [ ] Journal screen + AI insight (callable function)
- [ ] AI provider config in Firestore `ai_providers`
- [ ] Credit system scaffolding (deduct on AI call, balance display)

**Deliverable:** AI generates quest plans and daily quests automatically.

---

### Phase 3 — Full RPG
**Goal: Complete RPG experience**

- [ ] Boss Challenge system (accept/complete/fail)
- [ ] Player class computation + class badge
- [ ] Title achievement system
- [ ] Mood & Energy tracker screen
- [ ] Stats & Analytics screen (fl_chart: line charts, radar, heatmap)
- [ ] Habit heatmap calendar view
- [ ] Adaptive difficulty (AI adjusts based on completion rate)
- [ ] Goal milestones progress tracking
- [ ] Offline-first Hive caching for habits/journal

**Deliverable:** Full RPG feel — classes, titles, boss fights, analytics.

---

### Phase 4 — Store Ready
**Goal: App Store + Play Store submission**

- [ ] Freemium credit system + IAP packages
- [ ] `in_app_purchase` integration (StoreKit + Play Billing)
- [ ] Credit transaction Cloud Function
- [ ] Onboarding flow (3-screen intro + initial goal setup)
- [ ] Push notifications (FCM + local) — all types
- [ ] Dev/prod Firebase project split
- [ ] Performance profiling + optimization
- [ ] Crashlytics + Analytics integration
- [ ] App Store / Play Store assets (screenshots, metadata)
- [ ] Privacy policy + Terms of Service screens

**Deliverable:** Ready for public store submission.

---

## 🏷️ App Name Alternatives

If "Solo Leveling" causes copyright issues (it likely will for store submission):

| Name | Vibe | Notes |
|------|------|-------|
| **Arise** | Direct Solo Leveling reference ("Arise") | Short, memorable, unlikely copyright issue — recommended |
| **Ascend** | Universal RPG growth feel | Clean, professional |
| **Shadow Ascent** | Dark + RPG, unique | More distinctive |
| **LevelArc** | Gamification + growth curve | Techy feel |
| **DailyArise** | Daily habit + SL reference | Longer but clear purpose |
| **Monarch** | Endgame SL title — "Shadow Monarch" | Powerful, aspirational |
| **Hunter** | SL universe term for leveled-up individuals | Recognizable to fans |

**Recommendation: "Arise"** — one word, strong, directly meaningful to Solo Leveling fans without trademark conflict (it is a common English word). Works as both an app name and a thematic command: *Arise, and face your quests.*

---

## ✅ Getting Started Checklist

For a developer starting from this document:

### Environment Setup
- [ ] Install Flutter 3.x + Dart 3.x
- [ ] `flutter create arise --org com.yourname.arise --platforms ios,android`
- [ ] Add all pubspec.yaml dependencies listed above
- [ ] Configure Android `minSdkVersion 26`, `targetSdkVersion 35` in `android/app/build.gradle`
- [ ] Configure iOS deployment target to 17.0 in Xcode

### Firebase Setup
- [ ] Create Firebase project at console.firebase.google.com
- [ ] Enable Authentication (Email/Password + Google)
- [ ] Create Firestore database (start in test mode, apply security rules after)
- [ ] Install FlutterFire CLI: `dart pub global activate flutterfire_cli`
- [ ] Run `flutterfire configure` to generate `firebase_options.dart`
- [ ] Download `google-services.json` → `android/app/`
- [ ] Download `GoogleService-Info.plist` → `ios/Runner/`

### Google Sign-In (Android)
- [ ] Add SHA-1 fingerprint of debug keystore to Firebase Android app
- [ ] `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`

### Fonts Setup
- [ ] Download Orbitron + Rajdhani + Inter from Google Fonts
- [ ] Add to `assets/fonts/` and register in `pubspec.yaml`

### Cloud Functions
- [ ] `npm install -g firebase-tools`
- [ ] `firebase init functions` (TypeScript)
- [ ] Set Gemini API key: `firebase functions:secrets:set GEMINI_API_KEY`

### First Build Order
1. `lib/config/theme.dart` — ThemeData with dark RPG colors
2. `lib/config/routes.dart` — GoRouter skeleton
3. `lib/models/` — All freezed models, run `build_runner`
4. `lib/services/firebase/` — Auth + Firestore services
5. `lib/providers/auth_provider.dart` — Auth state
6. `lib/screens/auth/` — Login + Signup screens
7. `lib/services/rpg/` — XP + Stat services
8. `lib/providers/user_provider.dart` — User profile stream
9. `lib/screens/home/home_screen.dart` — Dashboard
10. `lib/widgets/rpg/` — Stat bars, level badge, XP bar

---

## 🌐 Web Architecture (Arise Web)

> **Mục tiêu:** Build web version trước để validate concept, UX flow, và AI integration — trước khi đầu tư vào mobile app. Web dùng chung toàn bộ Firebase backend với mobile.

---

### 19.1 Tech Stack

| Layer | Technology | Ghi chú |
|-------|-----------|---------|
| Framework | Next.js 14+ (App Router) | SSR + SSG + Server Actions |
| Language | TypeScript | Strict mode |
| UI Components | shadcn/ui + Radix UI | Accessible, unstyled base |
| Styling | Tailwind CSS | Dark RPG theme, utility-first |
| Client State | Zustand | Auth state, UI overlays, level-up events |
| Server State | TanStack Query (React Query) | Quests, habits, goals — cache + sync |
| Auth | Firebase Auth SDK | Same provider as mobile |
| Database | Firestore SDK | Same schema as mobile |
| Cloud Logic | Firebase Cloud Functions | Same functions as mobile |
| Fonts | Google Fonts (next/font) | Orbitron + Inter |
| Deployment | Vercel | Preview per PR, auto-deploy on main |
| Error Tracking | Sentry (`@sentry/nextjs`) | |
| Analytics | Vercel Analytics + Firebase Analytics | |

---

### 19.2 Web vs Mobile — Delta

| Concern | Web (Next.js) | Mobile (Flutter) |
|---------|--------------|-----------------|
| Framework | Next.js 14 App Router | Flutter + Dart |
| State management | Zustand + TanStack Query | Riverpod |
| Routing | Next.js App Router (`app/`) | GoRouter |
| UI library | shadcn/ui + Tailwind | Custom RPG widgets |
| Payments | **Stripe** (Checkout) | IAP (StoreKit / Play Billing) |
| Notifications | Web Push (FCM web) | FCM + local notifications |
| Offline | TanStack Query cache | Hive (local storage) |
| Auth | Firebase Auth SDK (web) | Firebase Auth SDK (mobile) |
| Database | Firestore Web SDK | Firestore Mobile SDK |
| Cloud Functions | Same endpoints | Same endpoints |
| Animations | Framer Motion / CSS | flutter_animate + Lottie |

**Shared (không đổi):**
- Toàn bộ Firestore schema
- Cloud Functions (AI proxy, credit ledger, scheduled tasks)
- Firebase Auth configuration
- AI provider config trong Firestore `ai_providers`
- Business logic (XP formula, stat gains, class computation)

---

### 19.3 Folder Structure (Next.js)

```
arise-web/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout: providers, fonts, theme
│   ├── page.tsx                      # Redirect → /home or /login
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/                        # Protected routes (auth guard layout)
│   │   ├── layout.tsx                # Shell: sidebar nav + top bar
│   │   ├── home/page.tsx             # Dashboard: stats summary, today's quests
│   │   ├── quests/
│   │   │   ├── page.tsx              # Quest list (tabs: Daily/Weekly/Main/Side/Boss)
│   │   │   └── [questId]/page.tsx    # Quest detail
│   │   ├── habits/
│   │   │   ├── page.tsx
│   │   │   └── [habitId]/page.tsx
│   │   ├── goals/
│   │   │   ├── page.tsx
│   │   │   ├── [goalId]/page.tsx
│   │   │   └── planner/page.tsx      # AI Goal Planner
│   │   ├── challenges/page.tsx
│   │   ├── journal/page.tsx
│   │   ├── mood/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── stats/page.tsx
│   │   └── credits/page.tsx
│   └── api/                          # Route Handlers (nếu cần)
│       └── webhooks/
│           └── stripe/route.ts       # Stripe webhook handler
│
├── components/
│   ├── rpg/
│   │   ├── StatBar.tsx               # Glowing stat progress bar
│   │   ├── LevelBadge.tsx            # Hexagonal level badge
│   │   ├── XPProgress.tsx            # XP bar animated
│   │   ├── QuestCard.tsx             # Quest list item
│   │   ├── LevelUpOverlay.tsx        # Full-screen level-up animation
│   │   └── ClassBadge.tsx            # Player class icon + label
│   ├── ui/                           # shadcn/ui components (auto-generated)
│   └── layout/
│       ├── Sidebar.tsx               # Desktop sidebar nav
│       └── TopBar.tsx                # Mobile top bar + hamburger
│
├── lib/
│   ├── firebase/
│   │   ├── config.ts                 # Firebase init (client-side)
│   │   ├── auth.ts                   # Auth helpers
│   │   └── firestore.ts              # Firestore helpers + converters
│   ├── store/
│   │   ├── authStore.ts              # Zustand: auth state
│   │   └── uiStore.ts                # Zustand: level-up overlay, toasts
│   ├── queries/                      # TanStack Query hooks
│   │   ├── useQuests.ts
│   │   ├── useHabits.ts
│   │   ├── useGoals.ts
│   │   └── useUserProfile.ts
│   ├── rpg/
│   │   ├── xp.ts                     # XP formula, level threshold
│   │   └── stats.ts                  # Stat gains, class computation
│   └── stripe/
│       └── client.ts                 # Stripe.js init
│
├── hooks/
│   ├── useAuth.ts                    # Auth guard hook
│   └── useLevelUp.ts                 # Detect + trigger level-up overlay
│
├── types/
│   └── index.ts                      # TypeScript interfaces (mirror Dart models)
│
├── styles/
│   └── globals.css                   # Tailwind base + RPG CSS variables
│
├── public/
│   └── fonts/                        # Orbitron, Inter (fallback)
│
├── .env.local                        # Local dev secrets (gitignored)
├── .env.example                      # Template — commit này
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

### 19.4 SSR Strategy

| Route | Strategy | Lý do |
|-------|----------|-------|
| `/login`, `/signup` | Static (SSG) | Không cần auth, nhanh |
| `/home` (dashboard) | CSR | Realtime Firestore listeners |
| `/quests` | CSR | Realtime + user-specific |
| `/habits` | CSR | Daily state changes |
| `/goals/planner` | CSR | AI interaction, dynamic |
| `/stats` | CSR | Charts cần client-side rendering |
| `/profile` | CSR | User-specific, realtime |

> Tất cả routes trong `(app)/` đều là CSR với TanStack Query + Firestore listeners. SSR chỉ dùng cho auth pages và marketing pages (nếu có sau này).

---

### 19.5 Auth Guard

```typescript
// app/(app)/layout.tsx
// Server Component check: redirect nếu chưa auth
// Client Component: Firebase Auth listener → Zustand authStore
```

Dùng `next-firebase-auth-edge` để handle SSR-compatible auth cookie, hoặc đơn giản hơn: full CSR auth với Firebase SDK (phù hợp cho MVP).

---

### 19.6 Stripe Payment Flow (thay IAP)

```
User → /credits → chọn package
    → createCheckoutSession (Cloud Function)
    → redirect Stripe Checkout
    → Stripe webhook → /api/webhooks/stripe
    → Cloud Function verify → Firestore credits += N
    → User redirect về /credits?success=true
```

Credit packages (same pricing as mobile):
| Package | Credits | Price |
|---------|---------|-------|
| Starter | 20 | $2.99 |
| Popular | 60 | $7.99 |
| Pro | 200 | $19.99 |

---

### 19.7 Responsive Breakpoints

```
Mobile  < 768px   : Single column, bottom nav bar
Tablet  768–1024px: Two column, collapsible sidebar
Desktop > 1024px  : Fixed sidebar (240px) + main content
```

RPG UI phù hợp nhất trên **desktop/tablet** — dark theme, glowing stats, quest cards. Mobile web là "view only" MVP.

---

### 19.8 Payments — Web vs Mobile

| | Web | Mobile |
|---|---|---|
| Provider | Stripe | Apple/Google IAP |
| Setup | Stripe dashboard + webhook | App Store Connect + Play Console |
| Commission | 2.9% + $0.30 | 30% (15% nếu < $1M/year) |
| Testing | Stripe test mode | Sandbox accounts |
| Receipt verify | Stripe webhook (Cloud Function) | IAP webhook (Cloud Function) |

---

### 19.9 Deployment

```
GitHub repo
    ├── PR opened    → Vercel preview deploy (arise-web-[hash].vercel.app)
    ├── push main    → Vercel production deploy (arise.yourdomain.com)
    └── CI checks    → lint + type-check + build (GitHub Actions)

Firebase Functions → deploy riêng: firebase deploy --only functions
Firestore rules    → deploy riêng: firebase deploy --only firestore:rules
```

---

### 19.10 Web Phased Roadmap

#### Web Phase 1 — Validate Core Loop
- [ ] Next.js project setup + Firebase config
- [ ] Auth (login/signup) + Zustand authStore
- [ ] Dark RPG theme (Tailwind config + shadcn/ui override)
- [ ] Dashboard + Player profile (stats, level, XP bar)
- [ ] Manual habit tracking + streak counter
- [ ] Manual quest creation + completion
- [ ] XP/stat gain logic (port từ Dart → TypeScript)
- [ ] Level-up overlay animation (Framer Motion)
- [ ] Vercel deploy

**Deliverable:** Dùng được hàng ngày trên web. Validate UX trước khi làm mobile.

#### Web Phase 2 — AI + Credits
- [ ] Goal Planner + AI quest generation (same Cloud Functions)
- [ ] Daily quest display (từ scheduled Cloud Function)
- [ ] Stripe integration (credit packages)
- [ ] Credit balance + spend tracking

#### Web Phase 3 — Full Feature Parity
- [ ] Boss challenges, journal, mood tracker
- [ ] Stats & analytics (Recharts thay fl_chart)
- [ ] Notifications (Web Push via FCM)

---

*Document version: 1.1 — Added Web Architecture (Section 19)*
*App concept inspired by: Solo Leveling manhwa by Chugong*
*Architecture reference: ReelMake AI (AllCommerce) Flutter codebase patterns*
