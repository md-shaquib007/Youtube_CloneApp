import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiClientError } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import PasswordInput from '../components/PasswordInput'

const MAX_FILE_SIZE = 5 * 1024 * 1024

export default function Register() {
  const { register, login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const avatarRef = useRef(null)
  const coverRef = useRef(null)

  const [form, setForm] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
  })
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const avatarPreviewRef = useRef(null)
  const coverPreviewRef = useRef(null)

  const revokePreview = (type) => {
    const ref = type === 'avatar' ? avatarPreviewRef : coverPreviewRef
    if (ref.current) {
      URL.revokeObjectURL(ref.current)
      ref.current = null
    }
  }

  useEffect(() => {
    return () => {
      revokePreview('avatar')
      revokePreview('cover')
    }
  }, [])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      const msg = 'Image must be smaller than 5 MB'
      setError(msg)
      toast.error(msg)
      e.target.value = ''
      return
    }

    revokePreview(type)
    const url = URL.createObjectURL(file)
    if (type === 'avatar') {
      avatarPreviewRef.current = url
      setAvatarPreview(url)
    } else {
      coverPreviewRef.current = url
      setCoverPreview(url)
    }
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const avatarFile = avatarRef.current?.files?.[0]
    if (!avatarFile) {
      setError('Profile photo is required')
      setLoading(false)
      return
    }

    const formData = new FormData()
    formData.append('username', form.username.toLowerCase())
    formData.append('email', form.email)
    formData.append('fullName', form.fullName)
    formData.append('password', form.password)
    formData.append('avatar', avatarFile)

    const coverFile = coverRef.current?.files?.[0]
    if (coverFile) formData.append('coverImage', coverFile)

    try {
      await register(formData)
      await login({ email: form.email, password: form.password })
      toast.success('Account created! Welcome to ChaiTube.')
      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof ApiClientError) {
        const detail = err.errors?.length ? `: ${err.errors.join(', ')}` : ''
        const msg = `${err.message}${detail}`
        setError(msg)
        toast.error(msg)
      } else {
        setError('Registration failed')
        toast.error('Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <h1>Create your account</h1>
          <p>Join ChaiTube and start building your channel</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={form.fullName}
                onChange={handleChange}
                placeholder="John Doe"
              />
            </div>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                minLength={3}
                value={form.username}
                onChange={handleChange}
                placeholder="johndoe"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
          </div>

          <PasswordInput
            id="password"
            name="password"
            label="Password"
            required
            minLength={6}
            value={form.password}
            onChange={handleChange}
            placeholder="At least 6 characters"
          />

          <div className="upload-section">
            <div className="upload-group">
              <label>Profile photo <span className="required">*</span></label>
              <div className="upload-box">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" className="upload-preview round" />
                ) : (
                  <div className="upload-placeholder round">📷</div>
                )}
                <input
                  ref={avatarRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'avatar')}
                  required
                />
                <span className="upload-hint">Required — max 5 MB</span>
              </div>
            </div>

            <div className="upload-group">
              <label>Cover image</label>
              <div className="upload-box">
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover preview" className="upload-preview wide" />
                ) : (
                  <div className="upload-placeholder wide">🖼️</div>
                )}
                <input
                  ref={coverRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'cover')}
                />
                <span className="upload-hint">Optional — max 5 MB</span>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
