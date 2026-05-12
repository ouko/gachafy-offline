import React from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../../store'

export default function LoadingScreen({ message = 'Loading...' }) {
  const status = useStore(state => state.status)
  
  const getStatusMessage = () => {
    switch (status) {
      case 'initializing':
        return 'Loading...'
      case 'retrying':
        return 'Retrying...'
      case 'ready':
        return 'Starting...'
      default:
        return message || 'Loading...'
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background-dark"
      role="status"
      aria-live="polite"
      aria-label={getStatusMessage()}
    >
      {/* Background glow */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(184,41,247,0.15) 0%, rgba(255,0,110,0.08) 40%, transparent 70%)'
        }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="relative flex flex-col items-center"
      >
        {/* Logo icon */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-glow-pink mb-6"
          aria-hidden="true"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </motion.div>

        <motion.p
          key={status}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="text-body-lg font-display font-medium text-white"
        >
          {getStatusMessage()}
        </motion.p>
        
        {/* Progress bar */}
        <div className="mt-4 w-40 h-1 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
            animate={{ width: ['0%', '70%', '90%', '60%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </motion.div>
  )
}
