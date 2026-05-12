import { motion } from 'framer-motion'

const RARITY_CONFIG = {
  common: { 
    gradient: 'from-neutral-700/80 to-neutral-900/80',
    border: 'border-neutral-600/50',
    glow: '',
    label: 'COMMON',
    textColor: 'text-neutral-400',
    accentColor: '#9CA3AF'
  },
  rare: { 
    gradient: 'from-accent-cyan/20 to-accent-cyan/5',
    border: 'border-accent-cyan/40',
    glow: 'shadow-glow-cyan',
    label: 'RARE',
    textColor: 'text-accent-cyan',
    accentColor: '#00F0FF'
  },
  epic: { 
    gradient: 'from-secondary-500/25 to-secondary-500/5',
    border: 'border-secondary-500/40',
    glow: 'shadow-glow-violet',
    label: 'EPIC',
    textColor: 'text-secondary-500',
    accentColor: '#B829F7'
  },
  legendary: { 
    gradient: 'from-primary-500/30 to-secondary-500/15',
    border: 'border-primary-500/50',
    glow: 'shadow-glow-pink',
    label: 'LEGENDARY',
    textColor: 'text-primary-500',
    accentColor: '#FF006E'
  }
}

export default function LootCardStack({ items = [] }) {
  if (items.length === 0) {
    return (
      <div 
        className="flex flex-col items-center justify-center h-64 w-64 rounded-2xl bg-surface/60 backdrop-blur-md border border-white/10"
        role="status"
      >
        <p className="text-body text-text-muted">No items yet</p>
      </div>
    )
  }

  const mainItem = items[0]
  const config = RARITY_CONFIG[mainItem.rarity] || RARITY_CONFIG.common

  return (
    <div className="relative" role="list" aria-label="Revealed items">
      {/* Background glow for legendary/epic */}
      {(mainItem.rarity === 'legendary' || mainItem.rarity === 'epic') && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 blur-3xl rounded-full"
          style={{ 
            background: config.accentColor,
            transform: 'scale(1.5)',
            opacity: 0.2
          }}
          aria-hidden="true"
        />
      )}

      {items.map((item, index) => {
        const itemConfig = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common
        const rotation = (index - items.length / 2) * 5
        const isMain = index === 0
        
        return (
          <motion.div
            key={item.id}
            initial={{ scale: 0.3, opacity: 0, rotate: rotation, y: 60 }}
            animate={{ 
              scale: 1, 
              opacity: isMain ? 1 : 0.7, 
              rotate: rotation,
              y: 0 
            }}
            transition={{ 
              delay: index * 0.15 + 0.3,
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1]
            }}
            className={`
              relative w-64 h-72 rounded-2xl bg-gradient-to-br ${itemConfig.gradient}
              border ${itemConfig.border} ${itemConfig.glow}
              p-6 flex flex-col items-center justify-center text-center
            `}
            style={{
              boxShadow: isMain ? `0 0 40px ${itemConfig.accentColor}25, inset 0 1px 0 rgba(255,255,255,0.05)` : 'none'
            }}
            role="listitem"
            aria-label={`${item.name}, ${itemConfig.label} rarity`}
          >
            {/* Rarity badge */}
            <div 
              className="px-3 py-1 rounded-full mb-4"
              style={{ 
                backgroundColor: itemConfig.accentColor + '18',
                border: `1px solid ${itemConfig.accentColor}30`
              }}
            >
              <span className={`text-[10px] font-display font-bold tracking-[0.15em] ${itemConfig.textColor}`}>
                {itemConfig.label}
              </span>
            </div>

            {/* Item icon placeholder */}
            <div 
              className="h-20 w-20 rounded-2xl flex items-center justify-center mb-4"
              style={{ 
                backgroundColor: itemConfig.accentColor + '15',
                border: `2px solid ${itemConfig.accentColor}40`,
                boxShadow: `0 0 24px ${itemConfig.accentColor}20`
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={itemConfig.accentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>

            {/* Item name */}
            <span className="font-display text-h3 text-white">{item.name}</span>
          </motion.div>
        )
      })}
    </div>
  )
}
