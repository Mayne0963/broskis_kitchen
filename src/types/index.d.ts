import type React from "react"
// User types
export interface User {
  id: string
  name: string
  email: string
  isGuest?: boolean
}

// Auth types
export interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  isLoading?: boolean
}

// Cart types
export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
}

export interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  subtotal: number
  tax: number
  total: number
  itemCount: number
  loading: boolean
  error: string | null
}

// Delivery types
export interface DeliveryAddress {
  street: string
  city: string
  state: string
  zipCode: string
}

export interface DeliveryContextType {
  deliveryAddress: DeliveryAddress | null
  isDelivery: boolean
  estimatedTime: string | null
  setDeliveryAddress: (address: DeliveryAddress) => void
  setIsDelivery: (isDelivery: boolean) => void
  setEstimatedTime: (time: string) => void
  clearDeliveryInfo: () => void
}

// Media player types
export interface Track {
  id: string
  title: string
  artist: string
  url: string
  coverImage?: string
}

export interface MediaPlayerContextType {
  isPlaying: boolean
  currentTrack: Track | null
  volume: number
  playlist: Track[]
  playTrack: (track: Track) => void
  pauseTrack: () => void
  nextTrack: () => void
  previousTrack: () => void
  setVolume: (volume: number) => void
  addToPlaylist: (track: Track) => void
  removeFromPlaylist: (id: string) => void
}

// Rewards types
export interface RewardHistory {
  id: string
  date: string
  action: string
  points: number
}

export interface RewardsContextType {
  points: number
  addPoints: (points: number) => void
  redeemPoints: (points: number) => void
  history: RewardHistory[]
  loading: boolean
  error: string | null
}

// Chat types
export interface ChatMessage {
  role: "user" | "assistant"
  text: string
}

export interface ChatContextType {
  messages: ChatMessage[]
  sendMessage: (message: string) => Promise<void>
  isLoading: boolean
  clearChat: () => void
}

// Age verification types
export interface AgeVerificationContextType {
  ageVerified: boolean
  verifyAge: (month: number, year: number) => Promise<boolean>
  isVerifying: boolean
  error: string | null
  requestVerification: () => boolean
  showVerificationOnLoad: boolean
  setShowVerificationOnLoad: React.Dispatch<React.SetStateAction<boolean>>
}
