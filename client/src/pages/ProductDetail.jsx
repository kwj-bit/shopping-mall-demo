import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/navbar.jsx'
import Footer from '../components/Footer.jsx'
import './ProductDetail.css'
import { findFallbackProduct } from '../data/fallbackProducts'
import { apiFetch } from '../utils/apiClient'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fallbackProduct = useMemo(() => findFallbackProduct(id), [id])
  const [product, setProduct] = useState(fallbackProduct ? normalizeProduct(fallbackProduct, fallbackProduct) : null)
  const [loading, setLoading] = useState(!fallbackProduct)
  const [error, setError] = useState('')
  const [authToken, setAuthToken] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    let ignore = false

    async function fetchProductDetail() {
      if (fallbackProduct && id?.startsWith('fallback')) {
        setProduct(normalizeProduct(fallbackProduct, fallbackProduct))
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      try {
        const response = await apiFetch(`products/${id}`)
        if (!response.ok) {
          throw new Error('상품 정보를 불러오지 못했습니다.')
        }

        const payload = await response.json()
        if (!payload?.success || !payload?.data) {
          throw new Error('상품 데이터를 찾을 수 없습니다.')
        }

        if (!ignore) {
          setProduct(normalizeProduct(payload.data, fallbackProduct))
        }
      } catch (fetchError) {
        if (!ignore) {
          if (fallbackProduct) {
            setProduct(normalizeProduct(fallbackProduct, fallbackProduct))
            setError('')
          } else {
            setError(fetchError.message || '상품 정보를 불러오지 못했습니다.')
          }
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    fetchProductDetail()

    return () => {
      ignore = true
    }
  }, [id, fallbackProduct])

  useEffect(() => {
    setQuantity(1)
    setActionMessage({ type: '', text: '' })
  }, [product?.id])

  useEffect(() => {
    let cancelled = false
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || ''

    if (!token) {
      setAuthToken('')
      setCurrentUser(null)
      return
    }

    setAuthToken(token)

    async function fetchMe() {
      try {
        const res = await apiFetch('auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()

        if (cancelled) return

        if (res.ok && data?.success) {
          setCurrentUser(data.data)
        } else {
          setAuthToken('')
          setCurrentUser(null)
        }
      } catch {
        if (!cancelled) {
          setAuthToken('')
          setCurrentUser(null)
        }
      }
    }

    fetchMe()

    return () => {
      cancelled = true
    }
  }, [])

  const priceInfo = useMemo(() => {
    if (!product) return null

    const formattedPrice = typeof product.price === 'number'
      ? `${product.price.toLocaleString()}원`
      : product.price || '-'

    const formattedOriginal = typeof product.originalPrice === 'number'
      ? `${product.originalPrice.toLocaleString()}원`
      : product.originalPrice || ''

    const discount = product.discount ?? calculateDiscount(product.price, product.originalPrice)

    return {
      formattedPrice,
      formattedOriginal,
      discount: discount && discount > 0 ? discount : null
    }
  }, [product])

  const reviewInfo = useMemo(() => {
    if (!product) return null

    const rating = typeof product.rating === 'number' ? product.rating : 0
    const reviewCount = typeof product.reviewCount === 'number' ? product.reviewCount : 0

    return {
      rating: rating > 0 ? rating.toFixed(1) : null,
      reviewCount: reviewCount > 0 ? reviewCount.toLocaleString() : null
    }
  }, [product])

  function handleQuantityAdjust(delta) {
    setQuantity((prev) => {
      const next = Math.min(Math.max(prev + delta, 1), 99)
      return next
    })
  }

  function dispatchCartUpdated(count, userId) {
    window.dispatchEvent(new CustomEvent('cart-updated', {
      detail: { count, userId }
    }))
  }

  async function ensureUser(token) {
    if (currentUser && token) return currentUser
    if (!token) return null
    try {
      const res = await apiFetch('auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok && data?.success) {
        setCurrentUser(data.data)
        return data.data
      }
    } catch {
      // ignore
    }
    return null
  }

  async function handleAddToCart() {
    if (!product) return

    if (product.id?.toString().startsWith('fallback')) {
      setActionMessage({ type: 'error', text: '데모 상품은 실제 장바구니에 담을 수 없습니다.' })
      return
    }

    const storedToken = authToken || localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')

    if (!storedToken) {
      navigate('/login')
      return
    }

    const user = await ensureUser(storedToken)
    if (!user) {
      navigate('/login')
      return
    }

    setAdding(true)
    setActionMessage({ type: '', text: '' })

    try {
      const payload = {
        productId: product.id,
        quantity
      }
      if (typeof product.price === 'number') {
        payload.price = product.price
      }

      const res = await apiFetch(`cart/${user._id}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedToken}`
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || '장바구니에 담는 중 오류가 발생했습니다.')
      }

      const count = Array.isArray(data.data?.items) ? data.data.items.length : 0
      dispatchCartUpdated(count, user._id)
      setActionMessage({ type: 'success', text: '장바구니에 상품을 담았습니다.' })
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.message || '장바구니에 담는 중 오류가 발생했습니다.'
      })
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="product-detail-page">
      <Navbar />
      <main className="product-detail-body">
        <div className="product-detail-container">
          <div className="product-detail-breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>Products</span>
            {product?.name ? (
              <>
                <span>/</span>
                <span>{product.name}</span>
              </>
            ) : null}
          </div>

          {error && !product && (
            <div className="product-detail-alert">{error}</div>
          )}

          {loading && (
            <div className="product-detail-loading">상품 정보를 불러오는 중입니다...</div>
          )}

          {!loading && !product && !error && (
            <div className="product-detail-empty">
              상품 정보를 찾을 수 없습니다.
              <div style={{ marginTop: 16 }}>
                <Link to="/" style={{ color: '#111', textDecoration: 'underline' }}>홈으로 돌아가기</Link>
              </div>
            </div>
          )}

          {product && (
            <>
              {error && (
                <div className="product-detail-alert">
                  {error}
                </div>
              )}
              <section className="product-detail-content">
                <div className="product-detail-image-wrapper">
                  {product.image ? (
                    <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
                  ) : (
                    <div className="product-detail-image-placeholder">이미지가 준비중입니다.</div>
                  )}
                </div>
                <div className="product-detail-info">
                  {product.brand && (
                    <div className="product-detail-brand">{product.brand}</div>
                  )}
                  <h1 className="product-detail-title">{product.name}</h1>
                  {(reviewInfo?.rating || reviewInfo?.reviewCount) && (
                    <div className="product-detail-rating">
                      {reviewInfo.rating ? (
                        <>
                          <span className="product-detail-stars">★★★★★</span>
                          <span className="product-detail-rating-score">{reviewInfo.rating}</span>
                        </>
                      ) : null}
                      {reviewInfo.reviewCount ? (
                        <span className="product-detail-review-count">({reviewInfo.reviewCount} reviews)</span>
                      ) : (
                        <span className="product-detail-review-count">리뷰 준비중</span>
                      )}
                    </div>
                  )}
                  <div className="product-detail-price-block">
                    <div className="product-detail-price">{priceInfo?.formattedPrice}</div>
                    {priceInfo?.formattedOriginal && (
                      <div className="product-detail-original-price">{priceInfo.formattedOriginal}</div>
                    )}
                    {priceInfo?.discount && (
                      <span className="product-detail-discount">{priceInfo.discount}% OFF</span>
                    )}
                  </div>
                  <p className="product-detail-description">
                    {product.description || '상품 설명이 준비중입니다.'}
                  </p>
                  <div className="product-detail-quantity-block">
                    <div className="product-detail-quantity-label">수량</div>
                    <div className="product-detail-quantity-control">
                      <button
                        type="button"
                        onClick={() => handleQuantityAdjust(-1)}
                        disabled={quantity <= 1 || adding}
                      >
                        −
                      </button>
                      <span>{quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleQuantityAdjust(1)}
                        disabled={quantity >= 99 || adding}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="product-detail-actions">
                    <button
                      type="button"
                      className="product-detail-cart-button"
                      onClick={handleAddToCart}
                      disabled={adding || !product}
                    >
                      {adding ? '담는 중...' : 'Add to Cart'}
                    </button>
                    <button type="button" className="product-detail-wishlist-button">Add to Wishlist</button>
                  </div>
                  {actionMessage.text ? (
                    <div
                      className={`product-detail-action-message ${
                        actionMessage.type === 'success' ? 'success' : 'error'
                      }`}
                    >
                      {actionMessage.text}
                    </div>
                  ) : null}
                  {product.features?.length ? (
                    <>
                      <div className="product-detail-highlight-title">Key Features</div>
                      <ul className="product-detail-highlights">
                        {product.features.map((feature) => (
                          <li key={feature}>{feature}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  <div className="product-detail-meta">
                    <div>무료 배송 · 30일 반품 보장</div>
                    <div>카테고리 · {product.category || '카테고리 미정'}</div>
                    {product.createdAt ? (
                      <div>등록일 · {product.createdAt.toLocaleDateString()}</div>
                    ) : null}
                  </div>
                </div>
              </section>

              {(product.howToUse || (product.ingredients && product.ingredients.length)) && (
                <section className="product-detail-extra">
                  {product.howToUse ? (
                    <div>
                      <h2>How to Use</h2>
                      <p>{product.howToUse}</p>
                    </div>
                  ) : null}
                  {product.ingredients?.length ? (
                    <div>
                      <h2>Key Ingredients</h2>
                      <ul className="product-detail-ingredients">
                        {product.ingredients.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </section>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

function normalizeProduct(source, fallbackMeta) {
  const meta = fallbackMeta || {}
  const price = parsePrice(source?.price ?? meta.price)
  const originalPrice = parsePrice(source?.originalPrice ?? meta.originalPrice)

  let discount = source?.discount ?? meta.discount ?? null
  if (!discount && price && originalPrice && originalPrice > price) {
    discount = Math.round((1 - price / originalPrice) * 100)
  }

  return {
    id: source?._id || source?.product_id || source?.id || meta.id || '',
    name: source?.name || meta.name || '상품 이름 미정',
    brand: source?.brand || meta.brand || '',
    price,
    originalPrice,
    discount,
    rating: source?.rating ?? meta.rating ?? 0,
    reviewCount: source?.reviewCount ?? meta.reviewCount ?? 0,
    description: source?.description || meta.description || '',
    features: Array.isArray(source?.features) && source.features.length ? source.features : (meta.features || []),
    howToUse: source?.howToUse || meta.howToUse || '',
    ingredients: Array.isArray(source?.ingredients) && source.ingredients.length ? source.ingredients : (meta.ingredients || []),
    category: source?.category || meta.category || '',
    image: source?.image || meta.image || '',
    createdAt: source?.createdAt ? new Date(source.createdAt) : null
  }
}

function parsePrice(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  const digits = String(value).replace(/[^\d]/g, '')
  if (!digits) return null
  const parsed = Number.parseInt(digits, 10)
  return Number.isNaN(parsed) ? null : parsed
}

function calculateDiscount(price, originalPrice) {
  const numericPrice = parsePrice(price)
  const numericOriginal = parsePrice(originalPrice)

  if (!numericPrice || !numericOriginal || numericOriginal <= numericPrice) {
    return null
  }

  return Math.round((1 - numericPrice / numericOriginal) * 100)
}

export default ProductDetail

