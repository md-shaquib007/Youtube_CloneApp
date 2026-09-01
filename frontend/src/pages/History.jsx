import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiClientError, usersApi } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import VideoCard from '../components/VideoCard'

export default function History() {
  const [videos, setVideos] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await usersApi.getHistory()
        if (!cancelled) setVideos(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiClientError ? err.message : 'Failed to load history')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="page-center">
        <LoadingSpinner label="Loading watch history..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-center">
        <div className="empty-state">
          <h2>Something went wrong</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="history-page">
      <div className="page-header">
        <h1>Watch history</h1>
        <p>Videos you&apos;ve watched recently</p>
      </div>

      {videos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🕐</div>
          <h3>No watch history</h3>
          <p>Videos you watch will appear here.</p>
          <Link to="/" className="btn btn-secondary">Browse videos</Link>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  )
}
