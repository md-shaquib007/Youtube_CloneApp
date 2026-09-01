import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import EmailVerificationBanner from './EmailVerificationBanner'

export default function Layout() {
  return (
    <div className="app-shell">
      <Navbar />
      <EmailVerificationBanner />
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>ChaiTube — Share your story with the world.</p>
      </footer>
    </div>
  )
}
