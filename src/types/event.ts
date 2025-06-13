export interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: {
    id: string
    name: string
  }
  category: string
  image: string
  price: number
  capacity: number
  registered: number
  featured: boolean
  features: string[]
  schedule?: {
    time: string
    activity: string
  }[]
  host?: {
    name: string
    title: string
    image?: string
  }
}
