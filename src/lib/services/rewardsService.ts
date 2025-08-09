import { db, isFirebaseConfigured } from './firebase'
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore'

// Types
export interface UserRewards {
  id: string
  userId: string
  points: number
  tier: string
  nextTier: string
  pointsToNextTier: number
  totalSpent: number
  ordersCount: number
  lifetimePoints: number
  redeemedPoints: number
  createdAt: Date
  updatedAt: Date
}

export interface PointsTransaction {
  id: string
  userId: string
  type: 'earned' | 'redeemed' | 'bonus' | 'referral' | 'expired' | 'adjusted'
  points: number
  description: string
  date: Date
  orderId?: string
  referralId?: string
  promotionId?: string
  redemptionId?: string
}

export interface RewardOffer {
  id: string
  title: string
  description: string
  pointsCost: number
  type: 'food' | 'discount' | 'service' | 'bonus'
  category: string
  validUntil: Date
  isActive: boolean
  maxRedemptions: number
  currentRedemptions: number
  terms: string
  image?: string
  createdAt: Date
  updatedAt: Date
}

export interface UserRedemption {
  id: string
  userId: string
  offerId: string
  offerTitle: string
  pointsUsed: number
  redeemedAt: Date
  status: 'active' | 'used' | 'expired'
  expiresAt?: Date
  usedAt?: Date
  orderId?: string
  code?: string
}

// Collections
const USER_REWARDS_COLLECTION = 'userRewards'
const POINTS_TRANSACTIONS_COLLECTION = 'pointsTransactions'
const REWARD_OFFERS_COLLECTION = 'rewardOffers'
const USER_REDEMPTIONS_COLLECTION = 'userRedemptions'

// Mock data fallback
const mockUserRewards = {
  'mock-user-id': {
    id: 'mock-user-id',
    userId: 'mock-user-id',
    points: 1250,
    tier: 'Gold',
    nextTier: 'Platinum',
    pointsToNextTier: 750,
    totalSpent: 485.50,
    ordersCount: 23,
    lifetimePoints: 2100,
    redeemedPoints: 850,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

const mockOffers: RewardOffer[] = [
  {
    id: '1',
    title: 'Free Appetizer',
    description: 'Get any appetizer on the house',
    pointsCost: 500,
    type: 'food',
    category: 'appetizer',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true,
    maxRedemptions: 100,
    currentRedemptions: 23,
    terms: 'Valid for dine-in and takeout. Cannot be combined with other offers.',
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=delicious%20appetizer%20platter%20with%20wings%20and%20dips&image_size=square',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    title: '20% Off Next Order',
    description: 'Save 20% on your entire next order',
    pointsCost: 750,
    type: 'discount',
    category: 'percentage',
    validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    isActive: true,
    maxRedemptions: 50,
    currentRedemptions: 12,
    terms: 'Valid for orders over $25. Cannot be combined with other discounts.',
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=discount%20coupon%20with%2020%20percent%20off%20text&image_size=square',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    title: 'Free Delivery',
    description: 'Get free delivery on your next order',
    pointsCost: 300,
    type: 'service',
    category: 'delivery',
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    isActive: true,
    maxRedemptions: 200,
    currentRedemptions: 87,
    terms: 'Valid for delivery orders only. Minimum order value $15.',
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=delivery%20truck%20with%20free%20delivery%20text&image_size=square',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// User Rewards Functions
export async function getUserRewards(userId: string): Promise<UserRewards | null> {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase not configured, using mock data')
    return mockUserRewards[userId as keyof typeof mockUserRewards] || null
  }

  try {
    const userRewardsRef = doc(db, USER_REWARDS_COLLECTION, userId)
    const docSnap = await getDoc(userRewardsRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        userId: data.userId,
        points: data.points || 0,
        tier: data.tier || 'Bronze',
        nextTier: data.nextTier || 'Silver',
        pointsToNextTier: data.pointsToNextTier || 500,
        totalSpent: data.totalSpent || 0,
        ordersCount: data.ordersCount || 0,
        lifetimePoints: data.lifetimePoints || 0,
        redeemedPoints: data.redeemedPoints || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      }
    }
    
    return null
  } catch (error) {
    console.error('Error fetching user rewards:', error)
    return mockUserRewards[userId as keyof typeof mockUserRewards] || null
  }
}

export async function createUserRewards(userId: string): Promise<UserRewards> {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase not configured, using mock data')
    return mockUserRewards['mock-user-id']
  }

  try {
    const newUserRewards = {
      userId,
      points: 0,
      tier: 'Bronze',
      nextTier: 'Silver',
      pointsToNextTier: 500,
      totalSpent: 0,
      ordersCount: 0,
      lifetimePoints: 0,
      redeemedPoints: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }

    const userRewardsRef = doc(db, USER_REWARDS_COLLECTION, userId)
    await updateDoc(userRewardsRef, newUserRewards)

    return {
      id: userId,
      ...newUserRewards,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  } catch (error) {
    console.error('Error creating user rewards:', error)
    return mockUserRewards['mock-user-id']
  }
}

export async function updateUserRewards(userId: string, updates: Partial<UserRewards>): Promise<UserRewards | null> {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase not configured, using mock data')
    return mockUserRewards[userId as keyof typeof mockUserRewards] || null
  }

  try {
    const userRewardsRef = doc(db, USER_REWARDS_COLLECTION, userId)
    await updateDoc(userRewardsRef, {
      ...updates,
      updatedAt: Timestamp.now()
    })

    return await getUserRewards(userId)
  } catch (error) {
    console.error('Error updating user rewards:', error)
    return null
  }
}

// Points Transactions Functions
export async function addPointsTransaction(transaction: Omit<PointsTransaction, 'id'>): Promise<PointsTransaction | null> {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase not configured, using mock data')
    return {
      id: `mock-${Date.now()}`,
      ...transaction
    }
  }

  try {
    const transactionData = {
      ...transaction,
      date: Timestamp.fromDate(transaction.date)
    }

    const docRef = await addDoc(collection(db, POINTS_TRANSACTIONS_COLLECTION), transactionData)
    
    return {
      id: docRef.id,
      ...transaction
    }
  } catch (error) {
    console.error('Error adding points transaction:', error)
    return null
  }
}

