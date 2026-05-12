import React from 'react'
import { motion } from 'framer-motion'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: props.error || null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.error && !prevState.hasError) {
      return { hasError: true, error: nextProps.error }
    }
    return null
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    // Capture to PostHog if available
    if (window.posthog) {
      window.posthog.capture('react_error_boundary', {
        error: error?.message,
        componentStack: errorInfo?.componentStack
      })
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    const error = this.state.error || this.props.error

    if (this.state.hasError || error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white bg-gradient-to-br from-secondary to-primary">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-8 bg-black/40 backdrop-blur-lg rounded-2xl shadow-elevated max-w-md text-center"
            role="alert"
            aria-live="assertive"
          >
            <div
              className="h-16 w-16 rounded-full bg-error-500/20 flex items-center justify-center mx-auto mb-6"
              aria-hidden="true"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-error-500">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <h2 className="text-h3 font-display mb-3">Something went wrong</h2>
            <p className="text-body text-white/70 mb-6">
              {error?.message || 'An unexpected error occurred'}
            </p>
            {import.meta.env.DEV && error && (
              <pre className="text-[10px] text-left bg-black/30 p-3 rounded-lg mb-4 overflow-auto max-h-40 text-text-muted font-mono">
                {error.stack}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 rounded-xl font-display text-body font-semibold text-white bg-gradient-to-b from-primary-500 to-primary-600 border-t border-white/20 shadow-[0_4px_0_#990042] active:shadow-[0_1px_0_#990042] active:translate-y-[3px] transition-all"
              >
                Go Home
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-xl font-display text-body font-semibold text-text-secondary hover:text-white hover:bg-white/5 border border-white/10 transition-all"
              >
                Reload
              </button>
            </div>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
