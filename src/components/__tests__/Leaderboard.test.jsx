import { render, screen } from '@testing-library/react'
import { useStore } from '../../store'
import Leaderboard from '../Leaderboard'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../store', () => ({
  useStore: vi.fn()
}))

describe('Leaderboard', () => {
  const mockLeaderboard = [
    { address: '0x123', score: 1000, capsules: 5, rank: 1 },
    { address: '0x456', score: 800, capsules: 3, rank: 2 },
    { address: '0x789', score: 600, capsules: 2, rank: 3 }
  ]

  beforeEach(() => {
    useStore.mockReturnValue({
      leaderboard: mockLeaderboard,
      userAddress: '0x123',
      timeframe: 'weekly'
    })
  })

  it('displays leaderboard entries in order', () => {
    render(<Leaderboard />)
    const scores = screen.getAllByTestId('player-score')
    expect(scores[0]).toHaveTextContent('1000')
    expect(scores[1]).toHaveTextContent('800')
    expect(scores[2]).toHaveTextContent('600')
  })

  it('highlights user position', () => {
    render(<Leaderboard />)
    expect(screen.getByTestId('player-row-0x123')).toHaveClass('bg-purple-50')
  })

  it('shows rank numbers', () => {
    render(<Leaderboard />)
    const ranks = screen.getAllByTestId('rank-number')
    expect(ranks[0]).toHaveTextContent('#1')
    expect(ranks[1]).toHaveTextContent('#2')
    expect(ranks[2]).toHaveTextContent('#3')
  })

  it('displays capsule counts', () => {
    render(<Leaderboard />)
    const capsuleCounts = screen.getAllByTestId('capsule-count')
    expect(capsuleCounts[0]).toHaveTextContent('5')
    expect(capsuleCounts[1]).toHaveTextContent('3')
    expect(capsuleCounts[2]).toHaveTextContent('2')
  })

  it('shows empty state when no entries', () => {
    useStore.mockReturnValue({
      leaderboard: [],
      userAddress: '0x123',
      timeframe: 'weekly'
    })
    render(<Leaderboard />)
    expect(screen.getByText(/no leaderboard data/i)).toBeInTheDocument()
  })

  it('truncates long addresses', () => {
    render(<Leaderboard />)
    const address = screen.getByText(/0x123/)
    expect(address).toHaveTextContent('0x123...') // Assuming address truncation
  })
})
