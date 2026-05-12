import { motion } from 'framer-motion'

const RARITY_CONFIG = {
  common: { 
    label: 'Common', 
    border: 'border-neutral-700',
    glow: '',
    badgeBg: 'bg-neutral-800',
    badgeText: 'text-neutral-400'
  },
  rare: { 
    label: 'Rare', 
    border: 'border-accent-cyan/40',
    glow: 'shadow-glow-cyan',
    badgeBg: 'bg-accent-cyan/15',
    badgeText: 'text-accent-cyan'
  },
  epic: { 
    label: 'Epic', 
    border: 'border-secondary-500/40',
    glow: 'shadow-glow-violet',
    badgeBg: 'bg-secondary-500/15',
    badgeText: 'text-secondary-500'
  },
  legendary: { 
    label: 'Legendary', 
    border: 'border-primary-500/50',
    glow: 'shadow-glow-pink',
    badgeBg: 'bg-primary-500/15',
    badgeText: 'text-primary-500'
  }
}

export default function CosmeticsGrid({ items = [] }) {
  if (items.length === 0) {
    return (
      <div 
        className="flex flex-col items-center justify-center py-12 px-4 rounded-2xl bg-surface/40 border border-dashed border-white/10"
        role="status"
      >
        <div className="h-14 w-14 rounded-full bg-white/5 flex items-center justify-center mb-3" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.29 7 12 12 20.71 7"/>
            <line x1="12" y1="22" x2="12" y2="12"/>
          </svg>
        </div>
        <p className="text-body text-text-muted">No cosmetics yet</p>
        <p className="mt-1 text-body-sm text-text-muted">Open capsules to collect</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" role="list" aria-label="Cosmetics">
      {items.map((cosmetic, index) => {
        const rarityConfig = RARITY_CONFIG[cosmetic.rarity] || RARITY_CONFIG.common
        
        return (
          <motion.div
            key={cosmetic.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: index * 0.1,
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1]
            }}
            className={`
              relative rounded-2xl bg-surface/60 backdrop-blur-sm border p-3
              aspect-square flex flex-col items-center justify-center
              hover:bg-surface-elevated/80 transition-colors duration-200
              ${rarityConfig.border} ${rarityConfig.glow}
            `}
            role="listitem"
          >
            {/* Rarity badge */}
            <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-md ${rarityConfig.badgeBg}`}>
              <span className={`text-[9px] font-display font-bold uppercase tracking-wider ${rarityConfig.badgeText}`}>
                {rarityConfig.label}
              </span>
            </div>

            {/* Item icon */}
            <div 
              className="h-14 w-14 rounded-xl flex items-center justify-center text-white font-display text-xl"
              style={{ 
                backgroundColor: cosmetic.hex + '25',
                border: `2px solid ${cosmetic.hex}60`,
                boxShadow: `0 0 16px ${cosmetic.hex}30`
              }}
              aria-hidden="true"
            >
              {cosmetic.style.charAt(0)}
            </div>
            
            {/* Name */}
            <span className="mt-2.5 font-display text-body-sm text-white font-medium">{cosmetic.style}</span>
          </motion.div>
        )
      })}
    </div>
  )
}
