import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ApiClientError, usersApi } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/LoadingSpinner'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { refreshUser } = useAuth()

  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided.')
      return
    }

    usersApi.verifyEmail(token)
      .then(async () => {
        await refreshUser()
        setStatus('success')
        setMessage('Your email has been verified successfully!')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(
          err instanceof ApiClientError
            ? err.message
            : 'Verification failed. The link may have expired.'
        )
      })
  }, [token, refreshUser])

  return (
    <div className="auth-page">
      <div className="auth-card">
        {status === 'loading' && (
          <LoadingSpinner label="Verifying your email..." />
        )}

        {status === 'success' && (
          <>
            <div className="auth-header">
              <h1>Email verified!</h1>
              <p>{message}</p>
            </div>
            <Link to="/upload" className="btn btn-primary btn-full">
              Start uploading
            </Link>
            <Link to="/" className="btn btn-secondary btn-full" style={{ marginTop: '0.75rem' }}>
              Go home
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="auth-header">
              <h1>Verification failed</h1>
              <p>{message}</p>
            </div>
            <Link to="/profile" className="btn btn-primary btn-full">
              Go to profile
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
