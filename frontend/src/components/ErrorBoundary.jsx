import { Component } from 'react'
import { Link } from 'react-router-dom'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-center">
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p>An unexpected error occurred. Please try refreshing the page.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Refresh page
            </button>
            <Link to="/" className="btn btn-secondary" style={{ marginTop: '0.75rem' }}>
              Go home
            </Link>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
