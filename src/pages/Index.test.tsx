import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Index from './Index';

describe('Landing page', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('offers an explicit Play action instead of redirecting automatically', () => {
    vi.useFakeTimers();
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/open" element={<div>Open destination</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /play now/i })).toHaveAttribute('href', '/open');
    expect(screen.getByText(/Open\. Reveal\. Collect\./i)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(7000);
    });
    expect(screen.queryByText('Open destination')).not.toBeInTheDocument();
  });
});
