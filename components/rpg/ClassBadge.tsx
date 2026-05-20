interface ClassConfig {
  icon: string
  color: string
  description: string
}

const CLASS_CONFIG: Record<string, ClassConfig> = {
  'Iron Body': {
    icon: '⚔️',
    color: '#FF4444',
    description: 'Thống trị thể chất',
  },
  'Shadow Scholar': {
    icon: '📚',
    color: '#8B5CF6',
    description: 'Bậc thầy tri thức',
  },
  'Silver Tongue': {
    icon: '💬',
    color: '#00FF88',
    description: 'Nghệ nhân giao tiếp',
  },
  'Iron Will': {
    icon: '🔥',
    color: '#FFD700',
    description: 'Ý chí thép',
  },
  'Coin Sovereign': {
    icon: '💰',
    color: '#FFD700',
    description: 'Chúa tể tài chính',
  },
  'Novice Hunter': {
    icon: '🗡️',
    color: '#8888AA',
    description: 'Đang hình thành con đường',
  },
}

const FALLBACK_CONFIG = CLASS_CONFIG['Novice Hunter']

/** Chuyển hex 6-digit sang rgba string. Hoisted ra ngoài component để tránh tạo lại mỗi render. */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

interface ClassBadgeProps {
  playerClass: string
  className?: string
}

export default function ClassBadge({
  playerClass,
  className = '',
}: ClassBadgeProps) {
  const config = CLASS_CONFIG[playerClass] ?? FALLBACK_CONFIG
  const displayClass = CLASS_CONFIG[playerClass] ? playerClass : 'Novice Hunter'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 border font-display text-xs tracking-wide ${className}`}
      title={config.description}
      style={{
        borderColor: config.color,
        color: config.color,
        backgroundColor: hexToRgba(config.color, 0.1),
      }}
    >
      <span>{config.icon}</span>
      <span>{displayClass}</span>
    </span>
  )
}
