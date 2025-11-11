import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/navbar.jsx'
import Footer from '../components/Footer.jsx'
import './OrderFailure.css'

function OrderFailure() {
  const location = useLocation()
  const navigate = useNavigate()
  const errorMessage = location.state?.message
  const failureReason = location.state?.reason
  const paymentId = location.state?.paymentId
  const supportContact = location.state?.supportContact || 'customer@vibeshop.com'

  useEffect(() => {
    if (!location.state) {
      navigate('/', { replace: true })
    }
  }, [location.state, navigate])

  return (
    <div className="order-failure-page">
      <Navbar />
      <main className="order-failure-body">
        <div className="order-failure-container">
          <header className="order-failure-header">
            <h1>주문 처리에 실패했습니다</h1>
            <p>결제가 완료되지 않았거나 주문 생성 중 오류가 발생했습니다.</p>
          </header>

          <section className="order-failure-card">
            <div className="order-failure-icon" aria-hidden="true">
              <span>!</span>
            </div>

            <div className="order-failure-message">
              <strong>{errorMessage || '죄송합니다. 주문을 완료할 수 없습니다.'}</strong>
              <p>
                {failureReason
                  ? failureReason
                  : '잠시 후 다시 시도하시거나 고객센터로 문의해 주세요.'}
              </p>
            </div>

            <dl className="order-failure-details">
              {paymentId && (
                <div>
                  <dt>결제번호</dt>
                  <dd>{paymentId}</dd>
                </div>
              )}
              <div>
                <dt>주문 상태</dt>
                <dd>미완료 (장바구니는 그대로 유지됩니다)</dd>
              </div>
              <div>
                <dt>문의처</dt>
                <dd>{supportContact}</dd>
              </div>
            </dl>
          </section>

          <section className="order-failure-help">
            <h2>다음 단계를 진행해 보세요</h2>
            <ul>
              <li>장바구니에서 상품을 다시 확인하고 결제를 재시도하세요.</li>
              <li>카드 한도·잔액 또는 간편결제 상태를 확인해주세요.</li>
              <li>문제가 계속되면 고객센터로 결제 번호와 함께 문의해주세요.</li>
            </ul>
          </section>

          <div className="order-failure-actions">
            <button
              type="button"
              className="order-failure-button primary"
              onClick={() => navigate('/cart')}
            >
              장바구니로 이동
            </button>
            <button
              type="button"
              className="order-failure-button secondary"
              onClick={() => navigate('/order')}
            >
              결제 다시 시도
            </button>
            <button
              type="button"
              className="order-failure-button tertiary"
              onClick={() => navigate('/')}
            >
              홈으로 가기
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default OrderFailure


