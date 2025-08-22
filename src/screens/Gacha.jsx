import React from 'react'
import { motion } from 'framer-motion'
import { useHistory } from 'react-router-dom'
import { useStore } from '../store'

export default function Gacha() {
  const history = useHistory()
  const { selectedCapsule } = useStore()

  const handleSwipeUp = () => {
    history.push('/inventory')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen flex flex-col"
    >
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          whileTap={{ scale: 0.95 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          onDragEnd={(e, { offset, velocity }) => {
            if (offset.y < -50 || velocity.y < -500) {
              handleSwipeUp()
            }
          }}
          className="w-full max-w-sm aspect-square bg-white/10 backdrop-blur-md rounded-3xl shadow-xl 
                     flex items-center justify-center cursor-grab active:cursor-grabbing"
        >
          <img
            src={`/capsules/${selectedCapsule || 'placeholder'}.svg`}
            alt="Gacha capsule"
            className="w-2/3 h-2/3 object-contain"
          />
        </motion.div>
      </div>
      
      <div className="pb-safe px-4 py-6">
        <div className="text-center text-white/60">
          Swipe up to view inventory
        </div>
      </div>
    </motion.div>
  )
}
