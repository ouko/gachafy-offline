import React from 'react'
import { useHistory } from 'react-router-dom'
import { useStore } from '../store'
import ConnectButton from '../components/shared/ConnectButton'
import XRDBalanceChip from '../components/shared/XRDBalanceChip'
import TierCarousel from '../components/home/TierCarousel'

export default function Home() {
  const history = useHistory()
  const { wallet, selectedTier, openCapsule } = useStore()

  const handleReveal = () => {
    history.push('/reveal')
  }

  const handleInventory = () => {
    history.push('/inventory')
  }

  const handleClick = (path) => {
    history.push(path)
  }

  const handleOpenCapsule = async () => {
    if (await openCapsule()) {
      history.push('/reveal')
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background-dark p-4 animate-fade-in">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-primary">GachaFi</h1>
        <div className="flex items-center gap-4">
          <XRDBalanceChip />
          <ConnectButton />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center">
        <TierCarousel />
        
        <button
          onClick={handleOpenCapsule}
          disabled={!wallet.connected || !selectedTier}
          className="tap-target mt-8 rounded-full bg-secondary px-8 py-4 font-display text-lg text-white shadow-lg disabled:opacity-50 transform transition active:scale-95"
        >
          Open Capsule
        </button>
      </main>
    </div>
  )
}
