export const STAT_CODES = [
  'STR', 'VIT', 'AGI',  // Physical
  'INT', 'WIS', 'FOC',  // Mental
  'WLT', 'SAV', 'INV',  // Financial
  'CHA', 'EMP', 'NET',  // Social
  'WIL', 'PER', 'CON',  // Discipline
] as const

export type StatCode = typeof STAT_CODES[number]

export type StatsMap = Partial<Record<StatCode, number>>

export function computePlayerClass(stats: StatsMap): string {
  const physical = (stats.STR ?? 0) + (stats.VIT ?? 0) + (stats.AGI ?? 0)
  const mental = (stats.INT ?? 0) + (stats.WIS ?? 0) + (stats.FOC ?? 0)
  const financial = (stats.WLT ?? 0) + (stats.SAV ?? 0) + (stats.INV ?? 0)
  const social = (stats.CHA ?? 0) + (stats.EMP ?? 0) + (stats.NET ?? 0)
  const discipline = (stats.WIL ?? 0) + (stats.PER ?? 0) + (stats.CON ?? 0)

  const clusters = { physical, mental, financial, social, discipline }
  const max = Math.max(...Object.values(clusters))
  if (max === 0) return 'Novice Hunter'

  const classMap: Record<string, string> = {
    physical: 'Iron Body',
    mental: 'Shadow Scholar',
    social: 'Silver Tongue',
    discipline: 'Iron Will',
    financial: 'Coin Sovereign',
  }

  const dominant = Object.entries(clusters).find(([, v]) => v === max)
  return dominant ? classMap[dominant[0]] : 'Novice Hunter'
}
