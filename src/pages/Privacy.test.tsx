import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Privacy from './Privacy';

const mockRequestPermission = vi.fn();
const mockOptOut = vi.fn();

vi.mock('@/lib/oneSignal', () => ({
  oneSignalService: {
    isConfigured: true,
    requestPermission: (...args: unknown[]) => mockRequestPermission(...args),
    optOut: (...args: unknown[]) => mockOptOut(...args),
  },
}));

describe('Privacy', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockRequestPermission.mockResolvedValue(true);
    mockOptOut.mockResolvedValue(undefined);
  });

  it('explains local and immutable blockchain data', () => {
    render(<Privacy />);
    expect(screen.getByRole('heading', { name: 'Privacy & Data Controls' })).toBeInTheDocument();
    expect(screen.getByText(/blockchain transactions are public and immutable/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export my data/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete local data/i })).toBeInTheDocument();
  });

  it('requests push permission only after an explicit notification action', async () => {
    const user = userEvent.setup();
    render(<Privacy />);
    expect(mockRequestPermission).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /enable notifications/i }));
    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
  });
});
