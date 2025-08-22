import { useState, useEffect } from 'react'

const RARITY_COLORS = {
  common: 'bg-text-secondary',
  rare: 'bg-secondary',
  legendary: 'bg-primary'
}

export default function LootCardStack({ items = [] }) {
  return (
    <div className="relative h-64 w-64">
      {items.map((item, index) => (
        <div
          key={item.id}
          className={`absolute inset-0 rounded-xl ${RARITY_COLORS[item.rarity]} p-4 shadow-xl transition-all duration-600 ease-custom`}
          style={{
            transform: `scale(1) translateY(0) rotate(${(index - items.length / 2) * 5}deg)`,
            transitionDelay: `${index * 150}ms`,
            '--tw-ease-custom': 'cubic-bezier(0.22, 1, 0.36, 1)'
          }}
        >
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="font-display text-xl">{item.name}</span>
              <span className="mt-2 text-sm capitalize">{item.rarity}</span>
            </div>
          </div>
        ))}
    </div>
  )
}
