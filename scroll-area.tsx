export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string // primary image
  images: string // pipe-separated additional images
  sizes: string
  category: string
  featured: boolean
  inStock: boolean
  createdAt: string
  updatedAt: string
}

export interface SiteSettings {
  storeName?: string
  storeTagline?: string
  heroTitle?: string
  heroSubtitle?: string
  heroBadge?: string
  whatsappNumber?: string
  whatsappMessage?: string
  contactEmail?: string
  contactInstagram?: string
  footerText?: string
  logoImage?: string
  marqueeText?: string
  [key: string]: string | undefined
}

export function parseSizes(sizes: string): string[] {
  return sizes.split(',').map(s => s.trim()).filter(Boolean)
}

export function parseImages(images: string): string[] {
  if (!images) return []
  return images.split('|').map(s => s.trim()).filter(Boolean)
}

/** Returns ALL images for a product (primary first, then additional, de-duplicated) */
export function getAllProductImages(product: Product): string[] {
  const all = [product.image, ...parseImages(product.images)]
  return Array.from(new Set(all.filter(Boolean)))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price)
}
