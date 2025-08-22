import { useEffect, useRef } from 'react'

export default function MotionLootBurst({ onComplete }) {
  const burstRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.()
    }, 600)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div 
      ref={burstRef}
      className="absolute inset-0 flex items-center justify-center animate-burst"
    >
      <div className="relative h-48 w-48">
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-secondary opacity-25 animate-pulse"
        />
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-secondary" />
      </div>
    </div>
  )
}
