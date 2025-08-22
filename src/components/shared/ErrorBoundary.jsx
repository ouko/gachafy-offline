import React, { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background-dark p-4 text-center">
          <h1 className="mb-4 font-display text-2xl text-primary">Oops!</h1>
          <p className="mb-6 text-text-secondary">Something went wrong. Try refreshing the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="tap-target rounded-full bg-secondary px-6 py-3 font-display text-white"
          >
            Refresh
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
