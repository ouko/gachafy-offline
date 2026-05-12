import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../../store'
import LoadingSpinner from './LoadingSpinner'

const getStatusLabel = (status) => {
  switch (status) {
    case 'pending': return 'Opening...'
    case 'committing': return 'Confirming...'
    case 'committed': return 'Opened!'
    case 'declined': return 'Declined'
    case 'failed': return 'Failed'
    case 'error': return 'Error'
    default: return 'Open'
  }
}

export default function OpenButton() {
  const { wallet, selectedTier, openCapsule, transactionStatus, error: storeError } = useStore()
  const [error, setError] = useState(null)
  const [capsuleOpening, setCapsuleOpening] = useState(false)
  
  const handleOpen = async () => {
    if (!wallet?.connected || !selectedTier || transactionStatus === 'pending') return
    setError(null)
    setCapsuleOpening(true)
    try {
      const success = await openCapsule()
      if (!success) {
        setError('Failed to open capsule. Please try again.')
      }
    } catch (err) {
      console.error('Failed to open capsule:', err)
      setError(err.message || 'Failed to open capsule. Please try again.')
    } finally {
      setCapsuleOpening(false)
    }
  }
  
  const isLoading = capsuleOpening || transactionStatus === 'pending' || transactionStatus === 'committing'
  const isDisabled = !wallet?.connected || !selectedTier || isLoading
  
  const buttonText = !wallet?.connected
    ? 'Connect Wallet'
    : !selectedTier
      ? 'Select Tier'
      : transactionStatus
        ? getStatusLabel(transactionStatus)
        : 'OPEN'

  const displayError = error || storeError

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <motion.button
        onClick={handleOpen}
        disabled={isDisabled}
        className="w-full relative group"
        whileTap={!isDisabled ? { scale: 0.97 } : {}}
        aria-label={buttonText}
        aria-busy={isLoading}
      >
        {/* Glow */}
        <div 
          className={`absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-500 opacity-40 blur-lg transition-opacity duration-300 ${!isDisabled ? 'group-hover:opacity-60' : ''}`}
          aria-hidden="true"
        />
        
        {/* Button body */}
        <div className={`
          relative w-full py-5 rounded-2xl font-display font-bold text-lg tracking-wider text-center
          bg-gradient-to-b from-primary-500 to-primary-600
          border-t border-white/20 
          shadow-[0_4px_0_#990042,0_8px_24px_rgba(255,0,110,0.4)]
          active:shadow-[0_1px_0_#990042,0_2px_8px_rgba(255,0,110,0.3)]
          active:translate-y-[3px]
          transition-all duration-100
          flex items-center justify-center gap-2
          ${isDisabled && !isLoading ? 'opacity-50 grayscale' : ''}
        `}>
          {isLoading && <LoadingSpinner size="sm" />}
          <span>{buttonText}</span>
        </div>
      </motion.button>
      
      {displayError && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          className="text-error-500 text-body-sm text-center px-4"
          role="alert"
        >
          {displayError}
        </motion.div>
      )}
    </div>
  )
}
