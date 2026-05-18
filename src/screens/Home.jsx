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
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center mb-4"
        >
          <div className="relative">
            <CapsuleVisual tier={capsuleTier} size={280} animate={true} />
            {/* Added dramatic shadow/glow under capsule */}
            <div
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-6 bg-black/40 blur-xl rounded-[100%] z-[-1]"
              aria-hidden="true"
            />
          </div>
        </motion.div>

        {/* Tier selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="w-full max-w-sm"
        >
          <TierCarousel />
        </motion.div>
      </main>

      {/* Bottom CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="px-5 pb-28"
      >
        <div className="app-container flex flex-col items-center gap-4">
          {/* Main CTA - massive game button with 3D depth */}
          <motion.button
            onClick={handleOpenCapsule}
            disabled={isConnecting}
            className="w-full max-w-xs relative group"
            whileTap={!isConnecting ? { scale: 0.96, translateY: 4 } : {}}
            aria-label={isConnected ? 'Open capsule' : 'Connect wallet to begin'}
          >
            {/* Button glow */}
            <div
              className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-500 opacity-30 blur-xl group-hover:opacity-50 transition-opacity duration-300"
              aria-hidden="true"
            />

            {/* 3D Button structure */}
            <div className="relative w-full h-20">
              {/* Button Shadow/Depth */}
              <div className="absolute inset-0 translate-y-2 rounded-2xl bg-primary-800 border-b-4 border-black/30" />

              {/* Button Top */}
              <div className={`
                absolute inset-0 rounded-2xl font-display font-black text-xl tracking-tighter
                bg-gradient-to-b from-primary-400 to-primary-600
                flex items-center justify-center text-white
                border-t-2 border-white/30 shadow-lg
                group-active:translate-y-1 transition-all duration-75
                ${isConnecting ? 'opacity-80' : ''}
              `}>
                {isConnecting ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    LOADING
                  </span>
                ) : (
                  isConnected ? 'SUMMON NOW' : 'START ADVENTURE'
                )}
              </div>
            </div>
          </motion.button>

          {/* Sub info */}
          <p className="text-[11px] font-bold text-text-muted tracking-[0.15em] uppercase text-center filter drop-shadow-sm">
            {isConnected
              ? 'Prepare for your epic reveal'
              : isConnecting
                ? 'Check your Radix wallet'
                : 'Connect to claim your destiny'
            }
          </p>
        </div>
      </motion.div>
    </div>
  )
}
