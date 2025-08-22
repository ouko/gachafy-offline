import React from 'react'
import { useStore } from '../../store'

export default function ConnectButton() {
  const { wallet, connectWallet } = useStore()
  
  return (
    <button
      onClick={connectWallet}
      className="tap-target rounded-full bg-primary px-6 py-3 font-display text-white shadow-lg active:scale-95 transition-transform"
      aria-label={wallet.connected ? 'Wallet Connected' : 'Connect Wallet'}
    >
      {wallet.connected ? 'Connected' : 'Connect Wallet'}
    </button>
  )
}
