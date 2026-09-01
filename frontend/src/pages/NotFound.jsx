import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="page-center">
      <div className="empty-state">
        <div className="empty-icon">404</div>
        <h2>Page not found</h2>
        <p>The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link to="/" className="btn btn-primary">Back to home</Link>
      </div>
    </div>
  )
}
