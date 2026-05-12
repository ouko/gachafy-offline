import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export default function MotionLootBurst({ onComplete }) {
  const burstRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.()
    }, 1800)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div 
      ref={burstRef}
      className="flex flex-col items-center justify-center"
      role="img"
      aria-label="Opening capsule"
    >
      <motion.div 
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative h-64 w-64"
      >
        {/* Outer expanding ring */}
        <motion.div
          animate={{ 
            scale: [1, 2, 2.5],
            opacity: [0.5, 0.15, 0]
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 rounded-full border-2 border-primary-500"
        />
        
        {/* Second ring */}
        <motion.div
          animate={{ 
            scale: [1, 1.5, 2],
            opacity: [0.4, 0.1, 0]
          }}
          transition={{ duration: 1.3, delay: 0.1, ease: "easeOut" }}
          className="absolute inset-4 rounded-full border-2 border-secondary-500"
        />

        {/* Third ring */}
        <motion.div
          animate={{ 
            scale: [1, 1.3, 1.6],
            opacity: [0.3, 0.1, 0]
          }}
          transition={{ duration: 1.1, delay: 0.2, ease: "easeOut" }}
          className="absolute inset-8 rounded-full border border-accent-cyan"
        />

        {/* Core glow pulse */}
        <motion.div
          animate={{ 
            scale: [0.6, 1.2, 1],
            opacity: [0.4, 1, 0.7]
          }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="absolute inset-12 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 blur-2xl"
          aria-hidden="true"
        />
        
        {/* Core rotating element */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-16 rounded-full bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500"
          style={{ boxShadow: '0 0 40px rgba(255,0,110,0.5), inset 0 0 20px rgba(255,255,255,0.2)' }}
          aria-hidden="true"
        />

        {/* Inner star */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="white" stroke="none">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </motion.div>

        {/* Spark particles */}
        {[...Array(12)].map((_, i) => {
          const angle = (i / 12) * Math.PI * 2
          const distance = 90 + Math.random() * 30
          return (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
              animate={{ 
                scale: [0, 1.5, 0],
                opacity: [1, 1, 0],
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
              }}
              transition={{ 
                duration: 0.9,
                delay: 0.4 + i * 0.03,
                ease: "easeOut"
              }}
              className="absolute top-1/2 left-1/2 w-2.5 h-2.5 rounded-full"
              style={{ 
                marginLeft: -5, 
                marginTop: -5,
                backgroundColor: ['#FF006E', '#B829F7', '#00F0FF', '#39FF14', '#FFB800'][i % 5]
              }}
              aria-hidden="true"
            />
          )
        })}

        {/* Small floating particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`float-${i}`}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.8, 0],
              y: [-20, -60],
              x: [(i - 4) * 15, (i - 4) * 25]
            }}
            transition={{ 
              duration: 1.2,
              delay: 0.6 + i * 0.08,
              ease: "easeOut"
            }}
            className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-white"
            style={{ marginLeft: -2, marginTop: -2 }}
            aria-hidden="true"
          />
        ))}

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="sr-only">Opening capsule...</span>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 font-display text-h4 text-white tracking-wide"
      >
        Opening...
      </motion.p>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-2 w-32 h-1 rounded-full bg-white/10 overflow-hidden"
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
          animate={{ width: ['0%', '100%'] }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />
      </motion.div>
    </div>
  )
}
