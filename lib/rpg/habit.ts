/**
 * lib/rpg/habit.ts
 *
 * Pure RPG functions for habit streak logic.
 * Extracted from firestore.ts so they can be unit-tested without Firestore mocks.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CalculateStreakResult {
  newStreak: number
  wasFreezed: boolean
}

// ─── calculateStreak ──────────────────────────────────────────────────────────

/**
 * Calculate the new streak given an existing completion log and today's date.
 *
 * Algorithm:
 *  1. Build newLog = [...completionLog, today]
 *  2. If yesterday is in newLog → streak continues normally (newStreak = currentStreak + 1)
 *  3. Else check the 6 days before today (the 7-day window).
 *     If exactly 1 of those 6 days is missing AND currentStreak > 0
 *     → streak freeze applies: newStreak = currentStreak + 1, wasFreezed = true
 *  4. Else → streak resets: newStreak = 1, wasFreezed = false
 *
 * @param completionLog - existing log entries in 'YYYY-MM-DD' format (NOT including today)
 * @param today         - today's date string 'YYYY-MM-DD'
 * @param currentStreak - the habit's current streak value before this check-in
 */
export function calculateStreak(
  completionLog: string[],
  today: string,
  currentStreak: number
): CalculateStreakResult {
  const newLog = [...completionLog, today]

  // Compute relative date strings by offsetting from the today string directly.
  // Parsing 'YYYY-MM-DD' without a time component in Date() is treated as UTC
  // midnight, so we use UTC accessors to produce the offset date strings.
  const todayMs = Date.UTC(
    parseInt(today.slice(0, 4), 10),
    parseInt(today.slice(5, 7), 10) - 1,
    parseInt(today.slice(8, 10), 10)
  )

  const yesterday = offsetDate(todayMs, 1)

  // Path 1 — consecutive day
  if (newLog.includes(yesterday)) {
    return { newStreak: currentStreak + 1, wasFreezed: false }
  }

  // Path 2 — streak freeze: examine the 6 days prior to today
  const recentDays: string[] = []
  for (let i = 1; i <= 6; i++) {
    recentDays.push(offsetDate(todayMs, i))
  }

  const missedDays = recentDays.filter((d) => !newLog.includes(d))

  if (missedDays.length === 1 && currentStreak > 0) {
    return { newStreak: currentStreak + 1, wasFreezed: true }
  }

  // Path 3 — streak broken
  return { newStreak: 1, wasFreezed: false }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Return the date string 'YYYY-MM-DD' for the date that is `daysBack` days
 * before the UTC midnight represented by `baseMs`.
 */
function offsetDate(baseMs: number, daysBack: number): string {
  const d = new Date(baseMs - daysBack * 86_400_000)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
