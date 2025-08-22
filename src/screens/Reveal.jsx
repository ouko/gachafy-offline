import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useStore } from '../store'
import MotionLootBurst from '../components/reveal/MotionLootBurst'
import LootCardStack from '../components/reveal/LootCardStack'
import ConnectButton from '../components/shared/ConnectButton'
import XRDBalanceChip from '../components/shared/XRDBalanceChip'

export default function Reveal() {
  const history = useHistory()
  const { selectedTier, completeLootReveal, shareToTikTok } = useStore()
  const [revealed, setRevealed] = useState(false)
  const [items] = useState(() => [
    { id: 1, name: 'Cosmic Fragment', rarity: 'legendary' },
    { id: 2, name: 'Stardust', rarity: 'rare' },
    { id: 3, name: 'Space Dust', rarity: 'common' }
  ])

  const handleRevealComplete = () => {
    setRevealed(true)
    completeLootReveal(selectedTier, items[0].rarity)
  }

  const handleBack = () => {
    history.goBack()
  }

  const handleInventory = () => {
    history.push('/inventory')
  }

  const handleHome = () => {
    history.push('/')
  }

  const handleShare = async () => {
    if (await shareToTikTok(items)) {
      history.push('/inventory')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background-dark p-4 animate-fade-in">
      {!revealed ? (
        <MotionLootBurst onComplete={handleRevealComplete} />
      ) : (
        <>
          <LootCardStack items={items} />
          
          <div className="mt-8 flex flex-col gap-4">
            <button
              onClick={handleShare}
              className="tap-target rounded-full bg-primary px-8 py-4 font-display text-lg text-white shadow-lg transform transition active:scale-95"
            >
              Share on TikTok
            </button>
            
            <button
              onClick={handleInventory}
              className="tap-target rounded-full border-2 border-text-secondary px-8 py-4 font-display text-lg text-text-secondary transform transition active:scale-95"
            >
              Save to Inventory
            </button>
          </div>
        </>
      )}
    </div>
  )
}
