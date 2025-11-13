import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '../../utils/apiClient'

const INITIAL_FORM = {
  productId: '',
  name: '',
  category: '',
  price: '',
  image: '',
  description: ''
}

function ProductRegistrationForm({ onSuccess, onCancel, product, styles = {} }) {
  const {
    buttonStyle = defaultButtonStyle,
    labelStyle = defaultLabelStyle,
    inputStyle = defaultInputStyle
  } = styles

  const isEdit = Boolean(product)
  const [form, setForm] = useState(() => (product ? mapProductToForm(product) : INITIAL_FORM))
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState({ type: '', message: '' })
  const [widgetReady, setWidgetReady] = useState(false)
  const widgetRef = useRef(null)

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  useEffect(() => {
    if (!cloudName || !uploadPreset) return

    function initializeWidget() {
      if (!window.cloudinary || widgetRef.current) return
      widgetRef.current = window.cloudinary.createUploadWidget({
        cloudName,
        uploadPreset,
        sources: ['local', 'camera', 'url'],
        multiple: false,
        maxFiles: 1,
        resourceType: 'image'
      }, (error, result) => {
        if (!error && result && result.event === 'success') {
          setForm((prev) => ({ ...prev, image: result.info.secure_url }))
        }
      })
      setWidgetReady(true)
    }

    if (window.cloudinary) {
      initializeWidget()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://widget.cloudinary.com/v2.0/global/all.js'
    script.id = 'cloudinary-upload-widget'
    script.async = true
    script.onload = initializeWidget
    document.body.appendChild(script)

    return () => {
      script.onload = null
    }
  }, [cloudName, uploadPreset])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  useEffect(() => {
    if (product) setForm(mapProductToForm(product))
    else setForm(INITIAL_FORM)
  }, [product])

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      setSubmitting(true)
      setSubmitResult({ type: '', message: '' })

      const payload = {
        product_id: form.productId.trim(),
        name: form.name.trim(),
        category: form.category,
        image: form.image.trim(),
        description: form.description.trim() || undefined,
        price: Number(form.price)
      }

      if (!payload.product_id) {
        throw new Error('상품 ID를 입력하세요.')
      }

      if (Number.isNaN(payload.price)) {
        throw new Error('가격은 숫자로 입력하세요.')
      }

      const endpoint = product ? `products/${product._id || product.product_id}` : 'products'
      const method = product ? 'PUT' : 'POST'

      const response = await apiFetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok || !data?.success) {
        const message = data?.message || (product ? '상품 수정에 실패했습니다.' : '상품 등록에 실패했습니다.')
        throw new Error(message)
      }

      setSubmitResult({ type: 'success', message: product ? '상품이 성공적으로 수정되었습니다.' : '상품이 성공적으로 등록되었습니다.' })
      setForm(INITIAL_FORM)
      onSuccess?.(data?.data)
    } catch (error) {
      setSubmitResult({ type: 'error', message: error.message || '상품 등록 중 오류가 발생했습니다.' })
    } finally {
      setSubmitting(false)
    }
  }

  function handleOpenUploadWidget() {
    widgetRef.current?.open()
  }

  function handleCancel() {
    setForm(INITIAL_FORM)
    setSubmitResult({ type: '', message: '' })
    onCancel?.()
  }

  return (
    <section style={{ background: '#fff', border: '1px solid #e5e8ef', borderRadius: 10, padding: '28px 32px', boxShadow: '0 8px 20px rgba(17, 24, 39, 0.04)', marginBottom: 32 }}>
      <h2 style={{ fontSize: 20, marginBottom: 24 }}>{isEdit ? '상품 수정' : '새 상품 등록'}</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
        {submitResult.message && (
          <div style={{
            background: submitResult.type === 'success' ? '#ecfdf3' : '#fef3f2',
            border: `1px solid ${submitResult.type === 'success' ? '#86efac' : '#fca5a5'}`,
            color: submitResult.type === 'success' ? '#166534' : '#b91c1c',
            padding: '12px 16px',
            borderRadius: 8
          }}>
            {submitResult.message}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 20 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <label style={labelStyle} htmlFor="productId">상품 ID</label>
            <input
              id="productId"
              name="productId"
              value={form.productId}
              onChange={handleChange}
              placeholder="예: P-20251107-001"
              style={inputStyle}
              required
            />
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            <label style={labelStyle} htmlFor="name">상품명</label>
            <input id="name" name="name" value={form.name} onChange={handleChange} placeholder="상품명을 입력하세요" style={inputStyle} required />
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            <label style={labelStyle} htmlFor="category">카테고리</label>
            <select id="category" name="category" value={form.category} onChange={handleChange} style={inputStyle} required>
              <option value="">선택하세요</option>
              <option value="스킨케어">스킨케어</option>
              <option value="메이크업">메이크업</option>
              <option value="바디케어">바디케어</option>
              <option value="헤어케어">헤어케어</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <label style={labelStyle} htmlFor="price">가격</label>
          <input id="price" name="price" type="number" min="0" value={form.price} onChange={handleChange} placeholder="가격을 입력하세요" style={inputStyle} required />
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <label style={labelStyle}>상품 이미지</label>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ width: 160, height: 120, borderRadius: 8, border: '1px solid #d7dbe5', background: '#f4f6fb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {form.image ? (
                <img src={form.image} alt="상품 이미지 미리보기" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 12, color: '#9aa0af' }}>이미지를 업로드하세요</span>
              )}
            </div>
            <div style={{ flex: '1 1 240px', display: 'grid', gap: 12 }}>
              <button
                type="button"
                onClick={handleOpenUploadWidget}
                style={{
                  ...buttonStyle,
                  background: widgetReady ? '#111' : '#d7dbe5',
                  color: widgetReady ? '#fff' : '#9aa0af'
                }}
                disabled={!widgetReady}
              >
                Cloudinary에서 이미지 선택
              </button>
              <input
                id="image"
                name="image"
                value={form.image}
                onChange={handleChange}
                placeholder={cloudName && uploadPreset ? '자동으로 URL이 채워집니다. 직접 입력도 가능합니다.' : 'Cloudinary 설정이 필요합니다. 이미지 URL을 직접 입력하세요.'}
                style={inputStyle}
                required
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <label style={labelStyle} htmlFor="description">상품 설명</label>
          <textarea id="description" name="description" value={form.description} onChange={handleChange} placeholder="상품 설명을 입력하세요 (선택)" style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" disabled={submitting} style={{ ...buttonStyle, background: submitting ? '#9aa0af' : '#111', color: '#fff', cursor: submitting ? 'wait' : 'pointer' }}>
            {submitting ? (isEdit ? '수정 중...' : '등록 중...') : (isEdit ? '수정하기' : '등록하기')}
          </button>
          <button type="button" onClick={handleCancel} style={{ ...buttonStyle, cursor: 'pointer' }}>취소</button>
        </div>
      </form>
    </section>
  )
}

function mapProductToForm(product) {
  return {
    productId: product?.product_id || '',
    name: product?.name || '',
    category: product?.category || '',
    price: product?.price != null ? String(product.price) : '',
    image: product?.image || '',
    description: product?.description || ''
  }
}

const defaultButtonStyle = {
  border: '1px solid #d7dbe5',
  background: '#fff',
  color: '#111',
  fontSize: 13,
  padding: '10px 18px',
  borderRadius: 6,
  cursor: 'pointer'
}

const defaultLabelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: '#7a7d85',
  textTransform: 'uppercase'
}

const defaultInputStyle = {
  border: '1px solid #d7dbe5',
  borderRadius: 6,
  padding: '12px 14px',
  fontSize: 14,
  background: '#fff',
  color: '#111'
}

export default ProductRegistrationForm

