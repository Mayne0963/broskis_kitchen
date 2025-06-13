import { db, isFirebaseConfigured } from './firebase'
import { collection, addDoc, doc, updateDoc, query, where, getDocs, Timestamp } from 'firebase/firestore'
import type { Reward } from '../../types/reward'

export interface Coupon {
  id: string
  code: string
  rewardId: string
  rewardName: string
  userId: string
  isUsed: boolean
  createdAt: Date
  expiresAt: Date
  usedAt?: Date
  orderIds?: string[]
}

// Generate a unique coupon code
export const generateCouponCode = (): string => {
  const prefix = 'BK'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}${timestamp}${random}`
}

// Create a new coupon when a reward is redeemed
export const createCoupon = async (
  reward: Reward,
  userId: string
): Promise<Coupon | null> => {
  try {
    const code = generateCouponCode()
    const now = new Date()
    const expiresAt = reward.expirationDays 
      ? new Date(now.getTime() + reward.expirationDays * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // Default 30 days

    const couponData = {
      code,
      rewardId: reward.id,
      rewardName: reward.name,
      userId,
      isUsed: false,
      createdAt: Timestamp.fromDate(now),
      expiresAt: Timestamp.fromDate(expiresAt)
    }

    if (isFirebaseConfigured() && db) {
      try {
        const docRef = await addDoc(collection(db, 'coupons'), couponData)
        
        const coupon: Coupon = {
          id: docRef.id,
          code,
          rewardId: reward.id,
          rewardName: reward.name,
          userId,
          isUsed: false,
          createdAt: now,
          expiresAt
        }

        console.log('Coupon created in Firebase:', coupon.code)
        return coupon
      } catch (firebaseError) {
        console.warn('Failed to create coupon in Firebase, using localStorage:', firebaseError)
      }
    }

    // Fallback to localStorage
    const coupon: Coupon = {
      id: `local_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      code,
      rewardId: reward.id,
      rewardName: reward.name,
      userId,
      isUsed: false,
      createdAt: now,
      expiresAt
    }

    const existingCoupons = JSON.parse(localStorage.getItem('coupons') || '[]')
    existingCoupons.push({
      ...coupon,
      createdAt: coupon.createdAt.toISOString(),
      expiresAt: coupon.expiresAt.toISOString()
    })
    localStorage.setItem('coupons', JSON.stringify(existingCoupons))

    console.log('Coupon created in localStorage:', coupon.code)
    return coupon
  } catch (error) {
    console.error('Error creating coupon:', error)
    return null
  }
}

// Validate and use a coupon
export const useCoupon = async (
  code: string,
  orderId: string
): Promise<{ success: boolean; coupon?: Coupon; error?: string }> => {
  try {
    if (isFirebaseConfigured() && db) {
      try {
        const couponsRef = collection(db, 'coupons')
        const q = query(couponsRef, where('code', '==', code))
        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
          return { success: false, error: 'Invalid coupon code' }
        }

        const couponDoc = querySnapshot.docs[0]
        const couponData = couponDoc.data()
        
        const coupon: Coupon = {
          id: couponDoc.id,
          code: couponData.code,
          rewardId: couponData.rewardId,
          rewardName: couponData.rewardName,
          userId: couponData.userId,
          isUsed: couponData.isUsed,
          createdAt: couponData.createdAt.toDate(),
          expiresAt: couponData.expiresAt.toDate(),
          usedAt: couponData.usedAt?.toDate(),
          orderIds: couponData.orderIds || []
        }

        // Check if coupon is already used
        if (coupon.isUsed) {
          return { success: false, error: 'This coupon has already been used' }
        }

        // Check if coupon is expired
        if (coupon.expiresAt < new Date()) {
          return { success: false, error: 'This coupon has expired' }
        }

        // Mark coupon as used
        await updateDoc(doc(db, 'coupons', couponDoc.id), {
          isUsed: true,
          usedAt: Timestamp.now(),
          orderIds: [...coupon.orderIds, orderId]
        })

        const updatedCoupon: Coupon = {
          ...coupon,
          isUsed: true,
          usedAt: new Date(),
          orderIds: [...coupon.orderIds, orderId]
        }

        console.log('Coupon used successfully in Firebase:', code)
        return { success: true, coupon: updatedCoupon }
      } catch (firebaseError) {
        console.warn('Failed to use coupon in Firebase, checking localStorage:', firebaseError)
      }
    }

    // Fallback to localStorage
    const existingCoupons = JSON.parse(localStorage.getItem('coupons') || '[]')
    const couponIndex = existingCoupons.findIndex((c: Coupon) => c.code === code)

    if (couponIndex === -1) {
      return { success: false, error: 'Invalid coupon code' }
    }

    const couponData = existingCoupons[couponIndex]
    const coupon: Coupon = {
      ...couponData,
      createdAt: new Date(couponData.createdAt),
      expiresAt: new Date(couponData.expiresAt),
      usedAt: couponData.usedAt ? new Date(couponData.usedAt) : undefined
    }

    // Check if coupon is already used
    if (coupon.isUsed) {
      return { success: false, error: 'This coupon has already been used' }
    }

    // Check if coupon is expired
    if (coupon.expiresAt < new Date()) {
      return { success: false, error: 'This coupon has expired' }
    }

    // Mark coupon as used
    existingCoupons[couponIndex] = {
      ...couponData,
      isUsed: true,
      usedAt: new Date().toISOString(),
      orderIds: [...(couponData.orderIds || []), orderId]
    }
    localStorage.setItem('coupons', JSON.stringify(existingCoupons))

    const updatedCoupon: Coupon = {
      ...coupon,
      isUsed: true,
      usedAt: new Date(),
      orderIds: [...(coupon.orderIds || []), orderId]
    }

    console.log('Coupon used successfully in localStorage:', code)
    return { success: true, coupon: updatedCoupon }
  } catch (error) {
    console.error('Error using coupon:', error)
    return { success: false, error: 'An error occurred while processing the coupon' }
  }
}

