export interface Location {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
  coordinates: {
    lat: number
    lng: number
  }
  hours: {
    day: string
    hours: string
  }[]
  features: string[]
  notes?: string
}
