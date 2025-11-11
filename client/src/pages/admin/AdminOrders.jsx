import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

const NAV_BUTTON_STYLE = {
  border: '1px solid #d7dbe5',
  background: '#fff',
  color: '#111',
  fontSize: 13,
  padding: '10px 18px',
  borderRadius: 6,
  cursor: 'pointer'
}

const ORDER_STATUS_LABELS = {
  all: '전체',
  pending: '결제대기',
  paid: '결제완료',
  preparing: '상품준비중',
  shipped: '배송중',
  delivered: '배송완료',
  cancelled: '취소',
  refunded: '환불'
}

const DEFAULT_STATUS_ORDER = ['all', 'pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded']

function AdminOrders() {
  const navigate = useNavigate()
  const location = useLocation()
  const [tokenChecked, setTokenChecked] = useState(false)
  const [authToken, setAuthToken] = useState('')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [statusUpdatingId, setStatusUpdatingId] = useState('')
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    async function initialize() {
      const storedToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
      if (!storedToken) {
        navigate('/login')
        return
      }

      setLoading(true)
      setError('')
      setFeedback('')

      try {
        const headers = { Authorization: `Bearer ${storedToken}` }
        const meResponse = await fetch('/api/auth/me', { headers })
        const meJson = await meResponse.json().catch(() => ({}))

        if (!meResponse.ok || !meJson?.success || meJson.data?.user_type !== 'admin') {
          navigate('/')
          return
        }

        setAuthToken(storedToken)

        const orderResponse = await fetch('/api/orders?limit=100', { headers })
        const orderJson = await orderResponse.json().catch(() => ({}))

        if (!orderResponse.ok || !orderJson?.success) {
          throw new Error(orderJson?.message || '주문 목록을 불러오지 못했습니다.')
        }

        setOrders(Array.isArray(orderJson.data) ? orderJson.data : [])
      } catch (fetchError) {
        setError(fetchError.message || '주문 목록을 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
        setTokenChecked(true)
      }
    }

    initialize()
  }, [navigate])

  const statusCounts = useMemo(() => {
    const counts = DEFAULT_STATUS_ORDER.reduce((acc, key) => {
      acc[key] = 0
      return acc
    }, {})

    orders.forEach((order) => {
      const status = order.status || 'pending'
      if (counts[status] === undefined) {
        counts[status] = 0
      }
      if (ORDER_STATUS_LABELS[status]) {
        counts[status] += 1
      }
    })
    counts.all = orders.length
    return counts
  }, [orders])

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders
    return orders.filter((order) => order.status === statusFilter)
  }, [orders, statusFilter])

  function handleLogout() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    sessionStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_user')
    navigate('/')
  }

  function formatCurrency(value) {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return '-'
    return `₩${numeric.toLocaleString()}`
  }

  function formatDate(value) {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function formatStatus(status) {
    return ORDER_STATUS_LABELS[status] || status || '-'
  }

  function renderOrderItemsSummary(order) {
    const items = Array.isArray(order.items) ? order.items : []
    if (!items.length) return '-'
    const first = items[0]
    const product = first.product_snapshot || first.product || {}
    const name = product.name || '상품'
    if (items.length === 1) return name
    return `${name} 외 ${items.length - 1}건`
  }

  async function handleStatusUpdate(order, nextStatus) {
    if (!order?._id || !authToken) return
    if (!nextStatus || nextStatus === order.status) return

    setStatusUpdatingId(order._id)
    setFeedback('')
    try {
      const response = await fetch(`/api/orders/${order._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ status: nextStatus })
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || '주문 상태를 업데이트하지 못했습니다.')
      }

      const updatedOrder = result.data
      setOrders((prev) => prev.map((item) => (item._id === updatedOrder._id ? updatedOrder : item)))
      setFeedback('주문 상태가 업데이트되었습니다.')
    } catch (updateError) {
      setError(updateError.message || '주문 상태를 업데이트하지 못했습니다.')
    } finally {
      setStatusUpdatingId('')
    }
  }

  if (!tokenChecked && !loading) {
    return null
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f6f7fb' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #eceef3' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, color: '#1a1a1a', marginBottom: 6 }}>Vibe-shop Admin</div>
              <div style={{ color: '#7a7d85', fontSize: 13 }}>주문 관리</div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button style={NAV_BUTTON_STYLE}>CSV 다운로드</button>
              <button style={{ ...NAV_BUTTON_STYLE, background: '#111', color: '#fff' }}>주문 등록</button>
              <button
                style={{ ...NAV_BUTTON_STYLE, borderColor: '#ff5f6d', color: '#ff5f6d' }}
                onClick={handleLogout}
              >
                로그아웃
              </button>
            </div>
          </div>
          <nav style={{ display: 'flex', gap: 36, fontSize: 15 }}>
            <NavItem label="대시보드" to="/admin" active={location.pathname === '/admin'} />
            <NavItem label="상품 관리" to="/admin/products" active={location.pathname.startsWith('/admin/products')} />
            <NavItem label="주문 관리" to="/admin/orders" active={location.pathname.startsWith('/admin/orders')} />
          </nav>
        </div>
      </header>
      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '36px 32px 80px' }}>
        <section style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#1a1a1a', marginBottom: 18 }}>주문 관리</h1>
          <div style={{ fontSize: 13, color: '#7a7d85' }}>
            총 {orders.length}건의 주문
          </div>
          {feedback && (
            <div style={{ marginTop: 12, fontSize: 13, color: '#1e40af' }}>
              {feedback}
            </div>
          )}
        </section>

        <section style={{ background: '#fff', border: '1px solid #e5e8ef', borderRadius: 10, boxShadow: '0 12px 30px rgba(17, 24, 39, 0.05)' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f3f8' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              {DEFAULT_STATUS_ORDER.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 999,
                    border: '1px solid',
                    borderColor: statusFilter === key ? '#111' : '#e0e3eb',
                    background: statusFilter === key ? '#111' : '#fff',
                    color: statusFilter === key ? '#fff' : '#555',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {ORDER_STATUS_LABELS[key]}
                  <span style={{ marginLeft: 6, fontWeight: 500, color: statusFilter === key ? '#ddd' : '#888' }}>
                    {statusCounts[key] ?? 0}
                  </span>
                </button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: '#9aa0af' }}>
              {statusFilter === 'all'
                ? `전체 주문 ${statusCounts.all}건`
                : `${ORDER_STATUS_LABELS[statusFilter]} ${statusCounts[statusFilter] ?? 0}건`}
            </div>
          </header>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafbff', color: '#7a7d85', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  <th style={tableHeaderStyle}>주문번호</th>
                  <th style={tableHeaderStyle}>고객명</th>
                  <th style={tableHeaderStyle}>상품</th>
                  <th style={tableHeaderStyle}>금액</th>
                  <th style={tableHeaderStyle}>상태</th>
                  <th style={tableHeaderStyle}>주문일시</th>
                  <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>상세</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={tableEmptyCellStyle}>주문 정보를 불러오는 중입니다...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} style={tableEmptyCellStyle}>
                      {error}
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        style={{ marginLeft: 12, ...NAV_BUTTON_STYLE, padding: '6px 14px', fontSize: 12 }}
                      >
                        새로고침
                      </button>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={tableEmptyCellStyle}>해당 조건의 주문이 없습니다.</td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order._id || order.order_id} style={{ borderBottom: '1px solid #f1f3f8' }}>
                      <td style={tableCellStyle}>
                        <span style={{ fontWeight: 600, color: '#1a1a1a' }}>{order.order_id || '-'}</span>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ fontWeight: 500, color: '#1e1e1e' }}>{order.user?.name || '-'}</div>
                        <div style={{ fontSize: 12, color: '#9aa0af' }}>{order.user?.email || ''}</div>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ color: '#2d2d2d' }}>{renderOrderItemsSummary(order)}</div>
                      </td>
                      <td style={tableCellStyle}>{formatCurrency(order.total_amount || order.payment?.amount_paid)}</td>
                      <td style={tableCellStyle}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 12px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                          background: statusBadgeBackground(order.status),
                          color: statusBadgeColor(order.status)
                        }}
                        >
                          {formatStatus(order.status)}
                        </span>
                        <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                          <select
                            value={order.status || ''}
                            onChange={(event) => handleStatusUpdate(order, event.target.value)}
                            disabled={statusUpdatingId === order._id}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 6,
                              border: '1px solid #d7dbe5',
                              fontSize: 13,
                              color: '#333',
                              minWidth: 140,
                              background: '#fff',
                              cursor: statusUpdatingId === order._id ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {DEFAULT_STATUS_ORDER.filter((key) => key !== 'all').map((key) => (
                              <option key={key} value={key}>
                                {ORDER_STATUS_LABELS[key]}
                              </option>
                            ))}
                          </select>
                          {statusUpdatingId === order._id && (
                            <span style={{ fontSize: 12, color: '#7a7d85' }}>업데이트 중...</span>
                          )}
                        </div>
                      </td>
                      <td style={tableCellStyle}>{formatDate(order.createdAt)}</td>
                      <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => window.alert('주문 상세 페이지는 준비중입니다.')}
                          style={{ ...NAV_BUTTON_STYLE, padding: '6px 14px', fontSize: 12 }}
                        >
                          보기
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

function NavItem({ label, to, active = false }) {
  return (
    <Link
      to={to}
      style={{
        position: 'relative',
        fontWeight: active ? 600 : 500,
        color: active ? '#111' : '#7a7d85',
        textDecoration: 'none',
        paddingBottom: 12
      }}
    >
      {label}
      {active && (
        <span
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: '100%',
            height: 2,
            background: '#111'
          }}
        />
      )}
    </Link>
  )
}

function statusBadgeBackground(status) {
  switch (status) {
    case 'paid':
      return '#111'
    case 'shipped':
    case 'delivered':
      return '#f1f5ff'
    case 'cancelled':
    case 'refunded':
      return '#ffecec'
    default:
      return '#f5f5f5'
  }
}

function statusBadgeColor(status) {
  switch (status) {
    case 'paid':
      return '#fff'
    case 'shipped':
    case 'delivered':
      return '#1e40af'
    case 'cancelled':
    case 'refunded':
      return '#c0392b'
    default:
      return '#444'
  }
}

const tableHeaderStyle = {
  padding: '14px 20px',
  textAlign: 'left',
  borderBottom: '1px solid #f1f3f8'
}

const tableCellStyle = {
  padding: '18px 20px',
  fontSize: 14,
  color: '#333'
}

const tableEmptyCellStyle = {
  padding: '28px 20px',
  textAlign: 'center',
  fontSize: 14,
  color: '#7a7d85'
}

export default AdminOrders

