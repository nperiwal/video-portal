import React from 'react'

class ErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please try refreshing the page.</div>
    }
    return this.props.children
  }
}

// Use it in App.jsx
const App = () => {
  return (
    <ErrorBoundary>
      {/* Your existing app code */}
    </ErrorBoundary>
  )
} 