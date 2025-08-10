export interface Product {
  id: string
  name: string
  description: string
  price: number
  compareAtPrice?: number
  images: string[]
  category: string
  categoryName: string
  featured?: boolean
  bestseller?: boolean
  new?: boolean
  sizes?: string[]
  colors?: {
    name: string
    hex: string
  }[]
  material?: string
  care?: string
  sku?: string
}
