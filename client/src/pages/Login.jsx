import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [keepSignedIn, setKeepSignedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // If there's a valid token already, go to home
  useEffect(() => {
    async function checkToken() {
      try {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
        if (!token) return
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        if (res.ok && data?.success) {
          navigate('/')
        }
      } catch {
        // ignore errors
      }
    }
    checkToken()
  }, [navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || '로그인에 실패했습니다')
      }

      const storage = keepSignedIn ? window.localStorage : window.sessionStorage
      storage.setItem('auth_token', data.token)
      storage.setItem('auth_user', JSON.stringify(data.data))

      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 16px' }}>
      <div style={{ width: '100%', maxWidth: 540 }}>
        <h2 style={{ textAlign: 'center', letterSpacing: 2, marginBottom: 36 }}>LOGIN</h2>
        <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #eee', padding: 28 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, marginBottom: 8 }}>이메일</label>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', height: 44, padding: '0 12px', border: '1px solid #ddd' }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 14, marginBottom: 8 }}>비밀번호</label>
            <input
              type="password"
              placeholder="****************"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', height: 44, padding: '0 12px', border: '1px solid #ddd' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '8px 0 16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <input type="checkbox" checked={keepSignedIn} onChange={(e) => setKeepSignedIn(e.target.checked)} />
              로그인 상태 유지
            </label>
            <button type="button" style={{ background: 'transparent', border: 0, color: '#777', cursor: 'pointer' }}>비밀번호 찾기</button>
          </div>

          {error && (
            <div style={{ color: '#d00', fontSize: 14, marginBottom: 12 }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', height: 50, background: '#111', color: '#fff', border: 0, cursor: 'pointer', letterSpacing: 1 }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>

          <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 28, paddingTop: 20, textAlign: 'center' }}>
            <div style={{ color: '#666', marginBottom: 12 }}>아직 회원이 아니신가요?</div>
            <Link to="/signup" style={{ display: 'inline-block', width: 200 }}>
              <button type="button" style={{ width: '100%', height: 44, background: '#fff', border: '1px solid #ddd', cursor: 'pointer' }}>회원가입</button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login


