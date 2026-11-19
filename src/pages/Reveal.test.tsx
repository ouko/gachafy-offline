import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Reveal from './Reveal';
import type { GachaBadge } from '@/lib/gateway';

const mockGetBadgeByTransaction = vi.fn();

vi.mock('@/lib/gateway', () => ({
  getBadgeByTransaction: (...args: unknown[]) => mockGetBadgeByTransaction(...args),
}));

vi.mock('@/lib/radix-config', () => ({
  getTxExplorerUrl: (hash: string) => `https://example.test/${hash}`,
  shortenTxHash: (hash: string) => hash,
}));

const realBadge: GachaBadge = {
  id: '#99#',
  resourceAddress: 'resource_tdx_2_1badge',
  name: 'Actual Chain Badge',
  tier: 'rare',
  rarity: 'rare',
  sp: 350,
  nonce: 123,
  mintedAtEpoch: 10,
  imageUrl: 'https://gachafi.app/badges/rare.png',
  description: 'Resolved from the mint transaction',
};

function renderReveal() {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/reveal', state: { txHash: 'txid_test_123' } }]}>
      <Routes>
        <Route path="/reveal" element={<Reveal />} />
        <Route path="/inventory" element={<div>Collection destination</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Reveal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders values from the minted NFT instead of local tier constants', async () => {
    mockGetBadgeByTransaction.mockResolvedValue(realBadge);
    renderReveal();

    expect(await screen.findByText('Actual Chain Badge')).toBeInTheDocument();
    expect(await screen.findByText('350')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Actual Chain Badge' })).toHaveAttribute('src', realBadge.imageUrl);
    expect(mockGetBadgeByTransaction).toHaveBeenCalledWith('txid_test_123');
  });

  it('shows a retryable error when Gateway resolution fails', async () => {
    const user = userEvent.setup();
    mockGetBadgeByTransaction.mockRejectedValueOnce(new Error('Gateway unavailable'));
    renderReveal();

    expect(await screen.findByText('Could not load your badge')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(mockGetBadgeByTransaction).toHaveBeenCalledTimes(2);
  });

  it('keeps an indexing delay distinct from a failed transaction', async () => {
    mockGetBadgeByTransaction.mockResolvedValue(null);
    renderReveal();
    expect(await screen.findByText('Confirming your badge…')).toBeInTheDocument();
    expect(screen.queryByText(/transaction failed/i)).not.toBeInTheDocument();
  });
});
