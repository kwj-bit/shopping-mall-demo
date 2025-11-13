import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ProductRegistrationForm from './ProductRegistrationForm'
import { apiFetch } from '../../utils/apiClient'

function ProductManagement() {
  const location = useLocation()
  const [formVisible, setFormVisible] = useState(false)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingProduct, setEditingProduct] = useState(null)
  const [mutationPending, setMutationPending] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const PAGE_SIZE = 5

  useEffect(() => {
    fetchProducts(1)
  }, [])

  async function fetchProducts(targetPage = page) {
    try {
      setLoading(true)
      setError('')
      const response = await apiFetch(`products?page=${targetPage}&limit=${PAGE_SIZE}`)
      const data = await response.json()

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || '상품 목록을 불러오지 못했습니다.')
      }

      const list = Array.isArray(data.data) ? data.data : []
      if (list.length === 0 && data.totalPages && data.totalPages < targetPage) {
        const fallbackPage = Math.max(data.totalPages, 1)
        if (fallbackPage !== targetPage) {
          setTotalPages(data.totalPages || 1)
          return fetchProducts(fallbackPage)
        }
      }

      setProducts(list)
      setPage(data.page || targetPage)
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      setError(err.message || '상품 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setFormVisible(false)
    setEditingProduct(null)
  }

  function handleSuccess() {
    const nextPage = editingProduct ? page : 1
    setFormVisible(false)
    setEditingProduct(null)
    fetchProducts(nextPage)
  }

  async function handleDelete(productId) {
    if (!productId) return
    const confirmed = window.confirm('이 상품을 삭제하시겠습니까?')
    if (!confirmed) return
    try {
      setMutationPending(true)
      const response = await apiFetch(`products/${productId}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || '상품 삭제에 실패했습니다.')
      }

      fetchProducts(Math.min(page, totalPages))
    } catch (err) {
      alert(err.message || '상품 삭제 중 오류가 발생했습니다.')
    } finally {
      setMutationPending(false)
    }
  }

  function handleEdit(product) {
    setEditingProduct(product)
    setFormVisible(true)
  }

  function handleToggleForm() {
    setFormVisible((prev) => {
      const next = !prev
      if (next) {
        setEditingProduct(null)
      } else {
        setEditingProduct(null)
      }
      return next
    })
  }

  function handlePageChange(newPage) {
    if (newPage < 1 || newPage > totalPages || newPage === page) return
    fetchProducts(newPage)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f6f7fb' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #eceef3' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, color: '#1a1a1a', marginBottom: 6 }}>Vibe-shop Admin</div>
              <div style={{ color: '#7a7d85', fontSize: 13 }}>상품 관리</div>
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
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleToggleForm}
            style={{
              ...buttonStyle,
              background: '#111',
              color: '#fff'
            }}
          >
            {formVisible ? '닫기' : '신규 상품 등록'}
          </button>
        </div>

        {formVisible && (
          <ProductRegistrationForm
            onSuccess={handleSuccess}
            onCancel={handleReset}
            product={editingProduct}
            styles={{ buttonStyle, labelStyle, inputStyle }}
          />
        )}

        <section style={{ background: '#fff', border: '1px solid #e5e8ef', borderRadius: 10, padding: '28px 32px', boxShadow: '0 8px 20px rgba(17, 24, 39, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 20 }}>등록된 상품 ({products.length})</h2>
            <button onClick={() => fetchProducts(page)} style={{ ...buttonStyle, padding: '8px 14px' }}>새로고침</button>
          </div>

          {error && (
            <div style={{
              background: '#fef3f2',
              border: '1px solid #fca5a5',
              color: '#b91c1c',
              padding: '12px 16px',
              borderRadius: 8,
              marginBottom: 16
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px 120px 140px', gap: 16, fontSize: 12, color: '#7a7d85', textTransform: 'uppercase' }}>
              <div>이미지</div>
              <div>상품명</div>
              <div>카테고리</div>
              <div>가격</div>
              <div>상태</div>
            </div>

            {loading && (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#7a7d85', fontSize: 14 }}>상품 정보를 불러오는 중입니다...</div>
            )}

            {!loading && products.length === 0 && !error && (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#7a7d85', fontSize: 14 }}>등록된 상품이 없습니다. `신규 상품 등록` 버튼으로 상품을 추가해 보세요.</div>
            )}

            {!loading && products.map((product) => (
              <div key={product._id || product.product_id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px 120px 140px', gap: 16, alignItems: 'center', padding: '16px 0', borderTop: '1px solid #eef1f6' }}>
                <div style={{ width: 96, height: 64, borderRadius: 6, overflow: 'hidden', background: '#f1f3f7' }}>
                  <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{product.name}</div>
                  <div style={{ fontSize: 12, color: '#9aa0af', marginTop: 4 }}>{product.product_id}</div>
                </div>
                <div style={{ fontSize: 14 }}>{product.category}</div>
                <div style={{ fontSize: 14 }}>{typeof product.price === 'number' ? `${product.price.toLocaleString()}원` : product.price}</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 12px', borderRadius: 999, background: '#111', color: '#fff', fontSize: 12 }}>판매중</span>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      style={{ ...linkButtonStyle, opacity: mutationPending ? 0.4 : 1 }}
                      onClick={() => handleEdit(product)}
                      disabled={mutationPending}
                    >
                      수정
                    </button>
                    <button
                      style={{ ...linkButtonStyle, color: '#b91c1c', opacity: mutationPending ? 0.4 : 1 }}
                      onClick={() => handleDelete(product._id || product.product_id)}
                      disabled={mutationPending}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || loading}
              style={{
                ...buttonStyle,
                padding: '8px 14px',
                cursor: page <= 1 || loading ? 'not-allowed' : 'pointer',
                opacity: page <= 1 || loading ? 0.5 : 1
              }}
            >
              이전
            </button>
            <div style={{ alignSelf: 'center', fontSize: 13, color: '#7a7d85' }}>
              {page} / {totalPages}
            </div>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || loading}
              style={{
                ...buttonStyle,
                padding: '8px 14px',
                cursor: page >= totalPages || loading ? 'not-allowed' : 'pointer',
                opacity: page >= totalPages || loading ? 0.5 : 1
              }}
            >
              다음
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

function NavItem({ label, to, active }) {
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

const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: '#7a7d85',
  textTransform: 'uppercase'
}

const inputStyle = {
  border: '1px solid #d7dbe5',
  borderRadius: 6,
  padding: '12px 14px',
  fontSize: 14,
  background: '#fff',
  color: '#111'
}

const linkButtonStyle = {
  background: 'transparent',
  border: 'none',
  color: '#111',
  fontSize: 12,
  cursor: 'pointer',
  padding: 0,
  textDecoration: 'underline'
}

export default ProductManagement


