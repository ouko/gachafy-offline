import React from 'react'
import { useHistory } from 'react-router-dom'
import { useStore } from '../store'
import SPBalance from '../components/inventory/SPBalance'
import CosmeticsGrid from '../components/inventory/CosmeticsGrid'
import XRDBalanceChip from '../components/shared/XRDBalanceChip'

const MOCK_ITEMS = [
  { id: 1, style: 'Nebula', hex: '#FF006E', rarity: 'legendary' },
  { id: 2, style: 'Cosmic', hex: '#8338EC', rarity: 'rare' },
  { id: 3, style: 'Star', hex: '#00E5A8', rarity: 'common' }
]

export default function Inventory() {
  const history = useHistory()

  const handleBack = () => {
    history.goBack()
  }

  const handleHome = () => {
    history.push('/')
  }

  return (
    <div className="min-h-screen bg-background-dark p-4 animate-fade-in">
      <header className="mb-8 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="tap-target font-display text-text-secondary"
        >
          ← Back
        </button>
        <XRDBalanceChip />
      </header>

      <h1 className="mb-6 font-display text-2xl">Your Stuff</h1>
      
      <SPBalance balance={150} />
      
      <div className="my-8 h-px bg-background-light" />
      
      <CosmeticsGrid items={MOCK_ITEMS} />
    </div>
  )
}
