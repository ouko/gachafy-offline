import { render, screen } from '@testing-library/react';
import AnimationErrorBoundary from '../AnimationErrorBoundary';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const ThrowError = () => {
  throw new Error('Test animation error');
};

describe('AnimationErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when no error occurs', () => {
    render(
      <AnimationErrorBoundary>
        <div>Test Content</div>
      </AnimationErrorBoundary>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders fallback when error occurs', () => {
    render(
      <AnimationErrorBoundary fallback={<div>Fallback Content</div>}>
        <ThrowError />
      </AnimationErrorBoundary>
    );
    expect(screen.getByText('Fallback Content')).toBeInTheDocument();
  });

  it('applies fallback className when provided', () => {
    render(
      <AnimationErrorBoundary fallbackClassName="test-class" fallback={<div>Fallback</div>}>
        <ThrowError />
      </AnimationErrorBoundary>
    );
    expect(document.querySelector('.test-class')).toBeInTheDocument();
  });
});