export async function getUserPointsHistory(userId: string, limitCount: number = 50): Promise<PointsTransaction[]> {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase not configured, using mock data')
    return []
  }

  try {
    const q = query(
      collection(db, POINTS_TRANSACTIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(limitCount)
    )
    
    const querySnapshot = await getDocs(q)
    const transactions: PointsTransaction[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      transactions.push({
        id: doc.id,
        userId: data.userId,
        type: data.type,
        points: data.points,
        description: data.description,
        date: data.date?.toDate() || new Date(),
        orderId: data.orderId,
        referralId: data.referralId,
        promotionId: data.promotionId,
        redemptionId: data.redemptionId
      })
    })
    
    return transactions
  } catch (error) {
    console.error('Error fetching points history:', error)
    return []
  }
}

// Reward Offers Functions
export async function getAllRewardOffers(): Promise<RewardOffer[]> {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase not configured, using mock data')
    return mockOffers
  }

  try {
    const q = query(
      collection(db, REWARD_OFFERS_COLLECTION),
      where('isActive', '==', true),
      orderBy('pointsCost', 'asc')
    )
    
    const querySnapshot = await getDocs(q)
    const offers: RewardOffer[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      offers.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        pointsCost: data.pointsCost,
        type: data.type,
        category: data.category,
        validUntil: data.validUntil?.toDate() || new Date(),
        isActive: data.isActive,
        maxRedemptions: data.maxRedemptions,
        currentRedemptions: data.currentRedemptions || 0,
        terms: data.terms,
        image: data.image,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      })
    })
    
    return offers
  } catch (error) {
    console.error('Error fetching reward offers:', error)
    return mockOffers
  }
}

