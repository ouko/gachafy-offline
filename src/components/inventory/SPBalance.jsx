import { motion } from 'framer-motion'

export default function SPBalance({ balance = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl bg-surface/60 backdrop-blur-md border border-white/10 p-4"
      role="region"
      aria-label="SP Balance"
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="block text-caption text-text-muted uppercase tracking-wider font-medium">SP Points</span>
          <span className="block mt-1 font-display text-h2 text-accent-lime" style={{ textShadow: '0 0 20px rgba(57,255,20,0.3)' }}>
            {balance.toFixed(2)}
          </span>
        </div>
        <div 
          className="h-12 w-12 rounded-xl bg-accent-lime/10 flex items-center justify-center border border-accent-lime/20"
          aria-hidden="true"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-lime">
            <circle cx="12" cy="8" r="6"/>
            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
          </svg>
        </div>
      </div>
    </motion.div>
  )
}
