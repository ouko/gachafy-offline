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
      <div className="app-container flex items-center justify-between py-4 px-5">
        {/* Logo / Title */}
        <div className="flex items-center gap-2">
          <div
            className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-[0_0_15px_rgba(255,0,110,0.4)] border border-white/20"
            aria-hidden="true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <span className="font-display text-h3 text-white tracking-tighter filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">GachaFi</span>
        </div>

        {/* Currency / Wallet */}
        <div className="flex items-center gap-3">
          {wallet?.connected && typeof wallet.xrdBalance === 'number' ? (
            <div
              className="flex items-center gap-2 rounded-xl bg-black/60 backdrop-blur-lg border border-white/10 pl-2 pr-4 py-1.5 shadow-inner"
              aria-label={`Balance: ${wallet.xrdBalance.toFixed(2)} XRD`}
            >
              {/* XRD icon */}
              <div
                className="h-7 w-7 rounded-lg bg-gradient-to-b from-accent-lime to-lime-700 flex items-center justify-center shadow-glow-lime"
                aria-hidden="true"
              >
                <span className="text-white text-xs font-bold">X</span>
              </div>
              <div className="flex flex-col">
                <span className="font-display text-body-sm text-white font-bold leading-none">
                  {wallet.xrdBalance.toFixed(2)}
                </span>
                <span className="text-[8px] text-text-muted font-bold tracking-widest uppercase leading-none mt-0.5">XRD</span>
              </div>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className="flex items-center gap-2 rounded-xl bg-black/60 backdrop-blur-lg border border-white/10 px-4 py-2 hover:bg-white/5 transition-all"
            >
              <div
                className="h-2 w-2 rounded-full bg-primary-500 animate-pulse shadow-[0_0_8px_#FF006E]"
                aria-hidden="true"
              />
              <span className="text-caption text-white font-bold tracking-wide">CONNECT</span>
            </button>
          )}

          {/* Settings menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="h-10 w-10 rounded-xl bg-black/60 backdrop-blur-lg border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
              aria-label="Settings"
              aria-expanded={showMenu}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/70">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 top-12 w-48 bg-surface/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                  <button
                    onClick={() => {
                      history.push('/privacy')
                      setShowMenu(false)
                    }}
                    className="w-full px-5 py-4 text-left text-body-sm text-text-secondary hover:text-white hover:bg-white/10 transition-colors flex items-center gap-3 font-semibold"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    Privacy
                  </button>
                  <div className="h-px bg-white/10" />
                  {wallet?.connected && (
                    <button
                      onClick={() => {
                        disconnectWallet()
                        setShowMenu(false)
                      }}
                      className="w-full px-5 py-4 text-left text-body-sm text-primary-400 hover:text-primary-300 hover:bg-white/10 transition-colors flex items-center gap-3 font-semibold"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      Disconnect
                    </button>
                  )}
                  <div className="h-px bg-white/10" />
                  <button
                    onClick={() => {
                      window.location.reload()
                      setShowMenu(false)
                    }}
                    className="w-full px-5 py-4 text-left text-body-sm text-text-secondary hover:text-white hover:bg-white/10 transition-colors flex items-center gap-3 font-semibold"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
                    </svg>
                    Reload
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
