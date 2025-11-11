import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/navbar.jsx'
import Footer from '../components/Footer.jsx'
import './MyPage.css'

const NAV_ITEMS = [
  { id: 'orders', label: '주문내역' },
  { id: 'wishlist', label: '위시리스트', disabled: true },
  { id: 'profile', label: '회원정보' },
]

const ORDER_STATUS_LABELS = {
  all: '전체',
  pending: '결제대기',
  paid: '결제완료',
  preparing: '상품준비중',
  shipped: '배송중',
  delivered: '배송완료',
  cancelled: '취소됨',
  refunded: '환불됨'
}

function formatCurrency(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return '0원'
  return `${numeric.toLocaleString()}원`
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function getToken() {
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
}

function clearToken() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
  sessionStorage.removeItem('auth_token')
  sessionStorage.removeItem('auth_user')
}

function MyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authChecked, setAuthChecked] = useState(false)
  const [activeTab, setActiveTab] = useState(location.state?.tab === 'profile' ? 'profile' : 'orders')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab === 'profile' ? 'profile' : 'orders')
    }
  }, [location.state])

  useEffect(() => {
    async function load() {
      const token = getToken()
      if (!token) {
        setAuthChecked(true)
        return
      }

      setLoading(true)
      setError('')

      try {
        const headers = { Authorization: `Bearer ${token}` }
        const meResponse = await fetch('/api/auth/me', { headers })
        const meJson = await meResponse.json().catch(() => ({}))
        if (!meResponse.ok || !meJson?.success) {
          clearToken()
          throw new Error(meJson?.message || '사용자 정보를 불러오지 못했습니다. 다시 로그인해주세요.')
        }

        const userData = meJson.data
        setUser(userData)

        if (userData?.user_type === 'admin') {
          navigate('/admin', { replace: true })
          return
        }

        try {
          const orderResponse = await fetch('/api/orders?page=1&limit=20', { headers })
          const orderJson = await orderResponse.json().catch(() => ({}))

          if (orderResponse.ok && orderJson?.success && Array.isArray(orderJson.data)) {
            setOrders(orderJson.data)
            return
          }

          setOrders(Array.isArray(orderJson?.data) ? orderJson.data : [])
          setError(orderJson?.message || '주문 정보를 불러오지 못했습니다.')
        } catch (orderFetchError) {
          setOrders([])
          setError(orderFetchError.message || '주문 정보를 불러오지 못했습니다.')
        }
      } catch (fetchError) {
        setUser(null)
        setOrders([])
        setError(fetchError.message || '정보를 불러오지 못했습니다.')
      } finally {
        setLoading(false)
        setAuthChecked(true)
      }
    }

    load()
  }, [])

  const loyaltySummary = useMemo(() => {
    const totalSpent = orders.reduce((sum, order) => {
      const total = Number(order.total_amount)
      if (Number.isFinite(total)) return sum + total
      const paid = Number(order.payment?.amount_paid)
      return Number.isFinite(paid) ? sum + paid : sum
    }, 0)
    const points = Math.max(Math.floor(totalSpent * 0.02), 0)
    const coupons = Array.isArray(user?.coupons) ? user.coupons.length : 0

    return {
      totalSpent,
      points,
      coupons
    }
  }, [orders, user])

  function handleLogout() {
    clearToken()
    setUser(null)
    setOrders([])
    navigate('/')
  }

  function handleNavClick(item) {
    if (item.disabled) return
    if (item.id === 'logout') {
      handleLogout()
      return
    }
    if (!item.action && item.id) {
      setActiveTab(item.id)
    }
  }

  const statusCounts = useMemo(() => {
    const counts = Object.keys(ORDER_STATUS_LABELS).reduce((acc, key) => {
      acc[key] = 0
      return acc
    }, {})

    counts.all = orders.length
    orders.forEach((order) => {
      const statusKey = order.status && ORDER_STATUS_LABELS[order.status] ? order.status : 'pending'
      if (counts[statusKey] === undefined) counts[statusKey] = 0
      counts[statusKey] += 1
    })

    return counts
  }, [orders])

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders
    return orders.filter((order) => order.status === statusFilter)
  }, [orders, statusFilter])

  if (!authChecked) {
    return (
      <div className="mypage-loading">
        <div className="mypage-spinner" />
        <p>마이페이지를 불러오는 중입니다...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mypage-unauthenticated">
        <h2>로그인이 필요합니다.</h2>
        <p>주문 내역 확인을 위해 로그인 해주세요.</p>
        <div className="mypage-unauthenticated-actions">
          <button type="button" onClick={() => navigate('/login')}>
            로그인하기
          </button>
          <button type="button" onClick={() => navigate('/signup')} className="secondary">
            회원가입
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mypage-page">
      <Navbar />
      <main className="mypage-body">
        <div className="mypage-container">
          <aside className="mypage-sidebar">
            <h2 className="mypage-sidebar-title">MY PAGE</h2>
            <nav>
              <ul className="mypage-nav">
                {NAV_ITEMS.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleNavClick(item)}
                      className={[
                        'mypage-nav-item',
                        item.id === activeTab ? 'active' : '',
                        item.disabled ? 'disabled' : ''
                      ].filter(Boolean).join(' ')}
                      disabled={item.disabled}
                    >
                      {item.label}
                      {item.disabled && <span className="mypage-nav-badge">준비중</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <section className="mypage-content">
            {activeTab === 'orders' && (
              <section className="mypage-orders-section">
                <div className="mypage-orders-header">
                  <h3>주문내역</h3>
                  {orders.length > 0 && (
                    <span className="mypage-orders-count">
                      총 {orders.length}건 · {formatCurrency(loyaltySummary.totalSpent)}
                    </span>
                  )}
                </div>

                {loading && (
                  <div className="mypage-state">
                    <div className="mypage-spinner small" />
                    <p>주문 정보를 불러오는 중입니다...</p>
                  </div>
                )}

                {!loading && error && (
                  <div className="mypage-state error">
                    <p>{error}</p>
                    <button type="button" onClick={() => window.location.reload()}>
                      새로고침
                    </button>
                  </div>
                )}

                {!loading && !error && orders.length === 0 && (
                  <div className="mypage-state empty">
                    <p>아직 주문 내역이 없습니다.</p>
                    <button type="button" onClick={() => navigate('/')}>
                      쇼핑하러 가기
                    </button>
                  </div>
                )}

                {!loading && !error && orders.length > 0 && (
                  <div className="mypage-status-chips">
                    {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                      <button
                        type="button"
                        key={key}
                        className={['mypage-status-chip', statusFilter === key ? 'active' : ''].filter(Boolean).join(' ')}
                        onClick={() => setStatusFilter(key)}
                      >
                        {label}
                        <span className="count">{statusCounts[key] ?? 0}</span>
                      </button>
                    ))}
                  </div>
                )}

                {!loading && !error && orders.length > 0 && (
                  <div className="mypage-orders-list">
                    {filteredOrders.map((order) => {
                      const statusText = ORDER_STATUS_LABELS[order.status] || order.status || '-'
                      const orderItems = Array.isArray(order.items) ? order.items : []

                      return (
                        <article key={order._id || order.order_id} className="mypage-order-card">
                          <header className="mypage-order-header">
                            <div className="mypage-order-meta">
                              <span>{formatDate(order.createdAt)}</span>
                              <span className="divider">|</span>
                              <span>{order.order_id || '-'}</span>
                            </div>
                            <span className={`mypage-order-status status-${order.status || 'default'}`}>
                              {statusText}
                            </span>
                          </header>

                          <div className="mypage-order-items">
                            {orderItems.map((item) => {
                              const product = item.product_snapshot || item.product || {}
                              const image = product.image
                              const name = product.name || '상품 이름 미정'
                              return (
                                <div key={item._id || item.product} className="mypage-order-item">
                                  <div className="thumb">
                                    {image ? (
                                      <img src={image} alt={name} />
                                    ) : (
                                      <div className="placeholder">이미지 없음</div>
                                    )}
                                  </div>
                                  <div className="info">
                                    <div className="name">{name}</div>
                                    <div className="options">
                                      <span>{formatCurrency(item.unit_price)} · 수량 {item.quantity}</span>
                                    </div>
                                  </div>
                                  <div className="total">{formatCurrency(item.total_price)}</div>
                                </div>
                              )
                            })}
                          </div>

                          <footer className="mypage-order-footer">
                            <div className="summary">
                              <dl>
                                <div>
                                  <dt>상품금액</dt>
                                  <dd>{formatCurrency(order.sub_total)}</dd>
                                </div>
                                <div>
                                  <dt>배송비</dt>
                                  <dd>{formatCurrency(order.shipping_fee)}</dd>
                                </div>
                                <div className="highlight">
                                  <dt>총 결제금액</dt>
                                  <dd>{formatCurrency(order.total_amount || order.payment?.amount_paid)}</dd>
                                </div>
                              </dl>
                            </div>
                            <div className="actions">
                              <button type="button" onClick={() => window.alert('주문 상세 페이지는 준비중입니다.')}>
                                주문상세
                              </button>
                              <button
                                type="button"
                                className="secondary"
                                onClick={() => {
                                  if (order.tracking_number) {
                                    const trackingUrl = `https://tracker.delivery/#/${order.tracking_number}`
                                    const popup = window.open(trackingUrl, '_blank')
                                    if (popup) {
                                      popup.opener = null
                                    }
                                  } else {
                                    window.alert('배송 조회 정보가 준비중입니다.')
                                  }
                                }}
                              >
                                배송조회
                              </button>
                            </div>
                          </footer>
                        </article>
                      )
                    })}
                  </div>
                )}
              </section>
            )}

            {activeTab === 'profile' && (
              <section className="mypage-profile-details">
                <header>
                  <h3>회원정보</h3>
                  <p>내 계정 및 배송 정보를 확인할 수 있습니다.</p>
                </header>
                <div className="mypage-profile-grid">
                  <dl>
                    <dt>이름</dt>
                    <dd>{user.name || '-'}</dd>
                  </dl>
                  <dl>
                    <dt>이메일</dt>
                    <dd>{user.email || '-'}</dd>
                  </dl>
                  <dl>
                    <dt>회원유형</dt>
                    <dd>{user.user_type === 'admin' ? '관리자' : '일반회원'}</dd>
                  </dl>
                  <dl>
                    <dt>가입일</dt>
                    <dd>{formatDate(user.createdAt)}</dd>
                  </dl>
                </div>
                <div className="mypage-profile-address">
                  <h4>기본 배송지</h4>
                  <p>{user.address || '등록된 주소가 없습니다.'}</p>
      </div>
                <div className="mypage-profile-actions">
                  <button type="button" onClick={() => window.alert('회원 정보 수정 기능은 준비중입니다.')}>
                    정보 수정
                  </button>
                  <button type="button" className="secondary" onClick={handleLogout}>
          로그아웃
        </button>
      </div>
              </section>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default MyPage


