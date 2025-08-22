import React from 'react'
import { useStore } from '../../store'

export default function XRDBalanceChip() {
  const { wallet } = useStore()
  
  if (!wallet.connected) return null
  
  return (
    <div
      className="flex items-center gap-2 rounded-full bg-background-light px-4 py-2 font-display text-sm opacity-0 -translate-y-5 transition-all duration-300"
      style={{
        opacity: 1,
        transform: 'translateY(0)'
      }}
    >
      <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
      <span>{wallet.xrdBalance.toFixed(2)} XRD</span>
    </div>
  )
}
