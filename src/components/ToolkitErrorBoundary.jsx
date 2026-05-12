import React from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'

export default class ToolkitErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    const { setError } = useStore.getState()
    setError(error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-secondary to-primary text-white p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-8 bg-black/40 backdrop-blur-lg rounded-2xl shadow-elevated max-w-md text-center"
            role="alert"
            aria-live="assertive"
          >
            <div 
              className="h-16 w-16 rounded-full bg-warning-500/20 flex items-center justify-center mx-auto mb-6"
              aria-hidden="true"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning-500">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h2 className="text-h3 font-display mb-3">Wallet Connection Error</h2>
            <p className="text-body text-white/70 mb-6">
              {this.state.error?.message || 'Failed to initialize wallet connection'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary px-8 py-3 text-body"
            >
              Retry Connection
            </button>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}
