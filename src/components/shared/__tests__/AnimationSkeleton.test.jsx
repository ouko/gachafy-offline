import { render } from '@testing-library/react';
import AnimationSkeleton from '../AnimationSkeleton';

describe('AnimationSkeleton', () => {
  it('renders with default classes', () => {
    const { container } = render(<AnimationSkeleton />);
    const skeleton = container.firstChild;
    
    expect(skeleton).toHaveClass('animate-pulse', 'bg-background-light', 'rounded-xl');
    expect(skeleton).toHaveAttribute('role', 'progressbar');
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
  });

  it('accepts custom className', () => {
    const { container } = render(<AnimationSkeleton className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('accepts custom style', () => {
    const style = { width: '100px', height: '100px' };
    const { container } = render(<AnimationSkeleton style={style} />);
    const skeleton = container.firstChild;
    
    expect(skeleton).toHaveStyle(style);
  });
});
