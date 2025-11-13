import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState, memo } from 'react'
import Navbar from '../components/navbar.jsx'
import Footer from '../components/Footer.jsx'
import './Home.css'
import { FALLBACK_PRODUCTS } from '../data/fallbackProducts'
import { apiFetch } from '../utils/apiClient'

function Home() {
  const [userName, setUserName] = useState('')
  const [checked, setChecked] = useState(false)
  const [products, setProducts] = useState([])
  const [productError, setProductError] = useState('')
  const [loadingProducts, setLoadingProducts] = useState(false)

  useEffect(() => {
    async function fetchMe() {
      try {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
        if (!token) {
          setChecked(true)
          return
        }

        const res = await apiFetch('auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const data = await res.json()
        if (res.ok && data?.success && data?.data?.name) {
          setUserName(data.data.name)
        }
      } catch {
        // ignore errors, treat as logged out
      } finally {
        setChecked(true)
      }
    }
    fetchMe()
  }, [])

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoadingProducts(true)
        setProductError('')
        const response = await apiFetch('products?page=1&limit=12')
        const data = await response.json()
        if (!response.ok || !data?.success) {
          throw new Error(data?.message || '상품 정보를 불러오지 못했습니다.')
        }
        setProducts(Array.isArray(data.data) ? data.data : [])
      } catch (error) {
        setProductError(error.message || '상품 정보를 불러오지 못했습니다.')
        setProducts([])
      } finally {
        setLoadingProducts(false)
      }
    }
    fetchProducts()
  }, [])

  const [bestProducts, newProducts] = useMemo(() => {
    const source = (products.length ? products : FALLBACK_PRODUCTS).map(mapProduct)

    const best = source.slice(0, 6)
    let newest = source.slice(6, 12)

    if (newest.length < 6) {
      const seenIds = new Set(newest.map((item) => item.id))
      for (const item of source) {
        if (newest.length >= 6) break
        if (seenIds.has(item.id)) continue
        seenIds.add(item.id)
        newest.push(item)
      }
    }

    return [best, newest]
  }, [products])

  return (
    <div className="home-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ position: 'relative', flex: 1 }}>
        <div className="home-content" style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
        {userName && (
          <div style={{
            background: '#f5f5f5',
            border: '1px solid #eee',
            padding: '12px 16px',
            margin: '8px 0 16px',
            borderRadius: 4,
            textAlign: 'center'
          }}>
            <strong>{userName}님 반갑습니다</strong>
          </div>
        )}

        {/* Hero Banner */}
        <section
          style={{
            position: 'relative',
            backgroundImage: "url('https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?q=80&w=1600&auto=format&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            height: 360,
            borderRadius: 6,
            overflow: 'hidden',
            marginBottom: 28
          }}
        >
          <div style={{
            position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)'
          }} />
          <div style={{ position: 'relative', color: '#fff', padding: '48px 40px', maxWidth: 700 }}>
            <div style={{ letterSpacing: 4, fontSize: 12, marginBottom: 10 }}>SPRING COLLECTION · 2024</div>
            <h1 style={{ fontSize: 56, lineHeight: 1.05, margin: '0 0 18px' }}>Timeless Elegance</h1>
            <Link to="/" style={{ display: 'inline-block' }}>
              <button style={{ height: 44, padding: '0 18px', background: '#fff', color: '#111', border: 0, cursor: 'pointer', borderRadius: 4 }}>Explore Collection</button>
            </Link>
          </div>
        </section>

        {/* Categories */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 16, marginBottom: 36 }}>
          {[
            'SKINCARE', 'MAKEUP', 'HAIRCARE', 'BODYCARE', 'FRAGRANCE', 'MEN', 'WELLNESS', 'LIFESTYLE'
          ].map((label) => (
            <div key={label} style={{ textAlign: 'center', border: '1px solid #eee', padding: 18, background: '#fff' }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 12, color: '#999' }}>카테고리</div>
            </div>
          ))}
        </section>

        <div style={{ marginBottom: 36 }}>
          {productError ? (
            <div style={{
              background: '#fef3f2',
              border: '1px solid #fca5a5',
              color: '#b91c1c',
              padding: '16px 20px',
              borderRadius: 6
            }}>
              {productError}
            </div>
          ) : loadingProducts ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#7a7d85' }}>상품 정보를 불러오는 중입니다...</div>
          ) : (
            <>
              <SectionProducts title="베스트 상품" products={bestProducts} />
              <SectionProducts title="신상품" products={newProducts} />
            </>
          )}
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Home

// Product grid section component (memoized)
const SectionProducts = memo(function SectionProducts({ title, products }) {
  if (!products.length) {
    return (
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 20, margin: '8px 0 16px' }}>{title}</h2>
        <div style={{ padding: '24px 0', textAlign: 'center', color: '#7a7d85', fontSize: 14 }}>표시할 상품이 없습니다.</div>
      </section>
    )
  }

  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: 20, margin: '8px 0 16px' }}>{title}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
        {products.map((p) => (
          <Link
            key={p.id}
            to={`/products/${p.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <article style={{ background: '#fff', border: '1px solid #eee', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ position: 'relative', paddingTop: '75%', overflow: 'hidden', background: '#f8f8f8' }}>
                {p.image ? (
                  <img src={p.image} alt={p.name} loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 12 }}>이미지 준비중</div>
                )}
              </div>
              <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase' }}>{p.category || '상품'}</div>
                <div style={{ fontSize: 14, fontWeight: 600, minHeight: 40, lineHeight: 1.3 }}>{p.name}</div>
                <div style={{ fontSize: 13, color: '#666', flexGrow: 1 }}>{p.description ? truncateText(p.description, 50) : '설명이 준비중입니다.'}</div>
                <div style={{ fontWeight: 600 }}>
                  {typeof p.price === 'number' ? `${p.price.toLocaleString()}원` : p.price || '-'}
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  )
})

function mapProduct(product) {
  return {
    id: product._id || product.product_id || product.id || crypto.randomUUID(),
    name: product.name || '이름 미정 상품',
    category: product.category,
    price: product.price,
    image: product.image,
    description: product.description
  }
}

function truncateText(text, maxLength) {
  if (!text) return ''
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text
}