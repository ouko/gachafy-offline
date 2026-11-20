import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppHeader } from './AppHeader';

describe('AppHeader', () => {
  it('links the vector brand home and exposes labeled audio controls', () => {
    render(<MemoryRouter initialEntries={['/open']}><AppHeader /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /GachaFi home/i })).toHaveAttribute('href', '/open');
    expect(screen.getByRole('button', { name: /audio/i })).toBeInTheDocument();
  });

  it('is hidden on immersive landing and reveal routes', () => {
    const { container } = render(<MemoryRouter initialEntries={['/reveal']}><AppHeader /></MemoryRouter>);
    expect(container).toBeEmptyDOMElement();
  });
});
