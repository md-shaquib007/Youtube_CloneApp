import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usersApi, videosApi } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import VideoCard from '../components/VideoCard'

export default function Home() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [videos, setVideos] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setError('')
        const [feed, channel] = await Promise.all([
          videosApi.getAll(1, 12),
          user ? usersApi.getChannel(user.username).catch(() => null) : null,
        ])
        if (!cancelled) {
          setVideos(feed.docs || feed)
          setStats(channel)
        }
      } catch {
        if (!cancelled) setError('We could not load videos right now. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [user])

  return (
    <div className="home-page">
      {user && (
        <section className="dashboard-banner">
          <div className="dashboard-greeting">
            <img src={user.avatar} alt="" className="dashboard-avatar" />
            <div>
              <h2>Welcome back, {user.fullName}</h2>
              <p className="text-muted">@{user.username}</p>
            </div>
          </div>
          {stats && (
            <div className="dashboard-stats">
              <div className="stat-card">
                <span className="stat-value">{stats.subscribersCount}</span>
                <span className="stat-label">Subscribers</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats.channelSubscribedToCount}</span>
                <span className="stat-label">Subscribed</span>
              </div>
            </div>
          )}
          <div className="dashboard-actions">
            <Link to="/upload" className="btn btn-primary btn-sm">Upload video</Link>
            <Link to={`/channel/${user.username}`} className="btn btn-secondary btn-sm">
              My channel
            </Link>
            <Link to="/profile" className="btn btn-secondary btn-sm">Settings</Link>
          </div>
        </section>
      )}

      <section className="feed-section">
        <div className="section-header">
          <h2>{user ? 'Recommended for you' : 'Trending videos'}</h2>
        </div>

        {loading ? (
          <div className="page-center">
            <LoadingSpinner label="Loading videos..." />
          </div>
        ) : error ? (
          <div className="empty-state">
            <h3>Unable to load videos</h3>
            <p>{error}</p>
            <button type="button" className="btn btn-secondary" onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        ) : videos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎬</div>
            <h3>No videos yet</h3>
            <p>Be the first to upload a video!</p>
            {user ? (
              <Link to="/upload" className="btn btn-primary">Upload video</Link>
            ) : (
              <Link to="/register" className="btn btn-primary">Get started</Link>
            )}
          </div>
        ) : (
          <div className="video-grid">
            {videos.map((video) => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
