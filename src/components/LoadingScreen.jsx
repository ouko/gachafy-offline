import React from 'react'
import { useStore } from '../store'

export default function LoadingScreen({ message = 'Loading...' }) {
  const status = useStore(state => state.status)
  
  const getStatusMessage = () => {
    switch (status) {
      case 'initializing':
        return 'Initializing Radix...'
      case 'retrying':
        return 'Retrying connection...'
      case 'ready':
        return 'Loading app...'
      default:
        return message || 'Loading...'
    }
  }

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-secondary to-primary text-white p-4"
      role="status"
      aria-live="polite"
      aria-label={getStatusMessage()}
    >
      <div className="p-8 bg-black/40 backdrop-blur-lg rounded-2xl shadow-elevated max-w-md text-center">
        <div
          className="w-12 h-12 border-4 border-white rounded-full border-t-transparent mb-6 mx-auto animate-spin"
          aria-hidden="true"
        />
        <p className="text-lg font-medium">
          {getStatusMessage()}
        </p>
        <p className="mt-2 text-sm text-white/60">Please wait a moment</p>
      </div>
    </div>
  )
}
