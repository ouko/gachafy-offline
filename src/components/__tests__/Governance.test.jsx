import { render, screen, fireEvent } from '@testing-library/react'
import { useStore } from '../../store'
import Governance from '../Governance'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../store', () => ({
  useStore: vi.fn()
}))

describe('Governance', () => {
  const mockProposals = [
    { id: '1', title: 'Increase Drop Rate', status: 'active', votes: 100 },
    { id: '2', title: 'Add New Capsule Type', status: 'closed', votes: 250 }
  ]

  beforeEach(() => {
    useStore.mockReturnValue({
      proposals: mockProposals,
      userVotes: {},
      voteOnProposal: vi.fn(),
      createProposal: vi.fn()
    })
  })

  it('displays active proposals', () => {
    render(<Governance />)
    expect(screen.getByText('Increase Drop Rate')).toBeInTheDocument()
    expect(screen.getByText('100 votes')).toBeInTheDocument()
  })

  it('shows closed proposals separately', () => {
    render(<Governance />)
    const section = screen.getByRole('region', { name: /closed proposals/i })
    expect(section).toBeInTheDocument()
    expect(screen.getByText('Add New Capsule Type')).toBeInTheDocument()
    expect(screen.getByText('250 votes')).toBeInTheDocument()
    expect(screen.getByText('Closed', { selector: 'span' })).toBeInTheDocument()
  })

  it('allows voting on active proposals', () => {
    const voteOnProposal = vi.fn()
    useStore.mockReturnValue({
      proposals: mockProposals,
      userVotes: {},
      voteOnProposal,
      createProposal: vi.fn()
    })

    render(<Governance />)
    fireEvent.click(screen.getByTestId('vote-button-1'))
    expect(voteOnProposal).toHaveBeenCalledWith('1')
  })

  it('shows user voted state', () => {
    useStore.mockReturnValue({
      proposals: mockProposals,
      userVotes: { '1': true },
      voteOnProposal: vi.fn(),
      createProposal: vi.fn()
    })

    render(<Governance />)
    expect(screen.getByTestId('vote-button-1')).toBeDisabled()
  })

  it('opens proposal creation modal', () => {
    render(<Governance />)
    fireEvent.click(screen.getByText(/create proposal/i))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('submits new proposal', () => {
    const createProposal = vi.fn()
    useStore.mockReturnValue({
      proposals: [],
      userVotes: {},
      voteOnProposal: vi.fn(),
      createProposal
    })

    render(<Governance />)
    fireEvent.click(screen.getByText(/create proposal/i))
    
    const titleInput = screen.getByLabelText(/title/i)
    fireEvent.change(titleInput, { target: { value: 'New Proposal' } })
    
    const form = screen.getByRole('form')
    fireEvent.submit(form)
    
    expect(createProposal).toHaveBeenCalledWith({
      title: 'New Proposal',
      description: ''
    })
  })
})
