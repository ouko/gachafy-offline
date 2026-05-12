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
    glow: 'shadow-none'
  },
  rare: {
    label: 'RARE',
    color: '#00F0FF',
    gradient: 'from-accent-cyan/30 to-accent-cyan/10',
    glow: 'shadow-glow-cyan'
  },
  epic: {
    label: 'EPIC',
    color: '#B829F7',
    gradient: 'from-secondary-500/40 to-secondary-500/20',
    glow: 'shadow-glow-violet'
  },
  legendary: {
    label: 'LEGENDARY',
    color: '#FF006E',
    gradient: 'from-primary-500/50 to-secondary-500/30',
    glow: 'shadow-glow-pink'
  }
}

export default function Reveal() {
  const history = useHistory()
  const { selectedTier, completeLootReveal, lastOpenedTier, capsules, addCapsule } = useStore()
  const [revealed, setRevealed] = useState(false)
  const [items, setItems] = useState([])

  // Generate loot on mount based on the last opened tier
  useEffect(() => {
    const tier = lastOpenedTier || selectedTier
    if (!tier) {
      // No tier selected, redirect home
      history.push('/')
      return
    }

    // Generate loot items
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

    // Add the main item to capsule inventory
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
    <div className="flex min-h-screen flex-col items-center justify-center px-5 pt-16 pb-28">
      <main id="main-content" className="app-container flex flex-col items-center w-full max-w-sm">

        <AnimatePresence mode="wait">
          {!revealed ? (
            <motion.section
              key="burst"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.3 }}
              aria-label="Loot reveal"
              className="flex flex-col items-center"
            >
              <MotionLootBurst onComplete={handleRevealComplete} />
            </motion.section>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center w-full"
            >
              {/* Rarity banner */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <div
                  className="px-6 py-2 rounded-full border"
                  style={{
                    backgroundColor: rarity.color + '15',
                    borderColor: rarity.color + '40',
                    boxShadow: `0 0 30px ${rarity.color}30`
                  }}
                >
                  <span
                    className="font-display text-body-sm font-bold tracking-[0.2em]"
                    style={{ color: rarity.color }}
                  >
                    {rarity.label}
                  </span>
                </div>
              </motion.div>

              {/* Loot cards */}
              <LootCardStack items={items} />

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-8 w-full flex flex-col gap-3"
              >
                <motion.button
                  onClick={handleInventory}
                  className="w-full relative group"
                  whileTap={{ scale: 0.97 }}
                >
                  <div
                    className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-500 opacity-30 blur-lg group-hover:opacity-50 transition-opacity"
                    aria-hidden="true"
                  />
                  <div className="relative w-full py-4 rounded-2xl font-display font-bold text-base tracking-wide text-center bg-gradient-to-b from-primary-500 to-primary-600 border-t border-white/20 shadow-[0_4px_0_#990042,0_8px_24px_rgba(255,0,110,0.3)] active:shadow-[0_1px_0_#990042,0_2px_8px_rgba(255,0,110,0.2)] active:translate-y-[3px] transition-all duration-100">
                    VIEW LOOT
                  </div>
                </motion.button>

                <button
                  onClick={handleAgain}
                  className="w-full py-3 rounded-2xl font-display font-semibold text-body text-text-secondary hover:text-white hover:bg-white/5 border border-white/10 transition-all duration-200"
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
