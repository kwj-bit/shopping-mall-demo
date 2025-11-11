import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/navbar.jsx'
import Footer from '../components/Footer.jsx'
import './OrderComplete.css'

function formatCurrency(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-'
  return `${value.toLocaleString()}원`
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

function OrderComplete() {
  const location = useLocation()
  const navigate = useNavigate()
  const order = location.state?.order

  useEffect(() => {
    if (!order) {
      navigate('/', { replace: true })
    }
  }, [order, navigate])

  const totals = useMemo(() => {
    if (!order) {
      return {
        subtotal: 0,
        shipping: 0,
        total: 0
      }
    }

    return {
      subtotal: Number(order.sub_total) || 0,
      shipping: Number(order.shipping_fee) || 0,
      total: Number(order.total_amount) || Number(order.payment?.amount_paid) || 0
    }
  }, [order])

  if (!order) {
    return null
  }

  const shipping = order.shipping_address || {}

  return (
    <div className="order-complete-page">
      <Navbar />
      <main className="order-complete-body">
        <div className="order-complete-container">
          <header className="order-complete-header">
            <h1>주문이 완료되었습니다</h1>
            <p>주문해주셔서 감사합니다</p>
          </header>

          <section className="order-complete-card">
            <div className="order-complete-meta">
              <div>
                <span className="order-complete-meta-label">주문번호</span>
                <span className="order-complete-meta-value">{order.order_id || '-'}</span>
              </div>
              <div>
                <span className="order-complete-meta-label">주문일시</span>
                <span className="order-complete-meta-value">{formatDate(order.createdAt)}</span>
              </div>
            </div>

            <div className="order-complete-section-title">주문상품</div>
            <div className="order-complete-items">
              {order.items?.map((item) => {
                const product = item.product_snapshot || item.product || {}
                return (
                  <div key={item._id || item.product} className="order-complete-item">
                    <div className="order-complete-item-thumbnail">
                      {product.image ? (
                        <img src={product.image} alt={product.name || '상품 이미지'} />
                      ) : (
                        <div className="order-complete-item-placeholder">이미지 없음</div>
                      )}
                    </div>
                    <div className="order-complete-item-info">
                      <div className="order-complete-item-name">{product.name || '상품 이름 미정'}</div>
                      <div className="order-complete-item-qty">
                        {formatCurrency(item.unit_price)} × {item.quantity}
                      </div>
                    </div>
                    <div className="order-complete-item-total">{formatCurrency(item.total_price)}</div>
                  </div>
                )
              })}
            </div>

            <div className="order-complete-summary">
              <div>
                <span>상품금액</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div>
                <span>배송비</span>
                <span>{formatCurrency(totals.shipping)}</span>
              </div>
              <div className="order-complete-summary-total">
                <span>총 결제금액</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </section>

          <section className="order-complete-card">
            <div className="order-complete-section-title">배송 정보</div>
            <dl className="order-complete-shipping">
              <div>
                <dt>받는분</dt>
                <dd>{shipping.recipient_name || '-'}</dd>
              </div>
              <div>
                <dt>연락처</dt>
                <dd>{shipping.recipient_phone || '-'}</dd>
              </div>
              <div>
                <dt>주소</dt>
                <dd>
                  {shipping.postal_code ? `(${shipping.postal_code}) ` : ''}
                  {[shipping.address_line1, shipping.address_line2].filter(Boolean).join(' ')}
                </dd>
              </div>
              <div>
                <dt>배송메시지</dt>
                <dd>{order.delivery_note || '없음'}</dd>
              </div>
            </dl>
          </section>

          <div className="order-complete-actions">
            <button
              type="button"
              onClick={() => navigate('/mypage', { state: { tab: 'orders' } })}
              className="order-complete-button primary"
            >
              주문내역 보기
            </button>
            <button type="button" onClick={() => navigate('/')} className="order-complete-button secondary">
              쇼핑 계속하기
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default OrderComplete

