export default function SPBalance({ balance = 0 }) {
  return (
    <div
      className="rounded-xl bg-background-light p-4 opacity-0 translate-y-5 transition-all duration-300"
      style={{
        opacity: 1,
        transform: 'translateY(0)'
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-sm text-text-secondary">SP Balance</span>
        <span className="font-display text-xl text-success">{balance.toFixed(2)}</span>
      </div>
    </div>
  )
}
