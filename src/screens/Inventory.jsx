import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { motion } from 'framer-motion'
import SPBalance from '../components/inventory/SPBalance'
import CosmeticsGrid from '../components/inventory/CosmeticsGrid'

const MOCK_ITEMS = [
  { id: 1, style: 'Nebula', hex: '#FF006E', rarity: 'legendary' },
  { id: 2, style: 'Cosmic', hex: '#B829F7', rarity: 'rare' },
  { id: 3, style: 'Star', hex: '#00F0FF', rarity: 'common' }
]

const FILTERS = ['All', 'Legendary', 'Epic', 'Rare', 'Common']

export default function Inventory() {
  const history = useHistory()
  const [activeFilter, setActiveFilter] = useState('All')

  const filteredItems = activeFilter === 'All' 
    ? MOCK_ITEMS 
    : MOCK_ITEMS.filter(item => item.rarity.toLowerCase() === activeFilter.toLowerCase())

  return (
    <div className="min-h-screen pt-20 pb-28">
      <main id="main-content" className="px-5 py-4">
        <div className="app-container">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <div className="flex items-baseline gap-3">
              <h1 className="font-display font-black text-4xl text-white italic tracking-tighter uppercase">My Bag</h1>
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold text-text-muted border border-white/5 tracking-widest">
                {MOCK_ITEMS.length} ITEMS
              </span>
            </div>
          </motion.div>

          {/* SP Balance - HUD Style */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <SPBalance balance={150} />
          </motion.div>

          {/* Filter tabs - Scrollable Pill Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex gap-2 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide mb-6"
            role="tablist"
            aria-label="Filter cosmetics"
          >
            {FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                role="tab"
                aria-selected={activeFilter === filter}
                className={`shrink-0 px-5 py-2 rounded-xl font-display text-xs font-black tracking-[0.1em] uppercase transition-all duration-200 border-2 ${
                  activeFilter === filter
                    ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                    : 'bg-black/40 text-text-muted border-white/10 hover:border-white/30'
                }`}
              >
                {filter}
              </button>
            ))}
          </motion.div>

          {/* Cosmetics grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <CosmeticsGrid items={filteredItems} />
          </motion.div>

          {/* Empty state */}
          {filteredItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center py-20"
            >
              <div className="h-20 w-20 rounded-3xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted opacity-50">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
              </div>
              <p className="font-display font-bold text-text-secondary uppercase tracking-widest">Nothing found</p>
              <button
                onClick={() => history.push('/')}
                className="mt-4 px-6 py-2 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-400 text-xs font-bold uppercase tracking-widest hover:bg-primary-500/20 transition-all"
              >
                Go Summon
              </button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
