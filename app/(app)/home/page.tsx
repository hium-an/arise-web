export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h1 className="font-display text-4xl font-black tracking-[0.2em] text-neon-blue [text-shadow:0_0_20px_rgba(0,212,255,0.6)]">
        ARISE
      </h1>
      <p className="text-text-secondary text-sm tracking-wide">
        Dashboard — <span className="text-neon-blue/70">coming soon</span>
      </p>
      <div
        aria-hidden="true"
        className="w-16 h-px bg-gradient-to-r from-transparent via-neon-blue/50 to-transparent"
      />
      <p className="text-text-disabled text-xs font-display tracking-widest uppercase">
        W4 in progress
      </p>
    </div>
  )
}
