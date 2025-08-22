import { render, screen, fireEvent } from '@testing-library/react'
import ConnectButton from '../ConnectButton'
import { useStore } from '../../../store'

jest.mock('../../../store', () => ({
  useStore: jest.fn()
}))

describe('ConnectButton', () => {
  it('shows Connect Wallet when not connected', () => {
    useStore.mockReturnValue({
      wallet: { connected: false },
      connectWallet: jest.fn()
    })

    render(<ConnectButton />)
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
  })

  it('shows Connected when wallet is connected', () => {
    useStore.mockReturnValue({
      wallet: { connected: true },
      connectWallet: jest.fn()
    })

    render(<ConnectButton />)
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('calls connectWallet when clicked', () => {
    const connectWallet = jest.fn()
    useStore.mockReturnValue({
      wallet: { connected: false },
      connectWallet
    })

    render(<ConnectButton />)
    fireEvent.click(screen.getByText('Connect Wallet'))
    expect(connectWallet).toHaveBeenCalled()
  })
})
