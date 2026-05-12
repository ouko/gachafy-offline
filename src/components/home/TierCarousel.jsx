import React, { useRef, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../../store'

const TIERS = [
  { 
    id: 8, 
    price: 8, 
    color: '#FF006E', 
    name: 'Bronze', 
    subtitle: 'Starter',
    description: 'Basic rewards',
    odds: 'Common & Rare'
  },
  { 
    id: 15, 
    price: 15, 
    color: '#B829F7', 
    name: 'Silver', 
    subtitle: 'Advanced',
    description: 'Better odds',
    odds: 'Up to Epic'
  },
  { 
    id: 25, 
    price: 25, 
    color: '#00F0FF', 
    name: 'Gold', 
    subtitle: 'Premium',
    description: 'Legendary chances',
    odds: 'Up to Legendary'
  }
]

export default function TierCarousel() {
  const { selectTier } = useStore()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [translateX, setTranslateX] = useState(0)

  useEffect(() => {
    selectTier(TIERS[currentIndex].id)
  }, [currentIndex, selectTier])

  const handleTouchStart = useCallback((e) => {
    setIsDragging(true)
    setStartX(e.touches[0].clientX - translateX)
  }, [translateX])

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true)
    setStartX(e.clientX - translateX)
  }, [translateX])

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return
    const x = e.touches[0].clientX - startX
    setTranslateX(Math.max(-120, Math.min(120, x)))
  }, [isDragging, startX])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return
    const x = e.clientX - startX
    setTranslateX(Math.max(-120, Math.min(120, x)))
  }, [isDragging, startX])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    if (Math.abs(translateX) > 60) {
      const direction = translateX < 0 ? 1 : -1
      const nextIndex = Math.max(0, Math.min(TIERS.length - 1, currentIndex + direction))
      setCurrentIndex(nextIndex)
    }
    setTranslateX(0)
  }, [translateX, currentIndex])

  const currentTier = TIERS[currentIndex]

  return (
    <div className="flex flex-col items-center" role="region" aria-label="Tier selection">
      {/* Tier cards */}
      <div 
        className="relative w-full max-w-xs h-44 select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleDragEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        <div 
          className={`flex h-full items-center justify-center ${isDragging ? '' : 'transition-transform duration-300 ease-out'}`}
          style={{ transform: `translateX(${translateX}px)`, cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          {TIERS.map((tier, index) => {
            const isActive = index === currentIndex
            const offset = index - currentIndex
            
            return (
              <motion.div
                key={tier.id}
                className="absolute flex flex-col items-center justify-center w-32 h-36 rounded-2xl border transition-all duration-300"
                style={{ 
                  background: `linear-gradient(160deg, ${tier.color}18 0%, ${tier.color}08 50%, rgba(15,15,26,0.9) 100%)`,
                  left: `calc(50% + ${offset * 140}px - 64px)`,
                  borderColor: isActive ? tier.color + '50' : 'rgba(255,255,255,0.08)',
                  boxShadow: isActive 
                    ? `0 0 40px ${tier.color}30, inset 0 1px 0 rgba(255,255,255,0.1)` 
                    : 'none',
                  transform: `scale(${isActive ? 1 : 0.78})`,
                  opacity: isActive ? 1 : 0.4,
                  zIndex: isActive ? 10 : 1
                }}
                aria-hidden={!isActive}
              >
                {/* Tier subtitle badge */}
                <span 
                  className="text-[10px] font-display font-bold tracking-widest uppercase px-2 py-0.5 rounded-full mb-2"
                  style={{ 
                    backgroundColor: tier.color + '20',
                    color: tier.color
                  }}
                >
                  {tier.subtitle}
                </span>

                {/* Price */}
                <span className="font-display text-h2 text-white">{tier.price}</span>
                <span className="text-caption text-white/50 -mt-1">XRD</span>
                
                {/* Odds hint */}
                <span className="text-[10px] text-white/40 mt-2 font-medium">
                  {tier.odds}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Tier info */}
      <div className="mt-2 text-center" aria-live="polite">
        <h2 className="font-display text-h4 text-white">{currentTier.name} Capsule</h2>
        <p className="mt-0.5 text-body-sm text-text-muted">{currentTier.description}</p>
      </div>

      {/* Dots */}
      <div className="mt-3 flex gap-2">
        {TIERS.map((tier, index) => (
          <button
            key={tier.id}
            onClick={() => setCurrentIndex(index)}
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: index === currentIndex ? 24 : 8,
              backgroundColor: index === currentIndex ? tier.color : 'rgba(255,255,255,0.15)'
            }}
            aria-label={`Select ${tier.name}`}
            aria-current={index === currentIndex}
          />
        ))}
      </div>
    </div>
  )
}
