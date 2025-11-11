import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

function Footer() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkRole() {
      try {
        const saved = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user')
        if (saved) {
          const u = JSON.parse(saved)
          if (u?.user_type === 'admin') {
            setIsAdmin(true)
            return
          }
        }
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
        if (!token) return
        const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        if (res.ok && data?.success && data?.data?.user_type === 'admin') setIsAdmin(true)
      } catch {
        setIsAdmin(false)
      }
    }
    checkRole()
  }, [])
  return (
    <footer style={{
      background: '#f8f8f8',
      padding: '60px 40px 30px',
      marginTop: 80,
      borderTop: '1px solid #eee'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 40,
        marginBottom: 40
      }}>
        {/* CUSTOMER SERVICE */}
        <div>
          <h3 style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, marginBottom: 16, color: '#333' }}>
            CUSTOMER SERVICE
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {['Contact Us', 'Shipping Info', 'Returns', 'FAQ'].map((item) => (
              <li key={item} style={{ marginBottom: 8 }}>
                <Link to="/" style={{ color: '#666', fontSize: 13, textDecoration: 'none' }}>
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ABOUT */}
        <div>
          <h3 style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, marginBottom: 16, color: '#333' }}>
            ABOUT
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {['Our Story', 'Careers', 'Press', 'Sustainability'].map((item) => (
              <li key={item} style={{ marginBottom: 8 }}>
                <Link to="/" style={{ color: '#666', fontSize: 13, textDecoration: 'none' }}>
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* SHOP */}
        <div>
          <h3 style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, marginBottom: 16, color: '#333' }}>
            SHOP
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {['Store Locator', 'Membership', 'Gift Cards', 'Events'].map((item) => (
              <li key={item} style={{ marginBottom: 8 }}>
                <Link to="/" style={{ color: '#666', fontSize: 13, textDecoration: 'none' }}>
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* CONNECT */}
        <div>
          <h3 style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, marginBottom: 16, color: '#333' }}>
            CONNECT
          </h3>
          <div style={{ display: 'flex', gap: 12 }}>
            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: 32,
                height: 32,
                border: '1px solid #ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fff',
                textDecoration: 'none',
                color: '#111'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>

            {/* Facebook */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: 32,
                height: 32,
                border: '1px solid #ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fff',
                textDecoration: 'none',
                color: '#111'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div style={{
        borderTop: '1px solid #eee',
        paddingTop: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 12,
        color: '#666'
      }}>
        <div>Vibe-shop. All rights reserved. © 2025</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link to="/" style={{ color: '#666', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link to="/" style={{ color: '#666', textDecoration: 'none' }}>Terms of Service</Link>
          {isAdmin && <Link to="/admin" style={{ color: '#666', textDecoration: 'none' }}>Admin</Link>}
        </div>
      </div>
    </footer>
  )
}

export default Footer

