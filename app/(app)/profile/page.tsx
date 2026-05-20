import type { UserProfile } from '@/types'
import StatBar from '@/components/rpg/StatBar'
import LevelBadge from '@/components/rpg/LevelBadge'
import XPProgress from '@/components/rpg/XPProgress'
import ClassBadge from '@/components/rpg/ClassBadge'

// Mock data — thay bằng Firestore query ở W5+
const MOCK_PROFILE: UserProfile = {
  id: 'mock',
  email: 'hunter@arise.io',
  displayName: 'Lê Trung Hiếu',
  photoUrl: undefined,
  level: 7,
  xp: 287,           // XP tích lũy trong level hiện tại (within-level)
  xpToNextLevel: 410, // xpRequiredForLevel(8) - xpRequiredForLevel(7) = delta
  playerClass: 'Shadow Scholar',
  activeTitle: 'Người Học Không Ngừng',
  unlockedTitles: ['Người Học Không Ngừng', 'Mới Bắt Đầu'],
  stats: {
    STR: 22,
    VIT: 18,
    AGI: 15,
    INT: 45,
    WIS: 38,
    FOC: 41,
    WLT: 20,
    SAV: 25,
    INV: 18,
    CHA: 28,
    EMP: 30,
    NET: 22,
    WIL: 35,
    PER: 32,
    CON: 28,
  },
  credits: 150,
  totalQuestsCompleted: 47,
  currentStreak: 12,
  createdAt: new Date('2026-01-15'),
  lastActiveAt: new Date(),
}

type StatGroupConfig = {
  label: string
  stats: Array<{ code: keyof typeof MOCK_PROFILE.stats; glowColor: string }>
  glowColor: string
}

const STAT_GROUPS: StatGroupConfig[] = [
  {
    label: 'Physical',
    glowColor: '#FF4444',
    stats: [
      { code: 'STR', glowColor: '#FF4444' },
      { code: 'VIT', glowColor: '#FF4444' },
      { code: 'AGI', glowColor: '#FF4444' },
    ],
  },
  {
    label: 'Mental',
    glowColor: '#8B5CF6',
    stats: [
      { code: 'INT', glowColor: '#8B5CF6' },
      { code: 'WIS', glowColor: '#8B5CF6' },
      { code: 'FOC', glowColor: '#8B5CF6' },
    ],
  },
  {
    label: 'Financial',
    glowColor: '#FFD700',
    stats: [
      { code: 'WLT', glowColor: '#FFD700' },
      { code: 'SAV', glowColor: '#FFD700' },
      { code: 'INV', glowColor: '#FFD700' },
    ],
  },
  {
    label: 'Social',
    glowColor: '#00FF88',
    stats: [
      { code: 'CHA', glowColor: '#00FF88' },
      { code: 'EMP', glowColor: '#00FF88' },
      { code: 'NET', glowColor: '#00FF88' },
    ],
  },
  {
    label: 'Discipline',
    glowColor: '#00D4FF',
    stats: [
      { code: 'WIL', glowColor: '#00D4FF' },
      { code: 'PER', glowColor: '#00D4FF' },
      { code: 'CON', glowColor: '#00D4FF' },
    ],
  },
]

function formatJoinDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function AvatarCircle({
  displayName,
  photoUrl,
}: {
  displayName?: string
  photoUrl?: string
}) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={displayName ?? 'Avatar'}
        className="w-20 h-20 rounded-full border-2 border-neon-blue object-cover flex-shrink-0"
        style={{ boxShadow: '0 0 16px rgba(0,212,255,0.4)' }}
      />
    )
  }

  const initials =
    (displayName ?? '')
      .split(' ')
      .filter((w) => w.length > 0)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'H'

  return (
    <div
      role="img"
      aria-label={displayName ? `${displayName} avatar` : 'Hunter avatar'}
      className="w-20 h-20 rounded-full border-2 border-neon-blue bg-surface-variant flex items-center justify-center flex-shrink-0"
      style={{ boxShadow: '0 0 16px rgba(0,212,255,0.4)' }}
    >
      <span className="font-display text-xl font-bold text-neon-blue select-none" aria-hidden="true">
        {initials}
      </span>
    </div>
  )
}

export default function ProfilePage() {
  const profile = MOCK_PROFILE

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header: Avatar + Name */}
      <section aria-label="Hunter identity">
        <div className="flex items-center gap-4">
          <AvatarCircle
            displayName={profile.displayName}
            photoUrl={profile.photoUrl}
          />
          <div className="flex flex-col gap-0.5 min-w-0">
            <h1 className="font-display text-xl font-bold text-white truncate">
              {profile.displayName ?? 'Hunter'}
            </h1>
            <p className="text-xs text-text-secondary truncate">{profile.email}</p>
          </div>
        </div>
      </section>

      {/* Level + Class row */}
      <section aria-label="Level and class">
        <div className="flex flex-wrap items-center gap-4">
          <LevelBadge level={profile.level} size="lg" />
          <div className="flex flex-col gap-2">
            <ClassBadge playerClass={profile.playerClass} />
            <p className="text-xs italic text-text-secondary">
              &ldquo;{profile.activeTitle}&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* XP Bar */}
      <section aria-label="Experience progress">
        <XPProgress
          currentXP={profile.xp}
          xpToNextLevel={profile.xpToNextLevel}
        />
      </section>

      {/* Stats Grid */}
      <section aria-label="Character stats">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {STAT_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-col gap-2">
              <span
                className="font-display text-[9px] uppercase tracking-widest"
                style={{ color: group.glowColor }}
                aria-hidden="true"
              >
                {group.label}
              </span>
              <div
                role="group"
                aria-label={`${group.label} stats`}
                className="flex flex-col gap-2"
              >
                {group.stats.map(({ code, glowColor }) => (
                  <StatBar
                    key={code}
                    statCode={code}
                    value={profile.stats[code] ?? 0}
                    maxValue={100}
                    glowColor={glowColor}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer stats */}
      <section
        aria-label="Activity summary"
        className="flex flex-wrap gap-6 border-t border-surface-variant pt-4"
      >
        <dl className="flex flex-wrap gap-6">
          <div className="flex flex-col gap-0.5">
            <dt className="font-display text-[10px] uppercase tracking-widest text-text-secondary">
              Quests
            </dt>
            <dd className="font-display text-sm font-bold text-neon-gold">
              {profile.totalQuestsCompleted} Completed
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="font-display text-[10px] uppercase tracking-widest text-text-secondary">
              Streak
            </dt>
            <dd className="font-display text-sm font-bold text-neon-green">
              {profile.currentStreak} ngày
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="font-display text-[10px] uppercase tracking-widest text-text-secondary">
              Tham gia
            </dt>
            <dd className="font-display text-sm font-bold text-text-secondary">
              {formatJoinDate(profile.createdAt)}
            </dd>
          </div>
        </dl>
      </section>
    </main>
  )
}
