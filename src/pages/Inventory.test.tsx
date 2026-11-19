import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Inventory from './Inventory';
import type { GachaBadge } from '@/lib/gateway';

const mockGetBadgeInventory = vi.fn();
const mockGetTotalMinted = vi.fn();
const mockConnectWallet = vi.fn();
const walletState = { address: 'account_tdx_2_1test', isConnected: true };

vi.mock('@/lib/gateway', () => ({
  getBadgeInventory: (...args: unknown[]) => mockGetBadgeInventory(...args),
  getTotalMinted: (...args: unknown[]) => mockGetTotalMinted(...args),
}));

vi.mock('@/hooks/useWallet', () => ({
  useWallet: () => ({ ...walletState, connectWallet: mockConnectWallet }),
}));

const badge = (id: string, sp: number): GachaBadge => ({
  id,
  resourceAddress: 'resource_tdx_2_1badge',
  name: `Badge ${id}`,
  tier: 'common',
  rarity: 'common',
  sp,
  nonce: 1,
  mintedAtEpoch: 10,
  imageUrl: 'https://gachafi.app/badges/common.png',
  description: 'A test badge',
});

describe('Inventory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    walletState.address = 'account_tdx_2_1test';
    walletState.isConnected = true;
    mockGetBadgeInventory.mockResolvedValue([]);
    mockGetTotalMinted.mockResolvedValue(0);
  });

  it('prompts disconnected users to connect', () => {
    walletState.isConnected = false;
    walletState.address = '';
    render(<Inventory />);
    expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
    expect(mockGetBadgeInventory).not.toHaveBeenCalled();
  });

  it('shows a successful empty collection', async () => {
    render(<Inventory />);
    expect(await screen.findByText('No badges yet')).toBeInTheDocument();
    expect(screen.getByText('0', { selector: '.total-supply' })).toBeInTheDocument();
  });

  it('derives SP from real NFTs and renders their images', async () => {
    mockGetBadgeInventory.mockResolvedValue([badge('#1#', 100), badge('#2#', 350)]);
    mockGetTotalMinted.mockResolvedValue(2);
    render(<Inventory />);

    expect(await screen.findByText('Badge #1#')).toBeInTheDocument();
    expect(screen.getByText('Badge #2#')).toBeInTheDocument();
    expect(screen.getByText('450')).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(2);
    expect(screen.getByText('2', { selector: '.total-supply' })).toBeInTheDocument();
  });

  it('shows errors and retries both reads', async () => {
    const user = userEvent.setup();
    mockGetBadgeInventory.mockRejectedValueOnce(new Error('Gateway unavailable'));
    mockGetTotalMinted.mockRejectedValueOnce(new Error('Gateway unavailable'));
    render(<Inventory />);

    expect(await screen.findByText('Could not load your collection')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /try again/i }));
    await waitFor(() => expect(mockGetBadgeInventory).toHaveBeenCalledTimes(2));
    expect(mockGetTotalMinted).toHaveBeenCalledTimes(2);
  });

  it('refreshes when the wallet account changes', async () => {
    const { rerender } = render(<Inventory />);
    await waitFor(() => expect(mockGetBadgeInventory).toHaveBeenCalledWith('account_tdx_2_1test'));
    walletState.address = 'account_tdx_2_1other';
    rerender(<Inventory />);
    await waitFor(() => expect(mockGetBadgeInventory).toHaveBeenCalledWith('account_tdx_2_1other'));
  });
});
