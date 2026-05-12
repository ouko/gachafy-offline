import React from 'react'
import { useStore } from '../../store'

const tiers = ['common', 'rare', 'epic', 'legendary']

const TIER_CONFIG = {
  common: { label: 'Common', color: 'bg-neutral-600', glow: '' },
  rare: { label: 'Rare', color: 'bg-accent-cyan', glow: 'shadow-glow-cyan' },
  epic: { label: 'Epic', color: 'bg-secondary-500', glow: 'shadow-glow-violet' },
  legendary: { label: 'Legendary', color: 'bg-primary-500', glow: 'shadow-glow-pink' }
}

export default function TierSelector() {
  const { selectedTier, selectTier, wallet, transactionStatus } = useStore()
  
  const isDisabled = !wallet?.connected || transactionStatus === 'pending' || transactionStatus === 'committing'
  
  return (
    <div 
      className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 scrollbar-hide"
      role="radiogroup"
      aria-label="Select capsule rarity"
    >
      {tiers.map((tier) => {
        const config = TIER_CONFIG[tier]
        const isSelected = selectedTier === tier
        
        return (
          <button
            key={tier}
            onClick={() => selectTier(tier)}
            disabled={isDisabled}
            className={`tap-target snap-center shrink-0 rounded-xl px-4 py-2.5 font-display text-body-sm font-semibold
              transition-all duration-200
              ${isSelected 
                ? `${config.color} text-white ${config.glow} ring-2 ring-white/20` 
                : 'bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white border border-white/10'
              }
              disabled:opacity-40 disabled:cursor-not-allowed`}
            role="radio"
            aria-checked={isSelected}
            aria-label={config.label}
          >
            <span className="flex items-center gap-2">
              <span 
                className={`h-2 w-2 rounded-full ${config.color}`} 
                aria-hidden="true"
              />
              {config.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
