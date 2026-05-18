import React from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { useHistory } from 'react-router-dom'
import { useStore } from '../store'
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

  const y = useMotionValue(0)
  const opacity = useTransform(y, [0, -150], [1, 0])
  const scale = useTransform(y, [0, -150], [1, 1.2])

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
    <div className="flex min-h-screen flex-col overflow-hidden">
      <main id="main-content" className="flex-1 flex flex-col items-center justify-center px-5 pt-16 pb-4">

        {/* Instruction text */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-10"
        >
          <h2 className="text-xl font-display font-bold text-white mb-1">READY TO SUMMON?</h2>
          <p className="text-caption text-text-muted">
            {isConnected ? 'SWIPE UP TO RELEASE THE CAPSULE' : 'CONNECT WALLET TO CONTINUE'}
          </p>
        </motion.div>

        {/* Draggable Capsule */}
        <div className="relative">
          {/* Summoning portal effect behind capsule */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-500/20 blur-[60px] rounded-full z-[-1]"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />

          <motion.div
            style={{ y, opacity, scale }}
            drag="y"
            dragConstraints={{ top: -200, bottom: 0 }}
            dragElastic={0.1}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.y < -100 || velocity.y < -500) {
                handleSwipeUp()
              } else {
                y.set(0)
              }
            }}
            whileTap={{ cursor: 'grabbing' }}
            className="cursor-grab active:cursor-grabbing relative z-10"
          >
            <CapsuleVisual tier={capsuleTier} size={240} animate={true} />
          </motion.div>
        </div>

        {/* Swipe hint */}
        {isConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 flex flex-col items-center gap-2"
          >
            <motion.div
              animate={{ y: [0, -12, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary-400">
                <path d="m18 15-6-6-6 6"/>
              </svg>
            </motion.div>
            <span className="text-[10px] font-bold text-text-muted tracking-[0.2em] uppercase">Release</span>
          </motion.div>
        )}
      </main>

      {/* Bottom CTA for non-connected or alternate access */}
      {!isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="px-5 pb-28"
        >
          <div className="app-container max-w-xs mx-auto">
            <motion.button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full relative group"
              whileTap={!isConnecting ? { scale: 0.96 } : {}}
            >
              <div
                className="absolute inset-0 translate-y-1.5 rounded-2xl bg-primary-800"
              />
              <div className={`
                relative w-full py-5 rounded-2xl font-display font-black text-lg tracking-wide text-center
                bg-gradient-to-b from-primary-500 to-primary-600
                text-white border-t border-white/20
                group-active:translate-y-1 transition-all
                ${isConnecting ? 'opacity-70' : ''}
              `}>
                {isConnecting ? 'CONNECTING...' : 'CONNECT WALLET'}
              </div>
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
