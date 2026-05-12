import React from 'react'
import { useHistory } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '../store'

const RARITY_CONFIG = {
  common: {
    gradient: 'from-neutral-600/40 to-neutral-800/40',
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

export default function CapsuleInventoryScreen() {
  const history = useHistory()
  const { capsules, selectedCapsule, selectCapsule, wallet } = useStore()

  const isConnected = wallet?.connected

  return (
    <div className="min-h-screen pt-16 pb-28">
      <main id="main-content" className="px-5 py-4">
        <div className="app-container">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5"
          >
            <h1 className="font-display text-h2 text-white">My Capsules</h1>
            <p className="text-caption text-text-muted mt-0.5">
              {capsules.length} capsule{capsules.length !== 1 ? 's' : ''} in inventory
            </p>
          </motion.div>

          {/* Capsules Grid */}
          {capsules.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {capsules.map((capsule, index) => {
                const config = RARITY_CONFIG[capsule.rarity] || RARITY_CONFIG.common
                const isSelected = selectedCapsule === capsule.id

                return (
                  <motion.button
                    key={capsule.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => selectCapsule(capsule.id)}
                    className={`
                      relative p-4 rounded-2xl border text-left transition-all duration-200
                      bg-gradient-to-br ${config.gradient} ${config.border} ${config.glow}
                      ${isSelected ? 'ring-2 ring-primary-500 scale-[1.02]' : 'hover:scale-[1.02]'}
                    `}
                  >
                    {/* Rarity badge */}
                    <div
                      className="inline-block px-2 py-0.5 rounded-full mb-3"
                      style={{
                        backgroundColor: config.accentColor + '18',
                        border: `1px solid ${config.accentColor}30`
                      }}
                    >
                      <span className={`text-[9px] font-display font-bold tracking-[0.15em] ${config.textColor}`}>
                        {config.label}
                      </span>
                    </div>

                    {/* Capsule icon */}
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center mb-3"
                      style={{
                        backgroundColor: config.accentColor + '15',
                        border: `1.5px solid ${config.accentColor}40`
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={config.accentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m7.5 4.27 9 5.15"/>
                        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                        <path d="m3.3 7 8.7 5 8.7-5"/>
                      </svg>
                    </div>

                    {/* Name */}
                    <p className="font-display text-body-sm text-white font-medium truncate">
                      {capsule.name}
                    </p>

                    {/* Tier */}
                    <p className="text-caption text-text-muted mt-0.5">
                      Tier {capsule.tier}
                    </p>

                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary-500 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                    )}
                  </motion.button>
                )
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center py-16 bg-surface/40 rounded-2xl border border-white/5"
            >
              <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                  <path d="m7.5 4.27 9 5.15"/>
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                  <path d="m3.3 7 8.7 5 8.7-5"/>
                </svg>
              </div>
              <p className="text-body text-text-muted">No capsules yet</p>
              <p className="text-caption text-text-muted mt-1">Open capsules to fill your inventory</p>
              {isConnected && (
                <button
                  onClick={() => history.push('/gacha')}
                  className="mt-4 px-6 py-2.5 rounded-xl font-display text-body-sm font-semibold text-primary-500 bg-primary-500/10 border border-primary-500/30 hover:bg-primary-500/20 transition-colors"
                >
                  Open a Capsule
                </button>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