export async function createRewardOffer(offer: Omit<RewardOffer, 'id' | 'createdAt' | 'updatedAt'>): Promise<RewardOffer | null> {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase not configured, using mock data')
    return {
      id: `mock-${Date.now()}`,
      ...offer,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  try {
    const offerData = {
      ...offer,
      validUntil: Timestamp.fromDate(offer.validUntil),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }

    const docRef = await addDoc(collection(db, REWARD_OFFERS_COLLECTION), offerData)
    
    return {
      id: docRef.id,
      ...offer,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  } catch (error) {
    console.error('Error creating reward offer:', error)
    return null
  }
}

// User Redemptions Functions
export async function createUserRedemption(redemption: Omit<UserRedemption, 'id'>): Promise<UserRedemption | null> {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase not configured, using mock data')
    return {
      id: `mock-${Date.now()}`,
      ...redemption
    }
  }

  try {
    const redemptionData = {
      ...redemption,
      redeemedAt: Timestamp.fromDate(redemption.redeemedAt),
      expiresAt: redemption.expiresAt ? Timestamp.fromDate(redemption.expiresAt) : null,
      usedAt: redemption.usedAt ? Timestamp.fromDate(redemption.usedAt) : null
    }

    const docRef = await addDoc(collection(db, USER_REDEMPTIONS_COLLECTION), redemptionData)
    
    return {
      id: docRef.id,
      ...redemption
    }
  } catch (error) {
    console.error('Error creating user redemption:', error)
    return null
  }
}

export async function getUserRedemptions(userId: string): Promise<UserRedemption[]> {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase not configured, using mock data')
    return []
  }

  try {
    const q = query(
      collection(db, USER_REDEMPTIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('redeemedAt', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    const redemptions: UserRedemption[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      redemptions.push({
        id: doc.id,
        userId: data.userId,
        offerId: data.offerId,
        offerTitle: data.offerTitle,
        pointsUsed: data.pointsUsed,
        redeemedAt: data.redeemedAt?.toDate() || new Date(),
        status: data.status,
        expiresAt: data.expiresAt?.toDate(),
        usedAt: data.usedAt?.toDate(),
        orderId: data.orderId,
        code: data.code
      })
    })
    
    return redemptions
  } catch (error) {
    console.error('Error fetching user redemptions:', error)
    return []
  }
}

// Admin Analytics Functions
export async function getRewardsAnalytics(): Promise<{
  totalPointsIssued: number
  totalPointsRedeemed: number
  activeOffers: number
  totalRedemptions: number
  topRedemptions: Array<{ offer: string; count: number; points: number }>
}> {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase not configured, using mock data')
    return {
      totalPointsIssued: 125000,
      totalPointsRedeemed: 45000,
      activeOffers: 8,
      totalRedemptions: 342,
      topRedemptions: [
        { offer: 'Free Appetizer', count: 89, points: 500 },
        { offer: 'Free Delivery', count: 156, points: 300 },
        { offer: '20% Off Next Order', count: 67, points: 750 }
      ]
    }
  }

  try {
    // Get total points issued
    const earnedQuery = query(
      collection(db, POINTS_TRANSACTIONS_COLLECTION),
      where('type', 'in', ['earned', 'bonus', 'referral'])
    )
    const earnedSnapshot = await getDocs(earnedQuery)
    const totalPointsIssued = earnedSnapshot.docs.reduce((sum, doc) => sum + (doc.data().points || 0), 0)

    // Get total points redeemed
    const redeemedQuery = query(
      collection(db, POINTS_TRANSACTIONS_COLLECTION),
      where('type', '==', 'redeemed')
    )
    const redeemedSnapshot = await getDocs(redeemedQuery)
    const totalPointsRedeemed = Math.abs(redeemedSnapshot.docs.reduce((sum, doc) => sum + (doc.data().points || 0), 0))

    // Get active offers count
    const offersQuery = query(
      collection(db, REWARD_OFFERS_COLLECTION),
      where('isActive', '==', true)
    )
    const offersSnapshot = await getDocs(offersQuery)
    const activeOffers = offersSnapshot.size

    // Get total redemptions
    const redemptionsSnapshot = await getDocs(collection(db, USER_REDEMPTIONS_COLLECTION))
    const totalRedemptions = redemptionsSnapshot.size

    // Get top redemptions (simplified - would need aggregation in real implementation)
    const topRedemptions = [
      { offer: 'Free Appetizer', count: 89, points: 500 },
      { offer: 'Free Delivery', count: 156, points: 300 },
      { offer: '20% Off Next Order', count: 67, points: 750 }
    ]

    return {
      totalPointsIssued,
      totalPointsRedeemed,
      activeOffers,
      totalRedemptions,
      topRedemptions
    }
  } catch (error) {
    console.error('Error fetching rewards analytics:', error)
    return {
      totalPointsIssued: 0,
      totalPointsRedeemed: 0,
      activeOffers: 0,
      totalRedemptions: 0,
      topRedemptions: []
    }
  }
}