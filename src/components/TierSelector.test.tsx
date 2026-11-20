import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TierSelector, tiers } from './TierSelector';

function renderSelector() {
  const props = {
    selectedTier: tiers[0],
    onSelect: vi.fn(),
    onPlaySound: vi.fn(),
    onPlayHover: vi.fn(),
    boosterActive: false,
    boosterCost: 0,
  };
  render(<TierSelector {...props} />);
  return props;
}

describe('TierSelector', () => {
  it('uses native buttons with stable selected state', () => {
    renderSelector();
    expect(screen.getByRole('button', { name: /Common, 8 XRD/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Rare, 15 XRD/i })).toHaveAttribute('aria-pressed', 'false');
    expect(document.querySelector('[role="button"]')).toBeNull();
    expect(screen.queryByRole('button', { name: /scroll tiers/i })).not.toBeInTheDocument();
  });

  it('selects a tier through keyboard or pointer interaction', async () => {
    const user = userEvent.setup();
    const props = renderSelector();
    const rare = screen.getByRole('button', { name: /Rare, 15 XRD/i });
    await user.click(rare);
    expect(props.onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'rare' }));
    expect(props.onPlaySound).toHaveBeenCalledTimes(1);
  });
});
