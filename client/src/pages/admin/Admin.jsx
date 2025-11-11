import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'

function Admin() {
  const location = useLocation()
  const summaryCards = useMemo(() => ([
    { title: '총 주문', value: '1,247', sub: '오늘 +23' },
    { title: '총 매출', value: '₩4528만', sub: '오늘 ₩185만' },
    { title: '등록 상품', value: '156', sub: '활성 상품' },
    { title: '총 회원', value: '3,421', sub: '활성 회원' },
    { title: '평균 주문액', value: '₩36천', sub: '전월 대비 +5%' },
    { title: '전환율', value: '3.2%', sub: '전월 대비 +0.3%' }
  ]), [])

  const monthlySales = useMemo(() => ([
    { month: '1월', amount: '₩320만', progress: 0.62 },
    { month: '2월', amount: '₩380만', progress: 0.74 },
    { month: '3월', amount: '₩420만', progress: 0.82 },
    { month: '4월', amount: '₩390만', progress: 0.76 },
    { month: '5월', amount: '₩450만', progress: 0.89 },
    { month: '6월', amount: '₩510만', progress: 1 }
  ]), [])

  return (
    <div style={{ minHeight: '100vh', background: '#f6f7fb' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #eceef3' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, color: '#1a1a1a', marginBottom: 6 }}>Vibe-shop Admin</div>
              <div style={{ color: '#7a7d85', fontSize: 13 }}>주문 통계 대시보드</div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                style={{ ...buttonStyle, borderColor: '#ff5f6d', color: '#ff5f6d' }}
                onClick={() => {
                  localStorage.removeItem('auth_token')
                  localStorage.removeItem('auth_user')
                  sessionStorage.removeItem('auth_token')
                  sessionStorage.removeItem('auth_user')
                  window.location.href = '/'
                }}
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
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 20, marginBottom: 36 }}>
          {summaryCards.map((card) => (
            <article key={card.title} style={cardStyle}>
              <div style={{ fontSize: 13, color: '#7a7d85', marginBottom: 10 }}>{card.title}</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>{card.value}</div>
              <div style={{ fontSize: 13, color: '#9aa0af' }}>{card.sub}</div>
            </article>
          ))}
        </section>

        <section style={{ background: '#fff', border: '1px solid #e5e8ef', borderRadius: 10, padding: '28px 32px', boxShadow: '0 8px 20px rgba(17, 24, 39, 0.04)' }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 24, color: '#1a1a1a' }}>월별 매출 추이</div>
          <div style={{ display: 'grid', gap: 18 }}>
            {monthlySales.map((row) => (
              <div key={row.month} style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ width: 40, fontSize: 13, color: '#7a7d85' }}>{row.month}</div>
                <div style={{ flex: 1, height: 16, background: '#edf0f5', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.round(row.progress * 100)}%`, height: '100%', background: '#111', borderRadius: 'inherit' }} />
                </div>
                <div style={{ width: 64, textAlign: 'right', fontSize: 13, color: '#1a1a1a' }}>{row.amount}</div>
              </div>
            ))}
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
        <span style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: '100%',
          height: 2,
          background: '#111'
        }} />
      )}
    </Link>
  )
}

const buttonStyle = {
  border: '1px solid #d7dbe5',
  background: '#fff',
  color: '#111',
  fontSize: 13,
  padding: '10px 18px',
  borderRadius: 6,
  cursor: 'pointer'
}

const cardStyle = {
  background: '#fff',
  border: '1px solid #e5e8ef',
  borderRadius: 10,
  padding: '22px 24px',
  boxShadow: '0 8px 20px rgba(17, 24, 39, 0.04)'
}

export default Admin


