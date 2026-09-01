import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiClientError, videosApi } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'

const MAX_VIDEO_SIZE = 100 * 1024 * 1024
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export default function Upload() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const thumbnailRef = useRef(null)

  const [form, setForm] = useState({ title: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const videoFile = videoRef.current?.files?.[0]
    const thumbnailFile = thumbnailRef.current?.files?.[0]

    if (!videoFile) {
      setError('Video file is required')
      setLoading(false)
      return
    }

    if (!thumbnailFile) {
      setError('Thumbnail is required')
      setLoading(false)
      return
    }

    if (videoFile.size > MAX_VIDEO_SIZE) {
      setError('Video must be smaller than 100 MB')
      setLoading(false)
      return
    }

    if (thumbnailFile.size > MAX_IMAGE_SIZE) {
      setError('Thumbnail must be smaller than 5 MB')
      setLoading(false)
      return
    }

    const formData = new FormData()
    formData.append('title', form.title)
    formData.append('description', form.description)
    formData.append('videoFile', videoFile)
    formData.append('thumbnail', thumbnailFile)

    try {
      const video = await videosApi.publish(formData)
      toast.success('Video published successfully!')
      navigate(`/watch/${video._id}`)
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Upload failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (user && !user.isEmailVerified) {
    return (
      <div className="page-center">
        <div className="empty-state">
          <div className="empty-icon">✉️</div>
          <h2>Verify your email</h2>
          <p>You need to verify your email before uploading videos.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="upload-page">
      <div className="page-header">
        <h1>Upload video</h1>
        <p>Share your content with the world</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="card upload-form">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            required
            maxLength={200}
            placeholder="Give your video a title"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            required
            rows={4}
            maxLength={5000}
            placeholder="Tell viewers about your video"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="videoFile">Video file</label>
            <input
              ref={videoRef}
              id="videoFile"
              type="file"
              accept="video/*"
              required
            />
            <span className="upload-hint">MP4, WebM — max 100 MB</span>
          </div>
          <div className="form-group">
            <label htmlFor="thumbnail">Thumbnail</label>
            <input
              ref={thumbnailRef}
              id="thumbnail"
              type="file"
              accept="image/*"
              required
            />
            <span className="upload-hint">JPG, PNG — max 5 MB</span>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Uploading...' : 'Publish video'}
        </button>
      </form>
    </div>
  )
}
