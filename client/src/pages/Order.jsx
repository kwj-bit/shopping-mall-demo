import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/navbar.jsx'
import Footer from '../components/Footer.jsx'
import './Order.css'

// 포트원(PortOne)에서 발급받은 클라이언트 식별 코드
const PORTONE_CLIENT_CODE = 'imp34117525'

// 포트원 결제 스크립트를 동적으로 로드하고 초기화 상태를 반환
function loadIamportScript() {
  return new Promise((resolve, reject) => {
    if (window.IMP) {
      resolve(window.IMP)
      return
    }

    const existingScript = document.querySelector('script[src="https://cdn.iamport.kr/v1/iamport.js"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.IMP))
      existingScript.addEventListener('error', reject)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.iamport.kr/v1/iamport.js'
    script.async = true
    script.onload = () => resolve(window.IMP)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function Order() {
  const location = useLocation()
  const navigate = useNavigate()
  const orderState = location.state

  const [isReady, setIsReady] = useState(false)
  const [items, setItems] = useState([])
  const [summary, setSummary] = useState({ subtotal: 0, shipping: 0, total: 0 })
  const [token, setToken] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [contact, setContact] = useState({
    name: '',
    phone: '',
    postalCode: '',
    address1: '',
    address2: '',
    note: ''
  })
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    thirdParty: false
  })
  const impInitializedRef = useRef(false)

  function redirectToFailure({ message, reason, paymentId } = {}) {
    setIsSubmitting(false)
    navigate('/order/failure', {
      replace: true,
      state: {
        message: message || '주문이 완료되지 않았습니다.',
        reason,
        paymentId
      }
    })
  }

  // 장바구니 페이지에서 전달된 주문 데이터가 없으면 장바구니로 되돌려 보냄
  useEffect(() => {
    if (!orderState || !Array.isArray(orderState.items) || !orderState.items.length) {
      navigate('/cart')
      return
    }

    setItems(orderState.items)
    setSummary(orderState.summary || { subtotal: 0, shipping: 0, total: 0 })
    const user = orderState.user || {}
    setContact((prev) => ({
      ...prev,
      name: user.name || prev.name,
      phone: user.phone || '',
      address1: user.address?.line1 || '',
      address2: user.address?.line2 || ''
    }))
    setIsReady(true)
  }, [orderState, navigate])

  // 결제 위젯(Iamport) 스크립트 로드 및 초기화
  useEffect(() => {
    let cancelled = false

    async function initPortOne() {
      try {
        const IMP = await loadIamportScript()
        if (cancelled || !IMP || impInitializedRef.current) return
        IMP.init(PORTONE_CLIENT_CODE)
        impInitializedRef.current = true
      } catch (error) {
        console.error('포트원 결제 모듈 초기화에 실패했습니다.', error)
      }
    }

    initPortOne()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    if (storedToken) {
      setToken(storedToken)
    }
  }, [])

  // 필수 약관 동의가 모두 완료되었는지 여부 계산
  const remainingAgreement = useMemo(() => {
    return !agreements.terms || !agreements.privacy || !agreements.thirdParty
  }, [agreements])

  // 숫자를 통화 형식(원)으로 변환
  function formatCurrency(value) {
    if (typeof value !== 'number' || Number.isNaN(value)) return '-'
    return `${value.toLocaleString()}원`
  }

  // 배송지/연락처 입력 필드 업데이트
  function handleInputChange(field, value) {
    setContact((prev) => ({ ...prev, [field]: value }))
  }

  // 개별 약관 동의 상태 업데이트
  function handleAgreementChange(field, checked) {
    setAgreements((prev) => ({ ...prev, [field]: checked }))
  }

  // 전체 동의 체크박스 토글 시 모든 항목 동기화
  function handleSelectAllAgreements(checked) {
    setAgreements({
      terms: checked,
      privacy: checked,
      thirdParty: checked
    })
  }

  // 결제 버튼 클릭 시 검증 후 포트원 결제창 호출
  async function handleSubmitOrder() {
    if (isSubmitting) return

    setSubmitError('')

    if (remainingAgreement) {
      setSubmitError('필수 약관에 동의해주세요.')
      return
    }

    if (!contact.name || !contact.phone || !contact.postalCode || !contact.address1) {
      setSubmitError('배송 정보를 모두 입력해주세요.')
      return
    }

    if (!window.IMP) {
      setSubmitError('결제 모듈이 초기화되지 않았습니다. 잠시 후 다시 시도해 주세요.')
      return
    }

    if (!token) {
      setSubmitError('로그인 정보가 확인되지 않습니다. 다시 로그인 후 결제를 진행해주세요.')
      navigate('/login')
      return
    }

    const merchantUid = `ORD-${Date.now()}`
    const buyerEmail = orderState?.user?.email || ''

    const IMP = window.IMP
    const requestParams = {
      pg: 'html5_inicis',
      pay_method: paymentMethod === 'card' ? 'card' : 'trans',
      merchant_uid: merchantUid,
      name: items.length > 1
        ? `${items[0]?.product?.name || '상품'} 외 ${items.length - 1}건`
        : items[0]?.product?.name || '상품',
      amount: summary.total,
      buyer_email: buyerEmail,
      buyer_name: contact.name,
      buyer_tel: contact.phone,
      buyer_addr: `${contact.address1} ${contact.address2}`.trim(),
      buyer_postcode: contact.postalCode
    }

    const mapPaymentMethodToSchema = (method) => {
      switch (method) {
        case 'card':
          return 'card'
        case 'realtime':
          return 'bank_transfer'
        case 'bank':
          return 'virtual_account'
        case 'mobile':
          return 'mobile'
        default:
          return 'other'
      }
    }

    const mapResponseStatusToOrderStatus = (status) => {
      switch (status) {
        case 'paid':
          return 'paid'
        case 'ready':
          return 'pending'
        case 'cancelled':
        case 'failed':
          return 'cancelled'
        default:
          return 'pending'
      }
    }

    const mapResponseStatusToPaymentStatus = (status) => {
      switch (status) {
        case 'paid':
          return 'captured'
        case 'ready':
          return 'authorized'
        case 'cancelled':
          return 'refunded'
        case 'failed':
          return 'failed'
        default:
          return 'pending'
      }
    }

    const resolveProductId = (product, fallback) => {
      if (!product) return fallback
      const candidates = [
        product._id,
        product.id,
        product.productId,
        product.product_id,
        product.sku
      ]

      for (const candidate of candidates) {
        if (!candidate) continue
        return candidate
      }

      return fallback
    }

    const toISODateFromUnixSeconds = (value) => {
      if (!value) return undefined
      if (typeof value === 'number') {
        return new Date(value * 1000).toISOString()
      }
      const numeric = Number(value)
      if (!Number.isNaN(numeric) && numeric > 0) {
        return new Date(numeric * 1000).toISOString()
      }
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
    }

    const buildOrderPayload = (paymentResponse) => {
      const normalizedItems = items.map((item) => {
        const product = item.product || {}
        const productId = resolveProductId(product, item.product)

        if (!productId) {
          throw new Error('일부 상품의 식별자를 찾을 수 없습니다.')
        }

        const quantity = Number(item.quantity) > 0 ? Number(item.quantity) : 1
        const unitPrice = Number.isFinite(Number(item.price))
          ? Number(item.price)
          : Number(product.price) || 0
        const totalPrice = Number.isFinite(Number(item.totalPrice))
          ? Number(item.totalPrice)
          : unitPrice * quantity

        return {
          cart_item_id: item.id || item._id,
          product: productId,
          product_snapshot: {
            name: product.name,
            sku: product.sku,
            image: product.image,
            brand: product.brand,
            category: product.category,
            description: product.description
          },
          quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
          options: item.options || undefined
        }
      })

      const paidAt = paymentResponse.paid_at || paymentResponse.paid_timestamp

      const payload = {
        order_id: merchantUid,
        cart: orderState?.cartId || undefined,
        sub_total: Number(summary.subtotal) || 0,
        shipping_fee: Number(summary.shipping) || 0,
        total_amount: Number(summary.total) || 0,
        shipping_address: {
          recipient_name: contact.name,
          recipient_phone: contact.phone,
          postal_code: contact.postalCode,
          address_line1: contact.address1,
          address_line2: contact.address2,
          country: 'KR'
        },
        delivery_note: contact.note || undefined,
        items: normalizedItems,
        status: mapResponseStatusToOrderStatus(paymentResponse.status),
        payment: {
          method: mapPaymentMethodToSchema(paymentMethod),
          provider: paymentResponse.pg_provider || paymentResponse.card_name || 'iamport',
          transaction_id: paymentResponse.imp_uid || paymentResponse.pg_tid || merchantUid,
          imp_uid: paymentResponse.imp_uid,
          merchant_uid: paymentResponse.merchant_uid || merchantUid,
          pg_tid: paymentResponse.pg_tid,
          amount_paid: Number(paymentResponse.paid_amount) || Number(summary.total) || 0,
          currency: paymentResponse.currency || 'KRW',
          status: mapResponseStatusToPaymentStatus(paymentResponse.status),
          paid_at: toISODateFromUnixSeconds(paidAt),
          receipt_url: paymentResponse.receipt_url
        }
      }

      if (!payload.payment.paid_at) {
        payload.payment.paid_at = new Date().toISOString()
      }

      return payload
    }

    setIsSubmitting(true)

    IMP.request_pay(requestParams, (response) => {
      if (response.success) {
        ;(async () => {
          try {
            const payload = buildOrderPayload(response)
            const headers = {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }

            const orderResponse = await fetch('/api/orders', {
              method: 'POST',
              headers,
              body: JSON.stringify(payload)
            })

            const orderResult = await orderResponse.json().catch(() => ({}))

            if (orderResponse.status === 401 || orderResponse.status === 403) {
              throw new Error('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.')
            }

            if (!orderResponse.ok || !orderResult?.success) {
              const errorMessage = orderResult?.message || '주문 생성에 실패했습니다.'
              throw new Error(errorMessage)
            }

            if (orderState?.user?._id) {
              window.dispatchEvent(new CustomEvent('cart-updated', {
                detail: { count: 0, userId: orderState.user._id }
              }))
            }

            navigate('/order/complete', {
              replace: true,
              state: {
                order: orderResult.data
              }
            })
          } catch (error) {
            console.error('주문 생성 중 오류가 발생했습니다.', error)
            const failureMessage = '결제는 완료되었으나 주문 생성에 실패했습니다.'
            setSubmitError(`${failureMessage} 고객센터로 문의해주세요. 사유: ${error.message}`)
            if (error.message.includes('로그인 세션이 만료')) {
              navigate('/login')
              return
            }
            redirectToFailure({
              message: failureMessage,
              reason: error.message,
              paymentId: response.imp_uid || response.merchant_uid
            })
          } finally {
            setIsSubmitting(false)
          }
        })()
      } else {
        const failureReason = response.error_msg || '알 수 없는 오류'
        setSubmitError(`결제가 실패했습니다. 사유: ${failureReason}`)
        redirectToFailure({
          message: '결제가 완료되지 않았습니다.',
          reason: failureReason,
          paymentId: response.imp_uid || response.merchant_uid
        })
      }
    })
  }

  // 초기 데이터 준비가 완료될 때까지 화면 렌더링을 지연
  if (!isReady) {
    return null
  }

  return (
    <div className="order-page">
      {/* 상단 네비게이션 */}
      <Navbar />
      {/* 주문 정보와 결제 섹션 */}
      <main className="order-body">
        <div className="order-container">
          <section className="order-form-section">
            <h1 className="order-title">ORDER</h1>

            <div className="order-card">
              <h2 className="order-card-title">배송 정보</h2>
              <div className="order-grid order-grid-two">
                <label className="order-field">
                  <span>이름</span>
                  <input
                    type="text"
                    placeholder="수령인 이름"
                    value={contact.name}
                    onChange={(event) => handleInputChange('name', event.target.value)}
                  />
                </label>
                <label className="order-field">
                  <span>연락처</span>
                  <input
                    type="tel"
                    placeholder="010-0000-0000"
                    value={contact.phone}
                    onChange={(event) => handleInputChange('phone', event.target.value)}
                  />
                </label>
              </div>
              <div className="order-grid order-grid-address">
                <label className="order-field">
                  <span>주소</span>
                  <div className="order-postal-row">
                    <input
                      type="text"
                      placeholder="우편번호"
                      value={contact.postalCode}
                      onChange={(event) => handleInputChange('postalCode', event.target.value)}
                    />
                    <button type="button" className="order-outline-button">주소검색</button>
                  </div>
                </label>
                <label className="order-field">
                  <span className="order-accessible-hidden">기본주소</span>
                  <input
                    type="text"
                    placeholder="기본주소"
                    value={contact.address1}
                    onChange={(event) => handleInputChange('address1', event.target.value)}
                  />
                </label>
                <label className="order-field">
                  <span className="order-accessible-hidden">상세주소</span>
                  <input
                    type="text"
                    placeholder="상세주소"
                    value={contact.address2}
                    onChange={(event) => handleInputChange('address2', event.target.value)}
                  />
                </label>
                <label className="order-field">
                  <span>배송 메시지</span>
                  <input
                    type="text"
                    placeholder="배송 시 요청사항을 입력해주세요"
                    value={contact.note}
                    onChange={(event) => handleInputChange('note', event.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className="order-card">
              <h2 className="order-card-title">결제 수단</h2>
              <div className="order-payment-options">
                {[
                  { value: 'card', label: '신용카드' },
                  { value: 'realtime', label: '실시간 계좌이체' },
                  { value: 'bank', label: '무통장 입금' },
                  { value: 'mobile', label: '휴대폰 결제' }
                ].map((option) => (
                  <label key={option.value} className="order-radio-option">
                    <input
                      type="radio"
                      name="payment"
                      value={option.value}
                      checked={paymentMethod === option.value}
                      onChange={() => setPaymentMethod(option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="order-card">
              <h2 className="order-card-title">결제 동의</h2>
              <label className="order-checkbox-option">
                <input
                  type="checkbox"
                  checked={!remainingAgreement}
                  onChange={(event) => handleSelectAllAgreements(event.target.checked)}
                />
                <span>전체 동의</span>
              </label>
              <div className="order-agreement-list">
                <label className="order-checkbox-option">
                  <input
                    type="checkbox"
                    checked={agreements.terms}
                    onChange={(event) => handleAgreementChange('terms', event.target.checked)}
                  />
                  <span>구매조건 확인 및 결제진행 동의 (필수)</span>
                </label>
                <label className="order-checkbox-option">
                  <input
                    type="checkbox"
                    checked={agreements.privacy}
                    onChange={(event) => handleAgreementChange('privacy', event.target.checked)}
                  />
                  <span>개인정보 수집 및 이용 동의 (필수)</span>
                </label>
                <label className="order-checkbox-option">
                  <input
                    type="checkbox"
                    checked={agreements.thirdParty}
                    onChange={(event) => handleAgreementChange('thirdParty', event.target.checked)}
                  />
                  <span>개인정보 제3자 제공 동의 (필수)</span>
                </label>
              </div>
            </div>
          </section>

          {/* 오른쪽 주문 요약 영역 */}
          <aside className="order-summary-section">
            <div className="order-summary-card">
              <h2 className="order-card-title">주문상품</h2>
              <div className="order-items">
                {items.map((item) => {
                  const product = item.product || {}
                  return (
                    <div key={item.id} className="order-item">
                      <div className="order-item-thumbnail">
                        {product.image ? (
                          <img src={product.image} alt={product.name || '상품 이미지'} />
                        ) : (
                          <div className="order-item-placeholder">이미지 없음</div>
                        )}
                      </div>
                      <div className="order-item-info">
                        <div className="order-item-name">{product.name || '상품 이름 미정'}</div>
                        <div className="order-item-meta">
                          {formatCurrency(item.price)} × {item.quantity}
                        </div>
                      </div>
                      <div className="order-item-total">
                        {formatCurrency(item.totalPrice)}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="order-summary-row">
                <span>상품금액</span>
                <span>{formatCurrency(summary.subtotal)}</span>
              </div>
              <div className="order-summary-row">
                <span>배송비</span>
                <span>{formatCurrency(summary.shipping)}</span>
              </div>
              <div className="order-summary-divider" />
              <div className="order-summary-total">
                <span>총 결제금액</span>
                <span>{formatCurrency(summary.total)}</span>
              </div>
              <button
                type="button"
                className="order-submit-button"
                onClick={handleSubmitOrder}
                disabled={remainingAgreement || isSubmitting}
              >
                {isSubmitting ? '주문 생성 중...' : `${formatCurrency(summary.total)} 결제하기`}
              </button>
              {submitError && <div className="order-error-message">{submitError}</div>}
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default Order

