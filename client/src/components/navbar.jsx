import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '../utils/apiClient'

function Navbar() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [cartCount, setCartCount] = useState(0)
  const currentUserRef = useRef(null)

  useEffect(() => {
    currentUserRef.current = currentUser
  }, [currentUser])

  useEffect(() => {
    let mounted = true

    function handleCartUpdated(event) {
      const { count, userId } = event.detail || {}
      if (!mounted) return
      if (!count && count !== 0) return

      const snapshotUser = currentUserRef.current
      if (userId && snapshotUser && snapshotUser._id !== userId) {
        return
      }
      setCartCount(count)
    }

    window.addEventListener('cart-updated', handleCartUpdated)

    async function fetchCart(userId, token) {
      try {
        const res = await apiFetch(`cart/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.status === 404) {
          if (mounted) setCartCount(0)
          return
        }
        const data = await res.json()
        if (mounted && res.ok && data?.success) {
          const items = Array.isArray(data.data?.items) ? data.data.items : []
          setCartCount(items.length)
        }
      } catch {
        if (mounted) setCartCount(0)
      }
    }

    async function check() {
      try {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
        if (!token) {
          if (mounted) {
            setIsLoggedIn(false)
            setCurrentUser(null)
            setCartCount(0)
          }
          return
        }
        const res = await apiFetch('auth/me', { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        if (!mounted) return

        if (res.ok && data?.success && data?.data?._id) {
          setIsLoggedIn(true)
          setCurrentUser(data.data)
          await fetchCart(data.data._id, token)
        } else {
          setIsLoggedIn(false)
          setCurrentUser(null)
          setCartCount(0)
        }
      } catch {
        if (mounted) {
          setIsLoggedIn(false)
          setCurrentUser(null)
          setCartCount(0)
        }
      }
    }

    check()

    return () => {
      mounted = false
      window.removeEventListener('cart-updated', handleCartUpdated)
    }
  }, [])

  function handleUserClick() {
    if (isLoggedIn) navigate('/mypage')
    else navigate('/login')
  }

  function handleCartClick() {
    if (!isLoggedIn || !currentUser) {
      navigate('/login')
      return
    }
    navigate('/cart')
  }

  return (
    <header style={{ background: 'transparent' }}>
      {/* match Home content card width: maxWidth 1200 + horizontal padding 20 */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
        <div style={{
          background: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: 8,
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap'
        }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', color: '#111', fontSize: 20, fontWeight: 600 }}>
            Vibe-shop
          </Link>

          {/* Navigation (center, wraps on narrow widths) */}
          <nav style={{ display: 'flex', gap: 24, flex: 1, justifyContent: 'center', minWidth: 280 }}>
            {['NEW', 'WOMEN', 'MEN', 'LIFESTYLE', 'SALE'].map((item) => (
              <Link
                key={item}
                to="/"
                style={{
                  textDecoration: 'none',
                  color: '#111',
                  fontSize: 14,
                  letterSpacing: 1,
                  textTransform: 'uppercase'
                }}
              >
                {item}
              </Link>
            ))}
          </nav>

          {/* Icons (right) */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {/* Search */}
            <button
              style={{
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>

            {/* User */}
            <button onClick={handleUserClick} style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: 4 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>

            {/* Cart */}
            <button
              onClick={handleCartClick}
              style={{
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {isLoggedIn && cartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    transform: 'translate(40%, -40%)',
                    background: '#111',
                    color: '#fff',
                    borderRadius: '999px',
                    padding: '0 6px',
                    fontSize: 11,
                    lineHeight: '16px',
                    minWidth: 16,
                    textAlign: 'center'
                  }}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar 