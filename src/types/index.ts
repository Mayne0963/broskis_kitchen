// User types
export interface User {
  id: string
  name: string
  email: string
  role?: "user" | "admin"
  emailVerified?: boolean
}

// Auth types
export interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  signup: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<boolean>
  resendEmailVerification: () => Promise<boolean>
}

// Cart types
export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  customizations?: {
    [categoryId: string]: CustomizationOption[]
  }
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
}

// Customization option types
export interface CustomizationOption {
  id: string
  name: string
  price: number
}

export interface CustomizationCategory {
  id: string
  name: string
  required: boolean
  multiple: boolean
  options: CustomizationOption[]
}
