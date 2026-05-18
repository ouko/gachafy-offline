import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import MotionLootBurst from '../components/reveal/MotionLootBurst'
import LootCardStack from '../components/reveal/LootCardStack'

const RARITY_CONFIG = {
  common: {
    label: 'COMMON',
    color: '#9CA3AF',
    gradient: 'from-neutral-600 to-neutral-800',
    glow: 'shadow-none',
    vibe: 'bg-neutral-500/10'
  },
  rare: {
    label: 'RARE',
    color: '#00F0FF',
    gradient: 'from-accent-cyan/30 to-accent-cyan/10',
    glow: 'shadow-glow-cyan',
    vibe: 'bg-accent-cyan/10'
  },
  epic: {
    label: 'EPIC',
    color: '#B829F7',
    gradient: 'from-secondary-500/40 to-secondary-500/20',
    glow: 'shadow-glow-violet',
    vibe: 'bg-secondary-500/10'
  },
  legendary: {
    label: 'LEGENDARY',
    color: '#FF006E',
    gradient: 'from-primary-500/50 to-secondary-500/30',
    glow: 'shadow-glow-pink',
    vibe: 'bg-primary-500/10'
  }
}

export default function Reveal() {
  const history = useHistory()
  const { selectedTier, completeLootReveal, lastOpenedTier, addCapsule } = useStore()
  const [revealed, setRevealed] = useState(false)
  const [items, setItems] = useState([])

  // Generate loot on mount based on the last opened tier
  useEffect(() => {
    const tier = lastOpenedTier || selectedTier
    if (!tier) {
      history.push('/')
      return
    }

    const rarityWeights = {
      8: [0.6, 0.3, 0.08, 0.02],
      15: [0.4, 0.35, 0.2, 0.05],
      25: [0.25, 0.35, 0.3, 0.1],
      common: [0.7, 0.2, 0.08, 0.02],
      rare: [0.4, 0.4, 0.15, 0.05],
      epic: [0.2, 0.3, 0.35, 0.15],
      legendary: [0.1, 0.2, 0.3, 0.4]
    }

    const names = {
      common: ['Space Dust', 'Rusty Bolt', 'Empty Canister', 'Scrap Metal'],
      rare: ['Stardust', 'Cosmic Shard', 'Nebula Fragment', 'Star Fragment'],
      epic: ['Galaxy Core', 'Void Crystal', 'Supernova Remnant', 'Dark Matter'],
      legendary: ['Cosmic Fragment', 'Eternity Stone', 'Universal Key', 'Singularity']
    }

    const weights = rarityWeights[tier] || rarityWeights[8]
    const rand = Math.random()
    let cumulative = 0
    let rarityIndex = 0
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i]
      if (rand <= cumulative) {
        rarityIndex = i
        break
      }
    }

    const rarity = ['common', 'rare', 'epic', 'legendary'][rarityIndex]
    const namePool = names[rarity]
    const mainName = namePool[Math.floor(Math.random() * namePool.length)]

    const generatedItems = [
      { id: 1, name: mainName, rarity },
      { id: 2, name: names.common[Math.floor(Math.random() * names.common.length)], rarity: 'common' },
      { id: 3, name: names.common[Math.floor(Math.random() * names.common.length)], rarity: 'common' }
    ]

    setItems(generatedItems)

    addCapsule({
      id: `capsule_${Date.now()}`,
      name: mainName,
      rarity,
      tier,
      openedAt: Date.now()
    })
  }, [lastOpenedTier, selectedTier, history, addCapsule])

  const mainItem = items[0] || { name: 'Mystery Item', rarity: 'common' }
  const rarity = RARITY_CONFIG[mainItem.rarity] || RARITY_CONFIG.common

  const handleRevealComplete = () => {
    setRevealed(true)
    completeLootReveal(selectedTier, mainItem.rarity)
  }

  const handleInventory = () => {
    history.push('/capsules')
  }

  const handleAgain = () => {
    history.push('/')
  }

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center px-5 transition-colors duration-1000 ${revealed ? rarity.vibe : 'bg-transparent'}`}>
      <main id="main-content" className="app-container flex flex-col items-center w-full max-w-md">

        <AnimatePresence mode="wait">
          {!revealed ? (
            <motion.section
              key="burst"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.5, filter: 'blur(20px)' }}
              transition={{ duration: 0.6 }}
              aria-label="Loot reveal"
              className="flex flex-col items-center"
            >
              <MotionLootBurst onComplete={handleRevealComplete} />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-8 text-center"
              >
                <p className="font-display font-black text-2xl text-white tracking-widest animate-pulse">OPENING...</p>
              </motion.div>
            </motion.section>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, type: "spring", damping: 15 }}
              className="flex flex-col items-center w-full"
            >
              {/* Rarity banner with drama */}
              <motion.div
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mb-8"
              >
                <div
                  className="px-8 py-2.5 rounded-full border-2 relative"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    borderColor: rarity.color,
                    boxShadow: `0 0 40px ${rarity.color}60, inset 0 0 20px ${rarity.color}40`
                  }}
                >
                  <span
                    className="font-display text-base font-black tracking-[0.3em] italic"
                    style={{
                      color: rarity.color,
                      textShadow: `0 0 10px ${rarity.color}`
                    }}
                  >
                    {rarity.label}
                  </span>
                </div>
              </motion.div>

              {/* Loot cards */}
              <div className="w-full relative py-4">
                 {/* Spotlight effect behind card */}
                 <div
                   className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 blur-[80px] rounded-full opacity-50 z-[-1]"
                   style={{ backgroundColor: rarity.color }}
                 />
                 <LootCardStack items={items} />
              </div>

              {/* Actions - Redesigned chunky buttons */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="mt-12 w-full flex flex-col gap-5 max-w-xs"
              >
                <motion.button
                  onClick={handleInventory}
                  className="w-full relative group"
                  whileTap={{ scale: 0.96, translateY: 3 }}
                >
                  <div className="absolute inset-0 translate-y-1.5 rounded-2xl bg-primary-800" />
                  <div className="relative w-full py-4.5 rounded-2xl font-display font-black text-lg tracking-tight text-center bg-gradient-to-b from-primary-400 to-primary-600 text-white border-t border-white/30 group-active:translate-y-1 transition-all">
                    ADD TO BAG
                  </div>
                </motion.button>

                <button
                  onClick={handleAgain}
                  className="w-full py-4 rounded-2xl font-display font-bold text-sm text-white/70 hover:text-white bg-white/5 border border-white/10 transition-all uppercase tracking-widest"
                >
                  Summon Again
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
