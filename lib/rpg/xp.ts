/**
 * XP formula: xpRequired(level) = 100 * (level ^ 1.5)
 */
export function xpRequiredForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5))
}

export function calculateLevel(totalXp: number): number {
  let level = 1
  while (totalXp >= xpRequiredForLevel(level + 1)) {
    level++
  }
  return level
}
