import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/navbar.jsx'
import Footer from '../components/Footer.jsx'
import './Cart.css'
import { apiFetch } from '../utils/apiClient'

function Cart() {
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [cartId, setCartId] = useState(null)
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingItemId, setUpdatingItemId] = useState(null)
  const initializedRef = useRef(false)

  const emitCartCount = useCallback((count, userId) => {
    window.dispatchEvent(new CustomEvent('cart-updated', {
      detail: { count, userId }
    }))
  }, [])

  const resolveItemId = useCallback((item) => {
    if (!item) return undefined
    const sources = [
      item._id,
      item.id,
      item.itemId,
      item.product && typeof item.product === 'object' ? (item.product._id || item.product.id) : item.product
    ]

    for (const source of sources) {
      if (!source) continue
      if (typeof source === 'object' && typeof source.toString === 'function') {
        const converted = source.toString()
        if (converted && converted !== '[object Object]') return converted
      } else if (typeof source === 'string' || typeof source === 'number') {
        const str = String(source)
        if (str) return str
      }
    }

    if (item.addedAt) {
      return `fallback-${item.addedAt}-${item.price ?? ''}`
    }

    if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID()
    }

    return `fallback-${Date.now()}-${Math.random()}`
  }, [])

  const applyCartData = useCallback((cartData, userId, { preserveSelection = false } = {}) => {
    const sourceItems = Array.isArray(cartData?.items) ? cartData.items : []
    const normalizedItems = sourceItems.map((item) => {
      const identifier = resolveItemId(item)
      return {
        ...item,
        _id: identifier,
        id: identifier
      }
    })

    setCartId(cartData?.id || null)
    setItems(normalizedItems)
    setSelected((prevSelected) => {
      const availableIds = new Set(normalizedItems.map((item) => item._id).filter(Boolean))
      if (preserveSelection && prevSelected && prevSelected.size) {
        const retained = [...prevSelected].filter((id) => availableIds.has(id))
        return new Set(retained)
      }
      return availableIds
    })
    emitCartCount(normalizedItems.length, userId)
  }, [emitCartCount, resolveItemId])

  const loadCart = useCallback(async (userId, authToken, { initial = false } = {}) => {
    setLoading(true)
    setError('')
    try {
      const headers = { Authorization: `Bearer ${authToken}` }
      let response = await apiFetch(`cart/${userId}`, { headers })
      let payload = await response.json().catch(() => ({}))

      if (response.status === 404) {
        response = await apiFetch(`cart/${userId}`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' }
        })
        payload = await response.json().catch(() => ({}))
      }

      if (!response.ok || !payload?.success) {
        const combinedErrorMessage = [payload?.error, payload?.message].filter(Boolean).join(' ')
        const emptyCartError = combinedErrorMessage.includes('최소 1개의 상품') || combinedErrorMessage.includes('Cart validation failed')

        if (emptyCartError) {
          applyCartData({ id: null, items: [] }, userId, { preserveSelection: false })
          setError('')
          return
        }

        throw new Error(payload?.message || '장바구니를 불러오지 못했습니다.')
      }

      applyCartData(payload.data, userId, { preserveSelection: !initial })
    } catch (err) {
      setError(err.message || '장바구니를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [applyCartData])

  useEffect(() => {
    if (initializedRef.current) return

    let cancelled = false

    async function initialize() {
      const storedToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')

      if (!storedToken) {
        navigate('/login')
        return
      }

      try {
        const res = await apiFetch('auth/me', { headers: { Authorization: `Bearer ${storedToken}` } })
        const data = await res.json()

        if (!res.ok || !data?.success) {
          navigate('/login')
          return
        }

        if (cancelled) return

        initializedRef.current = true
        setToken(storedToken)
        setCurrentUser(data.data)

        await loadCart(data.data._id, storedToken, { initial: true })
      } catch {
        if (!cancelled) {
          navigate('/login')
        }
      }
    }

    initialize()
    return () => {
      cancelled = true
    }
  }, [loadCart, navigate])

  const summary = useMemo(() => {
    const selectedIds = selected instanceof Set ? selected : new Set()
    let subtotal = 0
    let selectedCount = 0

    for (const item of items) {
      if (selectedIds.has(item._id)) {
        const unitPrice = typeof item.price === 'number'
          ? item.price
          : (item.product && typeof item.product === 'object' ? item.product.price : 0)
        subtotal += (unitPrice || 0) * (item.quantity || 1)
        selectedCount += 1
      }
    }

    return {
      subtotal,
      selectedCount,
      totalItems: items.length,
      shipping: selectedCount ? 0 : 0
    }
  }, [items, selected])

  function formatCurrency(value) {
    if (typeof value !== 'number' || Number.isNaN(value)) return '-'
    return `${value.toLocaleString()}원`
  }

  function handleToggleAll(event) {
    const checked = event.target.checked
    if (checked) {
      setSelected(new Set(items.map((item) => item._id).filter(Boolean)))
    } else {
      setSelected(new Set())
    }
  }

  function handleToggleItem(itemId) {
    setSelected((prev) => {
      const next = new Set(prev)
      const normalizedId = typeof itemId === 'object' && itemId !== null && typeof itemId.toString === 'function'
        ? itemId.toString()
        : itemId
      if (!normalizedId) return next
      if (next.has(normalizedId)) next.delete(normalizedId)
      else next.add(normalizedId)
      return next
    })
  }

  const handleQuantityChange = useCallback(async (itemId, nextQuantity) => {
    if (!currentUser || !token || nextQuantity < 1 || !itemId) return
    setUpdatingItemId(itemId)
    setError('')
    try {
      const res = await apiFetch(`cart/${currentUser._id}/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: nextQuantity })
      })
      const data = await res.json()

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || '수량을 변경할 수 없습니다.')
      }

      applyCartData(data.data, currentUser._id, { preserveSelection: true })
    } catch (err) {
      setError(err.message || '장바구니 처리 중 오류가 발생했습니다.')
    } finally {
      setUpdatingItemId(null)
    }
  }, [applyCartData, currentUser, token])

  const handleRemoveItem = useCallback(async (itemId) => {
    if (!currentUser || !token || !itemId) return
    setUpdatingItemId(itemId)
    setError('')
    try {
      const res = await apiFetch(`cart/${currentUser._id}/items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || '상품을 삭제할 수 없습니다.')
      }

      applyCartData(data.data, currentUser._id, { preserveSelection: true })
    } catch (err) {
      setError(err.message || '장바구니 처리 중 오류가 발생했습니다.')
    } finally {
      setUpdatingItemId(null)
    }
  }, [applyCartData, currentUser, token])

  function handleProceedToOrder() {
    if (!summary.selectedCount) {
      setError('주문할 상품을 선택해주세요.')
      return
    }

    const selectedItemsDetails = items
      .filter((item) => item._id && selected.has(item._id))
      .map((item) => {
        const product = item.product && typeof item.product === 'object' ? item.product : {}
        const unitPrice = typeof item.price === 'number' ? item.price : (product.price || 0)
        return {
          id: item._id,
          quantity: item.quantity || 1,
          price: unitPrice,
          totalPrice: unitPrice * (item.quantity || 1),
          product
        }
      })

    navigate('/order', {
      state: {
        items: selectedItemsDetails,
        summary: {
          subtotal: summary.subtotal,
          shipping: summary.shipping,
          total: summary.subtotal + summary.shipping
        },
        cartId,
        user: currentUser
      }
    })
  }

  const allSelected = items.length > 0 && selected.size === items.length

  return (
    <div className="cart-page">
      <Navbar />
      <main className="cart-body">
        <div className="cart-container">
          <section className="cart-items-card">
            <header className="cart-header">
              <div className="cart-title-block">
                <h1 className="cart-title">Shopping Bag</h1>
                <label className="cart-select-all">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleToggleAll}
                  />
                  <span>전체선택 ({selected.size}/{items.length})</span>
                </label>
              </div>
              {error && (
                <div className="cart-alert">
                  {error}
                </div>
              )}
            </header>

            {loading ? (
              <div className="cart-loading">장바구니를 불러오는 중입니다...</div>
            ) : (
              <>
                {items.length === 0 ? (
                  <div className="cart-empty">
                    장바구니에 담긴 상품이 없어요.
                    <button type="button" onClick={() => navigate('/')} className="cart-empty-link">
                      쇼핑 계속하기
                    </button>
                  </div>
                ) : (
                  <div className="cart-items-list">
                    {items.map((item, index) => {
                      const product = item.product && typeof item.product === 'object' ? item.product : {}
                      const quantity = item.quantity || 1
                      const unitPrice = typeof item.price === 'number' ? item.price : (product.price || 0)
                      const itemTotal = unitPrice * quantity
                      const itemId = item._id
                      const isSelected = itemId ? selected.has(itemId) : false

                      return (
                        <article key={itemId || `${product._id || 'item'}-${index}`} className={`cart-item ${isSelected ? 'cart-item-selected' : ''}`}>
                          <div className="cart-item-select">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleItem(itemId)}
                            />
                          </div>
                          <div className="cart-item-thumbnail">
                            {product.image ? (
                              <img src={product.image} alt={product.name || '상품 이미지'} />
                            ) : (
                              <div className="cart-item-placeholder">이미지 준비중</div>
                            )}
                          </div>
                          <div className="cart-item-details">
                            <div className="cart-item-meta">
                              <span className="cart-item-brand">{product.brand || product.category || '상품'}</span>
                              <h2 className="cart-item-name">{product.name || '상품 이름 미정'}</h2>
                              <div className="cart-item-price">{formatCurrency(unitPrice)}</div>
                            </div>
                            <div className="cart-item-actions">
                              <div className="quantity-control">
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(itemId, quantity - 1)}
                                  disabled={quantity <= 1 || updatingItemId === itemId}
                                >
                                  -
                                </button>
                                <span>{quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(itemId, quantity + 1)}
                                  disabled={updatingItemId === itemId}
                                >
                                  +
                                </button>
                              </div>
                              <div className="cart-item-total">{formatCurrency(itemTotal)}</div>
                              <button
                                type="button"
                                className="cart-item-remove"
                                onClick={() => handleRemoveItem(itemId)}
                                disabled={updatingItemId === itemId}
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </section>

          <aside className="cart-summary-card">
            <div className="cart-summary-header">
              <h2>주문요약</h2>
              <span>선택상품 {summary.selectedCount}개</span>
            </div>
            <dl className="cart-summary-list">
              <div className="cart-summary-row">
                <dt>상품금액</dt>
                <dd>{formatCurrency(summary.subtotal)}</dd>
              </div>
              <div className="cart-summary-row">
                <dt>배송비</dt>
                <dd>{formatCurrency(summary.shipping)}</dd>
              </div>
              <div className="cart-summary-divider" />
              <div className="cart-summary-row cart-summary-total">
                <dt>총 결제금액</dt>
                <dd>{formatCurrency(summary.subtotal + summary.shipping)}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="cart-order-button"
              disabled={!summary.selectedCount}
              onClick={handleProceedToOrder}
            >
              주문하기
            </button>
            <p className="cart-summary-note">하나만 사도 무료배송!</p>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default Cart

