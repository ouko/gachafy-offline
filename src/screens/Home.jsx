import React from 'react'
import { useHistory } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import CapsuleVisual from '../components/shared/CapsuleVisual'
import TierCarousel from '../components/home/TierCarousel'

const TIER_MAP = {
  8: 'bronze',
  15: 'silver',
  25: 'gold'
}

export default function Home() {
  const history = useHistory()
  const { wallet, selectedTier, connectWallet, status } = useStore()

  const handleOpenCapsule = async () => {
    if (wallet?.connected) {
      history.push('/gacha')
    } else {
      await connectWallet()
    }
  }

  const capsuleTier = TIER_MAP[selectedTier] || 'bronze'
  const isConnected = wallet?.connected
  const isConnecting = status === 'connecting'

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section - takes most of the screen */}
      <main id="main-content" className="flex-1 flex flex-col items-center justify-center px-5 pt-16 pb-4">

        {/* Capsule - THE hero element */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center"
        >
          <CapsuleVisual tier={capsuleTier} size={220} animate={true} />
        </motion.div>

        {/* Tier selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-6 w-full max-w-xs"
        >
          <TierCarousel />
        </motion.div>
      </main>

      {/* Bottom CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="px-5 pb-28"
      >
        <div className="app-container flex flex-col items-center gap-3">
          {/* Main CTA - massive game button */}
          <motion.button
            onClick={handleOpenCapsule}
            disabled={isConnecting}
            className="w-full max-w-xs relative group"
            whileTap={!isConnecting ? { scale: 0.97 } : {}}
            aria-label={isConnected ? 'Open capsule' : 'Connect wallet to begin'}
          >
            {/* Button glow */}
            <div
              className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-500 opacity-40 blur-lg group-hover:opacity-60 transition-opacity duration-300"
              aria-hidden="true"
            />

            {/* Button body */}
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
                isConnected ? 'OPEN CAPSULE' : 'CONNECT WALLET'
              )}
            </div>
          </motion.button>

          {/* Sub info */}
          <p className="text-caption text-text-muted text-center">
            {isConnected
              ? 'Tap to start your summon'
              : isConnecting
                ? 'Approve in your wallet'
                : 'Connect your wallet to begin'
            }
          </p>
        </div>
      </motion.div>
    </div>
  )
}
