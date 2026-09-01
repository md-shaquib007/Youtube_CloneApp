export default function LoadingSpinner({ size = 'md', label = 'Loading...' }) {
  return (
    <div className={`spinner-wrapper spinner-${size}`} role="status" aria-label={label}>
      <div className="spinner" />
      {label ? <span className="spinner-label">{label}</span> : null}
    </div>
  )
}
