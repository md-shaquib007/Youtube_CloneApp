import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { usersApi } from '../api/client'
import { useState } from 'react'

export default function EmailVerificationBanner() {
  const { user, refreshUser } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  if (!user || user.isEmailVerified) return null

  const handleResend = async () => {
    setLoading(true)
    try {
      await usersApi.resendVerification()
      toast.success('Verification email sent! Check your inbox.')
    } catch (err) {
      toast.error(err.message || 'Failed to send verification email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="verify-banner">
      <div className="verify-banner-content">
        <span>Please verify your email to upload videos.</span>
        <div className="verify-banner-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleResend}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Resend email'}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={refreshUser}
          >
            I&apos;ve verified
          </button>
        </div>
      </div>
    </div>
  )
}