// Get user's coupons
export const getUserCoupons = async (userId: string): Promise<Coupon[]> => {
  try {
    if (isFirebaseConfigured() && db) {
      try {
        const couponsRef = collection(db, 'coupons')
        const q = query(couponsRef, where('userId', '==', userId))
        const querySnapshot = await getDocs(q)

        const coupons: Coupon[] = querySnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            code: data.code,
            rewardId: data.rewardId,
            rewardName: data.rewardName,
            userId: data.userId,
            isUsed: data.isUsed,
            createdAt: data.createdAt.toDate(),
            expiresAt: data.expiresAt.toDate(),
            usedAt: data.usedAt?.toDate(),
            orderIds: data.orderIds || []
          }
        })

        console.log('User coupons fetched from Firebase:', coupons.length)
        return coupons
      } catch (firebaseError) {
        console.warn('Failed to fetch coupons from Firebase, using localStorage:', firebaseError)
      }
    }

    // Fallback to localStorage
    const existingCoupons = JSON.parse(localStorage.getItem('coupons') || '[]')
    const userCoupons = existingCoupons
      .filter((c: Coupon) => c.userId === userId)
      .map((c: Coupon) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        expiresAt: new Date(c.expiresAt),
        usedAt: c.usedAt ? new Date(c.usedAt) : undefined
      }))

    console.log('User coupons fetched from localStorage:', userCoupons.length)
    return userCoupons
  } catch (error) {
    console.error('Error fetching user coupons:', error)
    return []
  }
}

// Validate coupon without using it
export const validateCoupon = async (
  code: string
): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> => {
  try {
    if (isFirebaseConfigured() && db) {
      try {
        const couponsRef = collection(db, 'coupons')
        const q = query(couponsRef, where('code', '==', code))
        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
          return { valid: false, error: 'Invalid coupon code' }
        }

        const couponDoc = querySnapshot.docs[0]
        const couponData = couponDoc.data()
        
        const coupon: Coupon = {
          id: couponDoc.id,
          code: couponData.code,
          rewardId: couponData.rewardId,
          rewardName: couponData.rewardName,
          userId: couponData.userId,
          isUsed: couponData.isUsed,
          createdAt: couponData.createdAt.toDate(),
          expiresAt: couponData.expiresAt.toDate(),
          usedAt: couponData.usedAt?.toDate(),
          orderIds: couponData.orderIds || []
        }

        // Check if coupon is already used
        if (coupon.isUsed) {
          return { valid: false, error: 'This coupon has already been used' }
        }

        // Check if coupon is expired
        if (coupon.expiresAt < new Date()) {
          return { valid: false, error: 'This coupon has expired' }
        }

        return { valid: true, coupon }
      } catch (firebaseError) {
        console.warn('Failed to validate coupon in Firebase, checking localStorage:', firebaseError)
      }
    }

    // Fallback to localStorage
    const existingCoupons = JSON.parse(localStorage.getItem('coupons') || '[]')
    const couponData = existingCoupons.find((c: Coupon) => c.code === code)

    if (!couponData) {
      return { valid: false, error: 'Invalid coupon code' }
    }

    const coupon: Coupon = {
      ...couponData,
      createdAt: new Date(couponData.createdAt),
      expiresAt: new Date(couponData.expiresAt),
      usedAt: couponData.usedAt ? new Date(couponData.usedAt) : undefined
    }

    // Check if coupon is already used
    if (coupon.isUsed) {
      return { valid: false, error: 'This coupon has already been used' }
    }

    // Check if coupon is expired
    if (coupon.expiresAt < new Date()) {
      return { valid: false, error: 'This coupon has expired' }
    }

    return { valid: true, coupon }
  } catch (error) {
    console.error('Error validating coupon:', error)
    return { valid: false, error: 'An error occurred while validating the coupon' }
  }
}