import React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Summon',
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    )
  },
  {
    path: '/gacha',
    label: 'Open',
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v6l4 2"/>
      </svg>
    )
  },
  {
    path: '/inventory',
    label: 'Bag',
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m7.5 4.27 9 5.15"/>
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
        <path d="m3.3 7 8.7 5 8.7-5"/>
      </svg>
    )
  },
  {
    path: '/capsules',
    label: 'Capsules',
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z"/>
        <path d="M12 8v8"/>
        <path d="M8 12h8"/>
      </svg>
    )
  },
  {
    path: '/leaderboard',
    label: 'Ranks',
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
        <path d="M4 22h16"/>
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
      </svg>
    )
  },
  {
    path: '/governance',
    label: 'Vote',
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 12 2 2 4-4"/>
        <path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z"/>
        <path d="M22 19H2"/>
      </svg>
    )
  },
]

export default function BottomNav() {
  const history = useHistory()
  const location = useLocation()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
      aria-label="Main navigation"
    >
      {/* Glass background */}
      <div className="absolute inset-0 bg-surface/80 backdrop-blur-xl border-t border-white/10" />

      <div className="relative app-container flex items-center justify-around py-1.5 overflow-x-auto scrollbar-hide">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => history.push(item.path)}
              className="relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 shrink-0"
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              {/* Active background pill */}
              {isActive && (
                <motion.div
                  layoutId="navActive"
                  className="absolute inset-0 bg-primary-500/15 rounded-xl border border-primary-500/20"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              <div className={`relative z-10 ${isActive ? 'text-primary-500 drop-shadow-[0_0_6px_rgba(255,0,110,0.5)]' : 'text-text-muted'}`}>
                {item.icon(isActive)}
              </div>
              <span className={`relative z-10 text-[10px] font-display font-semibold tracking-wide ${isActive ? 'text-primary-500' : 'text-text-muted'}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
