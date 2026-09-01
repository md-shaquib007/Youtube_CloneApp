import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiClientError, videosApi } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatDuration } from '../utils/format'

export default function Watch() {
  const { videoId } = useParams()
  const viewRecorded = useRef(false)

  const [video, setVideo] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await videosApi.getById(videoId)
        if (!cancelled) setVideo(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiClientError ? err.message : 'Failed to load video')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [videoId])

  useEffect(() => {
    if (!video || viewRecorded.current) return
    viewRecorded.current = true
    videosApi.recordView(videoId).catch(() => {})
  }, [video, videoId])

  if (loading) {
    return (
      <div className="page-center">
        <LoadingSpinner label="Loading video..." />
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="page-center">
        <div className="empty-state">
          <h2>Video not found</h2>
          <p>{error || 'This video may have been removed.'}</p>
          <Link to="/" className="btn btn-primary">Go home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="watch-page">
      <div className="watch-player">
        <video
          src={video.videoFile}
          controls
          poster={video.thumbnail}
          className="video-player"
        >
          Your browser does not support video playback.
        </video>
      </div>

      <div className="watch-details">
        <h1>{video.title}</h1>
        <div className="watch-meta">
          <span>{(video.views || 0).toLocaleString()} views</span>
          {video.duration > 0 && (
            <>
              <span className="stat-divider">•</span>
              <span>{formatDuration(video.duration)}</span>
            </>
          )}
        </div>

        {video.owner && (
          <div className="watch-channel">
            <Link to={`/channel/${video.owner.username}`} className="watch-channel-link">
              <img src={video.owner.avatar} alt="" className="watch-channel-avatar" />
              <div>
                <strong>{video.owner.fullName}</strong>
                <span className="text-muted">@{video.owner.username}</span>
              </div>
            </Link>
          </div>
        )}

        <div className="watch-description">
          <h3>Description</h3>
          <p>{video.description}</p>
        </div>
      </div>
    </div>
  )
}
