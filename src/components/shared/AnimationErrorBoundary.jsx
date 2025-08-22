import React from 'react';

class AnimationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Animation Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={this.props.fallbackClassName || ''}>
          {this.props.fallback || this.props.children}
        </div>
      );
    }

    return this.props.children;
  }
}

export default AnimationErrorBoundary;
