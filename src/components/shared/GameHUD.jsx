import React, { useState, useEffect } from 'react'
import { useStore } from '../../store'
import { useLocation, useHistory } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export default function GameHUD() {
  const { wallet, connectWallet, disconnectWallet } = useStore()
  const location = useLocation()
  const history = useHistory()
  const [showMenu, setShowMenu] = useState(false)

  const isHome = location.pathname === '/'

  // Close menu on route change
  useEffect(() => {
    setShowMenu(false)
  }, [location.pathname])

  const handleConnect = async () => {
    if (wallet?.connected) {
      disconnectWallet()
    } else {
      await connectWallet()
    }
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 pt-safe"
      aria-label="Game HUD"
    >
      <div className="app-container flex items-center justify-between py-3 px-5">
        {/* Logo / Title */}
        <div className="flex items-center gap-2">
          {isHome ? (
            <>
              <div
                className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-glow-pink"
                aria-hidden="true"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <span className="font-display text-h4 text-white tracking-tight">GachaFi</span>
            </>
          ) : (
            <span className="font-display text-h4 text-white tracking-tight">GachaFi</span>
          )}
        </div>

        {/* Currency / Wallet */}
        <div className="flex items-center gap-2">
          {wallet?.connected && typeof wallet.xrdBalance === 'number' ? (
            <div
              className="flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5"
              aria-label={`Balance: ${wallet.xrdBalance.toFixed(2)} XRD`}
            >
              {/* XRD icon */}
              <div
                className="h-5 w-5 rounded-full bg-accent-lime/20 flex items-center justify-center"
                aria-hidden="true"
              >
                <span className="text-accent-lime text-[10px] font-bold">X</span>
              </div>
              <span className="font-display text-body-sm text-white font-semibold">
                {wallet.xrdBalance.toFixed(2)}
              </span>
              <span className="text-caption text-text-muted">XRD</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5"
            >
              <div
                className="h-2 w-2 rounded-full bg-neutral-500 animate-pulse"
                aria-hidden="true"
              />
              <span className="text-caption text-text-muted">Wallet</span>
            </div>
          )}

          {/* Custom connect button for programmatic triggering */}
          <button
            onClick={handleConnect}
            className={`
              px-3 py-1.5 rounded-full font-display text-caption font-semibold tracking-wide
              transition-all duration-200 border
              ${wallet?.connected
                ? 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                : 'bg-primary-500/20 text-primary-500 border-primary-500/40 hover:bg-primary-500/30'
              }
            `}
          >
            {wallet?.connected ? 'Disconnect' : 'Connect'}
          </button>

          {/* Settings menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
              aria-label="Settings"
              aria-expanded={showMenu}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="19" cy="12" r="1"/>
                <circle cx="5" cy="12" r="1"/>
              </svg>
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 w-44 bg-surface/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-elevated overflow-hidden z-50"
                >
                  <button
                    onClick={() => {
                      history.push('/privacy')
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-3 text-left text-body-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    Privacy Policy
                  </button>
                  <div className="h-px bg-white/5" />
                  <button
                    onClick={() => {
                      window.location.reload()
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-3 text-left text-body-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
                    </svg>
                    Reload App
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </header>
  )
}
