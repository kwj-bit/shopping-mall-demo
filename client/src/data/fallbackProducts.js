export const FALLBACK_PRODUCTS = [
  {
    id: 'fallback-1',
    product_id: 'fallback-1',
    name: 'Hydrating Essence',
    brand: 'ROUND LAB',
    price: 28000,
    originalPrice: 35000,
    discount: 20,
    rating: 4.8,
    reviewCount: 1234,
    category: 'SKINCARE',
    description: '풍부한 수분감을 선사하는 에센스',
    features: [
      'Deep hydration with birch sap',
      'Hyaluronic acid for moisture retention',
      'Lightweight, non-sticky formula',
      'Suitable for all skin types'
    ],
    howToUse: 'After cleansing and toning, apply an appropriate amount to face and neck. Gently pat until fully absorbed.',
    ingredients: [
      'Water',
      'Birch Sap',
      'Glycerin',
      'Hyaluronic Acid',
      'Niacinamide',
      'Panthenol'
    ],
    image: 'https://images.unsplash.com/photo-1556228578-946f85dafe43?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'fallback-2',
    product_id: 'fallback-2',
    name: 'Sun Cream SPF50+',
    brand: 'DAYGLOW',
    price: 32000,
    rating: 4.6,
    reviewCount: 892,
    category: 'SKINCARE',
    description: '자외선 차단과 보습을 동시에',
    features: [
      'Broad spectrum UV protection',
      'Non-greasy, fast-absorbing texture',
      'Infused with soothing centella',
      'Water resistant up to 80 minutes'
    ],
    howToUse: 'Apply generously to face and exposed skin 15 minutes before sun exposure. Reapply every 2 hours.',
    ingredients: [
      'Water',
      'Titanium Dioxide',
      'Zinc Oxide',
      'Centella Asiatica Extract',
      'Aloe Vera Leaf Extract'
    ],
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'fallback-3',
    product_id: 'fallback-3',
    name: 'Cleansing Foam',
    brand: 'PURE BALANCE',
    price: 15000,
    rating: 4.5,
    reviewCount: 645,
    category: 'SKINCARE',
    description: '부드럽게 피부를 세정하는 폼 클렌저',
    features: [
      'Soft foam effectively removes impurities',
      'Maintains skin’s natural moisture barrier',
      'pH-balanced for daily use',
      'Infused with chamomile extract'
    ],
    howToUse: 'Dispense a small amount and lather with water. Gently massage onto face and rinse thoroughly.',
    ingredients: [
      'Water',
      'Cocamidopropyl Betaine',
      'Glycerin',
      'Chamomile Extract',
      'Green Tea Extract'
    ],
    image: 'https://images.unsplash.com/photo-1556228578-946f85dafe43?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'fallback-4',
    product_id: 'fallback-4',
    name: 'Toner Pads',
    brand: 'SKIN RESET',
    price: 22000,
    rating: 4.7,
    reviewCount: 732,
    category: 'SKINCARE',
    description: '간편하게 사용하는 데일리 토너 패드',
    features: [
      'Dual-textured pads for exfoliation and hydration',
      'Enriched with PHA and hyaluronic acid',
      'Cooling sensation reduces puffiness',
      'Dermatologist tested'
    ],
    howToUse: 'After cleansing, swipe embossed side across face, then pat with smooth side. Do not rinse.',
    ingredients: [
      'Water',
      'Gluconolactone (PHA)',
      'Hyaluronic Acid',
      'Allantoin',
      'Betaine'
    ],
    image: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'fallback-5',
    product_id: 'fallback-5',
    name: 'Lip Tint',
    brand: 'COLOR VEIL',
    price: 12000,
    rating: 4.4,
    reviewCount: 410,
    category: 'MAKEUP',
    description: '선명한 발색과 촉촉한 텍스처의 립 틴트',
    features: [
      'Long-lasting vivid color',
      'Nourishing oil-infused formula',
      'Blends effortlessly for gradient lips',
      'Available in 8 flattering shades'
    ],
    howToUse: 'Apply from the center of the lips and blend outward. Layer to intensify color.',
    ingredients: [
      'Dimethicone',
      'Ricinus Communis (Castor) Seed Oil',
      'Shea Butter',
      'Vitamin E',
      'Color Pigments'
    ],
    image: 'https://images.unsplash.com/photo-1631210862035-9aab0c595b0e?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'fallback-6',
    product_id: 'fallback-6',
    name: 'Sheet Mask Set',
    brand: 'GLOW UP',
    price: 18000,
    rating: 4.6,
    reviewCount: 523,
    category: 'SKINCARE',
    description: '피부 컨디션에 맞게 골라쓰는 시트 마스크 세트',
    features: [
      'Five targeted sheet masks for weekly care',
      'Made with breathable bio-cellulose',
      'Infused with vitamin-rich essence',
      'Instant radiance boost'
    ],
    howToUse: 'Apply mask to cleansed face for 15-20 minutes. Remove and gently pat remaining essence.',
    ingredients: [
      'Water',
      'Niacinamide',
      'Hyaluronic Acid',
      'Adenosine',
      'Botanical Extract Blend'
    ],
    image: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?q=80&w=800&auto=format&fit=crop'
  }
];

export function findFallbackProduct(id) {
  return FALLBACK_PRODUCTS.find((item) => item.id === id || item.product_id === id);
}

