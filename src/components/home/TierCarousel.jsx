import React, { useRef, useState, useEffect } from 'react'
import { useStore } from '../../store'

const TIERS = [
  { id: 8, price: 8, color: '#FF006E' },
  { id: 15, price: 15, color: '#8338EC' },
  { id: 25, price: 25, color: '#00E5A8' }
]

export default function TierCarousel() {
  const { selectTier } = useStore()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [translateX, setTranslateX] = useState(0)
  const containerRef = useRef(null)

  useEffect(() => {
    selectTier(TIERS[currentIndex].id)
  }, [currentIndex])

  const handleTouchStart = (e) => {
    setIsDragging(true)
    setStartX(e.touches[0].clientX - translateX)
  }

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setStartX(e.clientX - translateX)
  }

  const handleTouchMove = (e) => {
    if (!isDragging) return
    const x = e.touches[0].clientX - startX
    setTranslateX(Math.max(-100, Math.min(100, x)))
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    const x = e.clientX - startX
    setTranslateX(Math.max(-100, Math.min(100, x)))
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    if (Math.abs(translateX) > 50) {
      const direction = translateX < 0 ? 1 : -1
      const nextIndex = Math.max(0, Math.min(TIERS.length - 1, currentIndex + direction))
      setCurrentIndex(nextIndex)
    }
    setTranslateX(0)
  }

  return (
    <div 
      className="thumb-zone relative overflow-hidden"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleDragEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      <div 
        className="flex h-full items-center justify-center transition-transform"
        style={{ 
          transform: `translateX(${translateX}px)`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        {TIERS.map((tier, index) => (
          <div
            key={tier.id}
            className="absolute flex h-32 w-32 items-center justify-center rounded-2xl transition-transform"
            style={{ 
              backgroundColor: tier.color,
              transform: `scale(${index === currentIndex ? 1 : 0.8})`,
              left: `${(index - currentIndex) * 140}px`
            }}
          >
            <span className="font-display text-2xl text-white">
              {tier.price} XRD
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
