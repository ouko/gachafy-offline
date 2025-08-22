import { useStore } from '../store'

const truncateAddress = (address) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function Leaderboard() {
  const { leaderboard, userAddress, timeframe } = useStore()

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No leaderboard data available</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capsules</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leaderboard.map((player, index) => (
              <tr
                key={player.address}
                data-testid={`player-row-${player.address}`}
                className={`${player.address === userAddress ? 'bg-purple-50' : ''} opacity-0 transition-opacity duration-300`}
                style={{
                  opacity: 1,
                  transitionDelay: `${index * 100}ms`
                }}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <span data-testid="rank-number" className="text-sm text-gray-900">#{player.rank}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{truncateAddress(player.address)}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span data-testid="player-score" className="text-sm font-medium text-gray-900">{player.score}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span data-testid="capsule-count" className="text-sm text-gray-900">{player.capsules}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
