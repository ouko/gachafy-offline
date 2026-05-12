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
    <div className="min-h-screen pt-16 pb-28">
      <main id="main-content" className="px-5 py-4">
        <div className="app-container">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5"
          >
            <h1 className="font-display text-h2 text-white">My Bag</h1>
            <p className="text-caption text-text-muted mt-0.5">
              {MOCK_ITEMS.length} items collected
            </p>
          </motion.div>

          {/* SP Balance */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <SPBalance balance={150} />
          </motion.div>

          {/* Divider */}
          <div className="my-5 h-px bg-white/5" aria-hidden="true" />

          {/* Filter tabs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex gap-1.5 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-hide mb-4"
            role="tablist"
            aria-label="Filter cosmetics"
          >
            {FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                role="tab"
                aria-selected={activeFilter === filter}
                className={`shrink-0 px-3.5 py-2 rounded-xl font-display text-caption font-semibold tracking-wide transition-all duration-200 ${
                  activeFilter === filter
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-text-muted hover:text-text-secondary hover:bg-white/5 border border-transparent'
                }`}
              >
                {filter}
              </button>
            ))}
          </motion.div>

          {/* Cosmetics grid */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <CosmeticsGrid items={filteredItems} />
          </motion.div>

          {/* Empty state */}
          {filteredItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center py-12"
            >
              <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
              </div>
              <p className="text-body text-text-muted">No items here yet</p>
              <button
                onClick={() => history.push('/')}
                className="mt-3 text-body-sm text-primary-500 font-medium hover:text-primary-400 transition-colors"
              >
                Open a capsule
              </button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
