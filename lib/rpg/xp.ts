/**
 * XP formula: xpRequired(level) = 100 * (level ^ 1.5)
 */

export const MAX_LEVEL = 999

export function xpRequiredForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5))
}

export function calculateLevel(totalXp: number): number {
  let level = 1
  while (level < MAX_LEVEL && totalXp >= xpRequiredForLevel(level + 1)) {
    level++
  }
  return level
}

/**
 * Kiểm tra level-up từ totalXP.
 * Xử lý multi-level-up: nếu XP đủ để vượt nhiều level cùng lúc,
 * trả về đúng level cuối cùng thay vì chỉ +1.
 */
export function checkLevelUp(currentXP: number, currentLevel: number): number {
  if (currentLevel >= MAX_LEVEL) return MAX_LEVEL
  const newLevel = calculateLevel(currentXP)
  return Math.max(currentLevel, newLevel)
}
