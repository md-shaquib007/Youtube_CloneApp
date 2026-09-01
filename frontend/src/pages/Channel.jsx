import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiClientError, usersApi, videosApi, subscriptionsApi } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import LoadingSpinner from '../components/LoadingSpinner'
import VideoCard from '../components/VideoCard'

export default function Channel() {
  const { username: rawUsername } = useParams()
  const username = rawUsername?.trim().toLowerCase() || ''
  const { user: currentUser } = useAuth()
  const toast = useToast()

  const [channel, setChannel] = useState(null)
  const [videos, setVideos] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [subLoading, setSubLoading] = useState(false)

  const isOwnChannel = currentUser?.username === username

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [channelData, videoList] = await Promise.all([
          usersApi.getChannel(username),
          videosApi.getChannelVideos(username),
        ])
        if (!cancelled) {
          setChannel(channelData)
          setVideos(videoList)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiClientError ? err.message : 'Failed to load channel')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [username])

  const handleSubscribe = async () => {
    if (!currentUser) {
      toast.info('Please sign in to subscribe')
      return
    }

    setSubLoading(true)
    try {
      const result = await subscriptionsApi.toggle(channel._id)
      setChannel((prev) => ({
        ...prev,
        isSubscribed: result.subscribed,
        subscribersCount: result.subscribed
          ? prev.subscribersCount + 1
          : prev.subscribersCount - 1,
      }))
      toast.success(result.subscribed ? 'Subscribed!' : 'Unsubscribed')
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Action failed')
    } finally {
      setSubLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page-center">
        <LoadingSpinner label="Loading channel..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-center">
        <div className="empty-state">
          <h2>Channel not found</h2>
          <p>{error}</p>
          <Link to="/" className="btn btn-primary">Go home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="channel-page">
      <div
        className="channel-banner"
        style={{ backgroundImage: channel.coverImage ? `url(${channel.coverImage})` : undefined }}
      />

      <div className="channel-header">
        <img src={channel.avatar} alt={channel.fullName} className="channel-avatar" />
        <div className="channel-info">
          <h1>{channel.fullName}</h1>
          <p className="text-muted">@{channel.username}</p>
          <div className="channel-stats">
            <span><strong>{channel.subscribersCount}</strong> subscribers</span>
            <span className="stat-divider">•</span>
            <span><strong>{videos.length}</strong> videos</span>
          </div>
        </div>
        <div className="channel-actions">
          {isOwnChannel ? (
            <>
              <Link to="/upload" className="btn btn-primary">Upload video</Link>
              <Link to="/profile" className="btn btn-secondary">Customize</Link>
            </>
          ) : currentUser ? (
            <button
              type="button"
              className={`btn ${channel.isSubscribed ? 'btn-secondary' : 'btn-primary'}`}
              onClick={handleSubscribe}
              disabled={subLoading}
            >
              {subLoading ? '...' : channel.isSubscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          ) : (
            <Link to="/login" className="btn btn-primary">Sign in to subscribe</Link>
          )}
        </div>
      </div>

      <div className="channel-content">
        <div className="channel-tabs">
          <button type="button" className="tab active">Videos</button>
        </div>

        {videos.length === 0 ? (
          <div className="empty-state channel-empty">
            <div className="empty-icon">🎬</div>
            <h3>No videos yet</h3>
            <p>
              {isOwnChannel
                ? 'Upload your first video to get started.'
                : "This channel hasn't uploaded any videos yet."}
            </p>
            {isOwnChannel && (
              <Link to="/upload" className="btn btn-primary">Upload video</Link>
            )}
          </div>
        ) : (
          <div className="video-grid">
            {videos.map((video) => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
