import React, { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../../store'

const STATUS_CONFIG = {
  error: {
    bg: 'bg-error-500/15 border-error-500/30',
    text: 'text-error-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
    autoDismiss: false
  },
  initializing: {
    bg: 'bg-info-500/15 border-info-500/30',
    text: 'text-info-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
    ),
    autoDismiss: false
  },
  connecting: {
    bg: 'bg-info-500/15 border-info-500/30',
    text: 'text-info-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
    ),
    autoDismiss: false
  },
  pending: {
    bg: 'bg-warning-500/15 border-warning-500/30',
    text: 'text-warning-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    autoDismiss: false
  },
  committing: {
    bg: 'bg-info-500/15 border-info-500/30',
    text: 'text-info-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
    ),
    autoDismiss: false
  },
  committed: {
    bg: 'bg-success-500/15 border-success-500/30',
    text: 'text-success-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    autoDismiss: 4000
  },
  declined: {
    bg: 'bg-warning-500/15 border-warning-500/30',
    text: 'text-warning-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
    autoDismiss: 6000
  }
}

const formatMessage = (msg) => {
  if (msg == null) return ''
  if (typeof msg === 'string') return msg
  if (typeof msg === 'number') return String(msg)
  if (msg instanceof Error) return msg.message || 'An error occurred'
  if (typeof msg === 'object') return msg.message || JSON.stringify(msg) || 'Unknown error'
  return String(msg)
}

export default function StatusNotification() {
  const { transactionStatus, transactionError, status, error, clearStatus } = useStore()

  const getStatusInfo = () => {
    if (error || transactionError) {
      return { message: formatMessage(error || transactionError), ...STATUS_CONFIG.error }
    }
    if (status === 'initializing' || status === 'connecting') {
      return {
        message: status === 'initializing' ? 'Initializing...' : 'Connecting...',
        ...STATUS_CONFIG[status]
      }
    }
    if (transactionStatus && STATUS_CONFIG[transactionStatus]) {
      const messages = {
        pending: 'Preparing transaction...',
        connecting: 'Connecting...',
        committing: 'Confirming...',
        committed: 'Success!',
        declined: 'Declined'
      }
      return { message: messages[transactionStatus] || 'Processing...', ...STATUS_CONFIG[transactionStatus] }
    }
    return null
  }

  const statusInfo = getStatusInfo()

  useEffect(() => {
    if (statusInfo?.autoDismiss) {
      const timer = setTimeout(() => clearStatus(), statusInfo.autoDismiss)
      return () => clearTimeout(timer)
    }
  }, [statusInfo, clearStatus])

  if (!statusInfo) return null

  return (
    <AnimatePresence>
      <motion.div
        key={statusInfo.message}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-sm"
      >
        <div className={`${statusInfo.bg} backdrop-blur-xl rounded-2xl border px-4 py-3 flex items-center gap-3`}>
          <span className={statusInfo.text}>{statusInfo.icon}</span>
          <span className={`font-medium text-body-sm flex-1 ${statusInfo.text}`}>{statusInfo.message}</span>
          <button
            onClick={clearStatus}
            className="flex items-center justify-center h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Dismiss"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={statusInfo.text}>
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
