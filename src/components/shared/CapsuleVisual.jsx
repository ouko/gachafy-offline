import React from 'react'
import { motion } from 'framer-motion'

const TIER_STYLES = {
  bronze: {
    topColor: '#CD7F32',
    bottomColor: '#8B4513',
    stripeColor: '#D4A574',
    glow: 'rgba(205, 127, 50, 0.5)',
    label: 'BRONZE'
  },
  silver: {
    topColor: '#C0C0C0',
    bottomColor: '#808080',
    stripeColor: '#E8E8E8',
    glow: 'rgba(184, 41, 247, 0.5)',
    label: 'SILVER'
  },
  gold: {
    topColor: '#FFD700',
    bottomColor: '#B8860B',
    stripeColor: '#FFF8DC',
    glow: 'rgba(0, 240, 255, 0.5)',
    label: 'GOLD'
  },
  common: {
    topColor: '#9CA3AF',
    bottomColor: '#4B5563',
    stripeColor: '#D1D5DB',
    glow: 'rgba(156, 163, 175, 0.4)',
    label: 'COMMON'
  },
  rare: {
    topColor: '#00F0FF',
    bottomColor: '#008B8B',
    stripeColor: '#80F8FF',
    glow: 'rgba(0, 240, 255, 0.5)',
    label: 'RARE'
  },
  epic: {
    topColor: '#B829F7',
    bottomColor: '#6B21A8',
    stripeColor: '#D8A5FF',
    glow: 'rgba(184, 41, 247, 0.5)',
    label: 'EPIC'
  },
  legendary: {
    topColor: '#FF006E',
    bottomColor: '#CC0058',
    stripeColor: '#FF80B8',
    glow: 'rgba(255, 0, 110, 0.6)',
    label: 'LEGENDARY'
  }
}

export default function CapsuleVisual({ tier = 'bronze', size = 240, animate = true }) {
  const style = TIER_STYLES[tier] || TIER_STYLES.bronze
  const s = size
  const w = s
  const h = s * 1.3

  const capsuleVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    }
  }

  const floatVariants = {
    animate: {
      y: [0, -12, 0],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
    }
  }

  return (
    <motion.div
      variants={capsuleVariants}
      initial="initial"
      animate="animate"
      className="relative"
      style={{ width: w, height: h }}
    >
      {/* Glow behind capsule */}
      <div 
        className="absolute inset-0 blur-3xl rounded-full"
        style={{ 
          background: style.glow,
          transform: 'scale(1.4)',
          opacity: 0.6
        }}
        aria-hidden="true"
      />

      {/* Floating animation wrapper */}
      <motion.div
        variants={animate ? floatVariants : {}}
        animate="animate"
        className="relative w-full h-full"
      >
        <svg
          viewBox="0 0 200 260"
          className="w-full h-full"
          style={{ filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.5))' }}
          aria-hidden="true"
        >
          <defs>
            {/* Top half gradient */}
            <linearGradient id={`topGrad-${tier}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={style.topColor} />
              <stop offset="100%" stopColor={style.topColor} stopOpacity="0.8" />
            </linearGradient>
            
            {/* Bottom half gradient */}
            <linearGradient id={`botGrad-${tier}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={style.bottomColor} stopOpacity="0.9" />
              <stop offset="100%" stopColor={style.bottomColor} />
            </linearGradient>

            {/* Stripe gradient */}
            <linearGradient id={`stripeGrad-${tier}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={style.stripeColor} stopOpacity="0.3" />
              <stop offset="50%" stopColor={style.stripeColor} stopOpacity="0.8" />
              <stop offset="100%" stopColor={style.stripeColor} stopOpacity="0.3" />
            </linearGradient>

            {/* Highlight */}
            <linearGradient id={`highlight-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.3" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>

            {/* Clip path for capsule shape */}
            <clipPath id={`capsuleClip-${tier}`}>
              <rect x="30" y="10" width="140" height="240" rx="70" ry="70" />
            </clipPath>
          </defs>

          {/* Main capsule body */}
          <g clipPath={`url(#capsuleClip-${tier})`}>
            {/* Top half */}
            <rect x="30" y="10" width="140" height="125" fill={`url(#topGrad-${tier})`} />
            {/* Bottom half */}
            <rect x="30" y="130" width="140" height="120" fill={`url(#botGrad-${tier})`} />
            
            {/* Middle stripe */}
            <rect x="30" y="120" width="140" height="20" fill={`url(#stripeGrad-${tier})`} />
            
            {/* Diagonal shine */}
            <rect x="30" y="10" width="140" height="240" fill={`url(#highlight-${tier})`} />

            {/* Subtle grid pattern */}
            <pattern id={`grid-${tier}`} width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeOpacity="0.05" strokeWidth="0.5"/>
            </pattern>
            <rect x="30" y="10" width="140" height="240" fill={`url(#grid-${tier})`} />
          </g>

          {/* Outer border glow */}
          <rect x="30" y="10" width="140" height="240" rx="70" ry="70" 
            fill="none" 
            stroke={style.topColor} 
            strokeWidth="2"
            strokeOpacity="0.5"
          />

          {/* Inner border */}
          <rect x="35" y="15" width="130" height="230" rx="65" ry="65" 
            fill="none" 
            stroke="white" 
            strokeWidth="1"
            strokeOpacity="0.15"
          />

          {/* Star icon center */}
          <g transform="translate(100, 100)">
            <polygon 
              points="0,-18 5,-6 18,-6 8,2 12,15 0,8 -12,15 -8,2 -18,-6 -5,-6" 
              fill={style.stripeColor}
              fillOpacity="0.9"
            />
          </g>

          {/* Label */}
          <text 
            x="100" 
            y="185" 
            textAnchor="middle" 
            fill="white" 
            fontSize="14" 
            fontWeight="bold"
            fontFamily="Space Grotesk, system-ui, sans-serif"
            letterSpacing="2"
            opacity="0.9"
          >
            {style.label}
          </text>

          {/* Small decorative dots */}
          <circle cx="55" cy="215" r="3" fill={style.stripeColor} fillOpacity="0.6" />
          <circle cx="100" cy="220" r="3" fill={style.stripeColor} fillOpacity="0.6" />
          <circle cx="145" cy="215" r="3" fill={style.stripeColor} fillOpacity="0.6" />
        </svg>
      </motion.div>
    </motion.div>
  )
}
