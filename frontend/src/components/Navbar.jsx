import { useState } from 'react'
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'

export default function Navbar() {
  const { user, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')

  const handleLogout = async () => {
    await logout()
    setMenuOpen(false)
    toast.info('Signed out successfully')
    navigate('/')
  }

  const closeMenu = () => setMenuOpen(false)

  const handleSearch = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`)
      closeMenu()
    }
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span className="brand-icon" aria-hidden="true">▶</span>
          <span>ChaiTube</span>
        </Link>

        <form className="navbar-search" onSubmit={handleSearch}>
          <input
            type="search"
            placeholder="Search channels & videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search"
          />
          <button type="submit" className="search-btn" aria-label="Search">
            🔍
          </button>
        </form>

        <button
          type="button"
          className="navbar-toggle"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`navbar-nav ${menuOpen ? 'open' : ''}`}>
          {user ? (
            <>
              <NavLink to="/upload" className="nav-link" onClick={closeMenu}>
                Upload
              </NavLink>
              <NavLink to="/history" className="nav-link" onClick={closeMenu}>
                History
              </NavLink>
              <NavLink to="/profile" className="nav-link" onClick={closeMenu}>
                Profile
              </NavLink>
              <NavLink
                to={`/channel/${user.username}`}
                className="nav-link nav-channel"
                onClick={closeMenu}
              >
                <img src={user.avatar} alt="" className="nav-avatar" />
                <span>My Channel</span>
              </NavLink>
              <button type="button" className="btn btn-ghost" onClick={handleLogout}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-link" onClick={closeMenu}>
                Sign in
              </NavLink>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={closeMenu}>
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
