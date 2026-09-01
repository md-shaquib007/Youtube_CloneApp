import { useEffect, useRef, useState } from 'react'
import { ApiClientError, api } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import PasswordInput from '../components/PasswordInput'

const MAX_FILE_SIZE = 5 * 1024 * 1024

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function Profile() {
  const { user, updateUser } = useAuth()
  const toast = useToast()
  const avatarRef = useRef(null)
  const coverRef = useRef(null)

  const [accountForm, setAccountForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
  })
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
  })
  const [loading, setLoading] = useState('')

  useEffect(() => {
    if (user) {
      setAccountForm({ fullName: user.fullName, email: user.email })
    }
  }, [user])

  const handleAccountSubmit = async (e) => {
    e.preventDefault()
    setLoading('account')
    try {
      const updated = await api.updateAccount(accountForm)
      updateUser(updated)
      toast.success('Account details updated')
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Update failed')
    } finally {
      setLoading('')
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setLoading('password')
    try {
      await api.changePassword(passwordForm)
      setPasswordForm({ oldPassword: '', newPassword: '' })
      toast.success('Password changed successfully')
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Password change failed')
    } finally {
      setLoading('')
    }
  }

  const handleImageUpload = async (type) => {
    const ref = type === 'avatar' ? avatarRef : coverRef
    const file = ref.current?.files?.[0]
    if (!file) {
      toast.error('Please select a file first')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image must be smaller than 5 MB')
      return
    }

    const formData = new FormData()
    formData.append(type === 'avatar' ? 'avatar' : 'coverImage', file)

    setLoading(type)
    try {
      const updated = type === 'avatar'
        ? await api.updateAvatar(formData)
        : await api.updateCoverImage(formData)
      updateUser(updated)
      toast.success(`${type === 'avatar' ? 'Avatar' : 'Cover image'} updated`)
      ref.current.value = ''
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Upload failed')
    } finally {
      setLoading('')
    }
  }

  if (!user) return null

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>Profile settings</h1>
        <p>Manage your account and channel appearance</p>
      </div>

      <div className="profile-grid">
        <section className="card profile-summary">
          <div
            className="profile-cover"
            style={{ backgroundImage: user.coverImage ? `url(${user.coverImage})` : undefined }}
          />
          <div className="profile-summary-body">
            <img src={user.avatar} alt={user.fullName} className="profile-avatar" />
            <div>
              <h2>{user.fullName}</h2>
              <p className="text-muted">@{user.username}</p>
              <p className="text-muted text-sm">
                Joined {user.createdAt ? formatDate(user.createdAt) : '—'}
              </p>
            </div>
          </div>
        </section>

        <section className="card">
          <h3>Account details</h3>
          <form onSubmit={handleAccountSubmit} className="stack-form">
            <div className="form-group">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                value={accountForm.fullName}
                onChange={(e) => setAccountForm((p) => ({ ...p, fullName: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={accountForm.email}
                onChange={(e) => setAccountForm((p) => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading === 'account'}>
              {loading === 'account' ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </section>

        <section className="card">
          <h3>Change password</h3>
          <form onSubmit={handlePasswordSubmit} className="stack-form">
            <PasswordInput
              id="oldPassword"
              name="oldPassword"
              label="Current password"
              autoComplete="current-password"
              required
              value={passwordForm.oldPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, oldPassword: e.target.value }))}
            />
            <PasswordInput
              id="newPassword"
              name="newPassword"
              label="New password"
              autoComplete="new-password"
              required
              minLength={6}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
            />
            <button type="submit" className="btn btn-primary" disabled={loading === 'password'}>
              {loading === 'password' ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </section>

        <section className="card">
          <h3>Profile images</h3>
          <div className="image-upload-row">
            <div className="image-upload-item">
              <label>Avatar</label>
              <img src={user.avatar} alt="" className="upload-preview round" />
              <input ref={avatarRef} type="file" accept="image/*" />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleImageUpload('avatar')}
                disabled={loading === 'avatar'}
              >
                {loading === 'avatar' ? 'Uploading...' : 'Upload avatar'}
              </button>
            </div>
            <div className="image-upload-item">
              <label>Cover image</label>
              {user.coverImage ? (
                <img src={user.coverImage} alt="" className="upload-preview wide" />
              ) : (
                <div className="upload-placeholder wide">No cover image</div>
              )}
              <input ref={coverRef} type="file" accept="image/*" />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleImageUpload('cover')}
                disabled={loading === 'cover'}
              >
                {loading === 'cover' ? 'Uploading...' : 'Upload cover'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
