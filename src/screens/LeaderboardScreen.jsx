import React from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'

const truncateAddress = (address) => {
  if (!address || address.length < 12) return address || 'Unknown'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const MEDAL_COLORS = {
  1: 'text-warning-400',
  2: 'text-neutral-300',
  3: 'text-amber-600'
}

const MEDAL_BG = {
  1: 'bg-warning-500/15 border-warning-500/30',
  2: 'bg-neutral-500/15 border-neutral-500/30',
  3: 'bg-amber-600/15 border-amber-600/30'
}

export default function LeaderboardScreen() {
  const { leaderboard, wallet } = useStore()

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
            <h1 className="font-display text-h2 text-white">Leaderboard</h1>
            <p className="text-caption text-text-muted mt-0.5">
              Top summoners ranked by score
            </p>
          </motion.div>

          {/* Leaderboard List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            {leaderboard.length > 0 ? (
              leaderboard.map((player, index) => {
                const isCurrentUser = wallet?.address && player.address === wallet.address
                const isTop3 = player.rank <= 3

                return (
                  <motion.div
                    key={player.address}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`
                      flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200
                      ${isTop3 ? MEDAL_BG[player.rank] : 'bg-surface/40 border-white/5'}
                      ${isCurrentUser ? 'ring-1 ring-primary-500/40' : ''}
                    `}
                  >
                    {/* Rank */}
                    <div className={`shrink-0 w-10 text-center font-display text-h4 font-bold ${
                      isTop3 ? MEDAL_COLORS[player.rank] : 'text-text-muted'
                    }`}>
                      {isTop3 ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      ) : (
                        `#${player.rank}`
                      )}
                    </div>

                    {/* Player info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-body text-white font-medium truncate">
                        {truncateAddress(player.address)}
                      </p>
                      <p className="text-caption text-text-muted">
                        {player.capsules} capsules opened
                      </p>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <p className="font-display text-body text-white font-bold">
                        {player.score.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-text-muted uppercase tracking-wide">SP</p>
                    </div>
                  </motion.div>
                )
              })
            ) : (
              <div className="text-center py-12 bg-surface/40 rounded-2xl border border-white/5">
                <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                    <path d="M4 22h16"/>
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                  </svg>
                </div>
                <p className="text-body text-text-muted">No leaderboard data yet</p>
                <p className="text-caption text-text-muted mt-1">Open capsules to earn SP</p>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
