import { Link } from 'react-router-dom'

import { formatDuration } from '../utils/format'

export default function VideoCard({ video }) {
  return (
    <article className="video-card">
      <Link to={`/watch/${video._id}`} className="video-thumb" aria-label={`Watch ${video.title}`}>
        <img src={video.thumbnail} alt={video.title} loading="lazy" />
        {video.duration > 0 && (
          <span className="video-duration">{formatDuration(video.duration)}</span>
        )}
      </Link>
      <div className="video-info">
        {video.owner && (
          <Link
            to={`/channel/${video.owner.username}`}
            className="video-channel-avatar"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={video.owner.avatar} alt={video.owner.fullName} />
          </Link>
        )}
        <div>
          <Link to={`/watch/${video._id}`} className="video-title-link">
            <h3 className="video-title">{video.title}</h3>
          </Link>
          {video.owner && (
            <p className="video-meta">
              <Link
                to={`/channel/${video.owner.username}`}
                onClick={(e) => e.stopPropagation()}
              >
                {video.owner.fullName}
              </Link>
            </p>
          )}
          <p className="video-meta text-muted">
            {(video.views || 0).toLocaleString()} views
          </p>
        </div>
      </div>
    </article>
  )
}
