import { useStore } from '../store'

export default function CapsuleInventory() {
  const { capsules, selectedCapsule, selectCapsule, openCapsule } = useStore()

  if (!capsules || capsules.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No capsules in your inventory</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {capsules.map((capsule) => (
          <div
            key={capsule.id}
            data-testid={`capsule-${capsule.id}`}
            className={`
              p-4 rounded-lg cursor-pointer transition-transform hover:scale-105 active:scale-95
              ${selectedCapsule === capsule.id ? 'ring-2 ring-purple-500 selected' : ''}
              ${capsule.rarity === 'rare' ? 'bg-purple-100' : 'bg-gray-100'}
            `}
            onClick={() => selectCapsule(capsule.id)}
          >
            <h3 className="font-medium text-center">{capsule.name}</h3>
          </div>
        ))}
      </div>

      {selectedCapsule && (
        <button
          className="mt-4 w-full py-2 px-4 bg-purple-600 text-white rounded-lg transition-opacity opacity-100"
          onClick={() => openCapsule(selectedCapsule)}
        >
          Open Capsule
        </button>
      )}
    </div>
  )
}
