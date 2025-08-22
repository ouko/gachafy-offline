import { render, screen, fireEvent } from '@testing-library/react'
import { useStore } from '../../store'
import CapsuleInventory from '../CapsuleInventory'

jest.mock('../../store', () => ({
  useStore: jest.fn()
}))

describe('CapsuleInventory', () => {
  const mockCapsules = [
    { id: '1', name: 'Common Capsule', rarity: 'common' },
    { id: '2', name: 'Rare Capsule', rarity: 'rare' }
  ]

  beforeEach(() => {
    useStore.mockReturnValue({
      capsules: mockCapsules,
      selectedCapsule: null,
      selectCapsule: jest.fn(),
      openCapsule: jest.fn()
    })
  })

  it('displays capsules from inventory', () => {
    render(<CapsuleInventory />)
    expect(screen.getByText('Common Capsule')).toBeInTheDocument()
    expect(screen.getByText('Rare Capsule')).toBeInTheDocument()
  })

  it('shows empty state when no capsules', () => {
    useStore.mockReturnValue({
      capsules: [],
      selectedCapsule: null,
      selectCapsule: jest.fn(),
      openCapsule: jest.fn()
    })
    render(<CapsuleInventory />)
    expect(screen.getByText(/no capsules/i)).toBeInTheDocument()
  })

  it('calls selectCapsule when clicking a capsule', () => {
    const selectCapsule = jest.fn()
    useStore.mockReturnValue({
      capsules: mockCapsules,
      selectedCapsule: null,
      selectCapsule,
      openCapsule: jest.fn()
    })

    render(<CapsuleInventory />)
    fireEvent.click(screen.getByText('Common Capsule'))
    expect(selectCapsule).toHaveBeenCalledWith('1')
  })

  it('shows selected capsule state', () => {
    useStore.mockReturnValue({
      capsules: mockCapsules,
      selectedCapsule: '1',
      selectCapsule: jest.fn(),
      openCapsule: jest.fn()
    })

    render(<CapsuleInventory />)
    expect(screen.getByTestId('capsule-1')).toHaveClass('selected')
  })

  it('calls openCapsule when clicking open button', () => {
    const openCapsule = jest.fn()
    useStore.mockReturnValue({
      capsules: mockCapsules,
      selectedCapsule: '1',
      selectCapsule: jest.fn(),
      openCapsule
    })

    render(<CapsuleInventory />)
    fireEvent.click(screen.getByText(/open capsule/i))
    expect(openCapsule).toHaveBeenCalledWith('1')
  })
})
