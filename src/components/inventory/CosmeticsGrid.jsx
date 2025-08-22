export default function CosmeticsGrid({ items = [] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {items.map((cosmetic, index) => (
        <div
          key={cosmetic.id}
          className="aspect-square rounded-xl bg-background-light p-4 opacity-0 translate-y-4 transition-all duration-300"
          style={{
            opacity: 1,
            transform: 'translateY(0)',
            transitionDelay: `${index * 100}ms`
          }}
        >
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div 
              className="h-12 w-12 rounded-full" 
              style={{ backgroundColor: cosmetic.hex }}
            />
            <span className="mt-2 font-display text-sm">{cosmetic.style}</span>
            <span className="mt-1 text-xs text-text-secondary capitalize">
              {cosmetic.rarity}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
