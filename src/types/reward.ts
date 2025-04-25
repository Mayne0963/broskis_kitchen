export interface Reward {
  id: string
  name: string
  description: string
  pointsRequired: number
  category: string
  categoryName: string
  image: string
  tierRequired?: "bronze" | "silver" | "gold"
  expirationDays?: number
  featured?: boolean
}
