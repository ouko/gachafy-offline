import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BottomNav } from './BottomNav';

describe('BottomNav', () => {
  it('fits three routes in a bounded three-column grid', () => {
    render(<MemoryRouter initialEntries={['/open']}><BottomNav /></MemoryRouter>);
    const nav = screen.getByRole('navigation');
    expect(nav.querySelector('.grid-cols-3')).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(3);
    screen.getAllByRole('link').forEach((link) => expect(link.className).toContain('min-w-0'));
  });
});
