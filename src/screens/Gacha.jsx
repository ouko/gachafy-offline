import React from 'react'
import { motion } from 'framer-motion'
import { useHistory } from 'react-router-dom'
import { useStore } from '../store'
import OpenButton from '../components/shared/OpenButton'
import CapsuleVisual from '../components/shared/CapsuleVisual'

const TIER_MAP = {
  8: 'bronze',
  15: 'silver',
  25: 'gold',
  common: 'common',
  rare: 'rare',
  epic: 'epic',
  legendary: 'legendary'
}

export default function Gacha() {
  const history = useHistory()
  const { selectedTier, wallet, connectWallet, status } = useStore()

  const capsuleTier = TIER_MAP[selectedTier] || 'bronze'
  const isConnected = wallet?.connected
  const isConnecting = status === 'connecting'

  const handleSwipeUp = () => {
    if (isConnected && selectedTier) {
      history.push('/reveal')
    }
  }

  const handleConnect = async () => {
    if (!isConnected) {
      await connectWallet()
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main id="main-content" className="flex-1 flex flex-col items-center justify-center px-5 pt-16 pb-4">

        {/* Instruction text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-caption text-text-muted mb-6"
        >
          {isConnected ? 'Swipe up or tap to open' : 'Connect wallet to continue'}
        </motion.p>

        {/* Draggable Capsule */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          onDragEnd={(e, { offset, velocity }) => {
            if (offset.y < -60 || velocity.y < -600) {
              handleSwipeUp()
            }
          }}
          whileTap={{ scale: 0.96 }}
          className="cursor-grab active:cursor-grabbing"
        >
          <CapsuleVisual tier={capsuleTier} size={200} animate={true} />
        </motion.div>

        {/* Swipe hint */}
        {isConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex flex-col items-center gap-1"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                <path d="m18 15-6-6-6 6"/>
              </svg>
            </motion.div>
            <span className="text-caption text-text-muted">Swipe up</span>
          </motion.div>
        )}
      </main>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-5 pb-28"
      >
        <div className="app-container max-w-xs mx-auto">
          {isConnected ? (
            <OpenButton />
          ) : (
            <div className="flex flex-col items-center gap-3">
              <motion.button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full relative group"
                whileTap={!isConnecting ? { scale: 0.97 } : {}}
              >
                <div
                  className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-500 opacity-40 blur-lg group-hover:opacity-60 transition-opacity duration-300"
                  aria-hidden="true"
                />
                <div className={`
                  relative w-full py-5 rounded-2xl font-display font-bold text-lg tracking-wide text-center
                  bg-gradient-to-b from-primary-500 to-primary-600
                  border-t border-white/20 shadow-[0_4px_0_#990042,0_8px_24px_rgba(255,0,110,0.4)]
                  active:shadow-[0_1px_0_#990042,0_2px_8px_rgba(255,0,110,0.3)]
                  active:translate-y-[3px]
                  transition-all duration-100
                  ${isConnecting ? 'opacity-70' : ''}
                `}>
                  {isConnecting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connecting...
                    </span>
                  ) : (
                    'CONNECT WALLET'
                  )}
                </div>
              </motion.button>
              <p className="text-caption text-text-muted text-center">
                {isConnecting ? 'Approve in your wallet' : 'Connect to open capsules'}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
