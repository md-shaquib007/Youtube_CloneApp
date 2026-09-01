import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { searchApi } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import VideoCard from '../components/VideoCard'

export default function Search() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  const [results, setResults] = useState({ users: [], videos: [] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setResults({ users: [], videos: [] })
      return
    }

    let cancelled = false
    setLoading(true)

    searchApi.search(query.trim())
      .then((data) => {
        if (!cancelled) setResults(data)
      })
      .catch(() => {
        if (!cancelled) setResults({ users: [], videos: [] })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [query])

  if (!query.trim()) {
    return (
      <div className="page-center">
        <div className="empty-state">
          <h2>Search ChaiTube</h2>
          <p>Find channels and videos using the search bar above.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="search-page">
      <div className="page-header">
        <h1>Search results</h1>
        <p className="text-muted">Results for &ldquo;{query}&rdquo;</p>
      </div>

      {loading ? (
        <div className="page-center">
          <LoadingSpinner label="Searching..." />
        </div>
      ) : (
        <>
          {results.users?.length > 0 && (
            <section className="search-section">
              <h2>Channels</h2>
              <div className="channel-results">
                {results.users.map((ch) => (
                  <Link
                    key={ch._id}
                    to={`/channel/${ch.username}`}
                    className="channel-result-card"
                  >
                    <img src={ch.avatar} alt="" className="channel-result-avatar" />
                    <div>
                      <strong>{ch.fullName}</strong>
                      <span className="text-muted">@{ch.username}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.videos?.length > 0 && (
            <section className="search-section">
              <h2>Videos</h2>
              <div className="video-grid">
                {results.videos.map((video) => (
                  <VideoCard key={video._id} video={video} />
                ))}
              </div>
            </section>
          )}

          {!results.users?.length && !results.videos?.length && (
            <div className="empty-state">
              <h3>No results found</h3>
              <p>Try a different search term.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
