import { db, isFirebaseConfigured } from './firebase'
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp
} from 'firebase/firestore'

export interface MenuDrop {
  id: string
  name: string
  description: string
  image?: string
  price: number
  availableQuantity: number
  totalQuantity: number
  status: 'active' | 'scheduled' | 'ended' | 'cancelled'
  createdAt: Date
  updatedAt?: Date
  endsAt?: Date
  scheduledFor?: Date
  createdBy: string
  revenue?: number
  soldQuantity?: number
}

const MENU_DROPS_COLLECTION = 'menuDrops'



/**
 * Create a new menu drop
 */
export const createMenuDrop = async (dropData: Omit<MenuDrop, 'id' | 'createdAt' | 'updatedAt'>): Promise<MenuDrop> => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase not configured')
  }

  try {
    const docRef = await addDoc(collection(db, MENU_DROPS_COLLECTION), {
      ...dropData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    
    return {
      ...dropData,
      id: docRef.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  } catch (error) {
    console.error('Failed to create menu drop in Firebase:', error)
    throw error
  }
}

/**
 * Get all menu drops
 */
export const getAllMenuDrops = async (): Promise<MenuDrop[]> => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase not configured')
  }

  try {
    const q = query(
      collection(db, MENU_DROPS_COLLECTION),
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    const menuDrops: MenuDrop[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      menuDrops.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        endsAt: data.endsAt?.toDate(),
        scheduledFor: data.scheduledFor?.toDate()
      } as MenuDrop)
    })
    
    return menuDrops
  } catch (error) {
    console.error('Failed to get menu drops from Firebase:', error)
    return []
  }
}

/**
 * Get menu drops by status
 */
export const getMenuDropsByStatus = async (status: string): Promise<MenuDrop[]> => {
  const allDrops = await getAllMenuDrops()
  
  return allDrops.filter(drop => {
    if (status === 'active') {
      return drop.status === 'active' && (!drop.endsAt || drop.endsAt > new Date())
    }
    if (status === 'scheduled') {
      return drop.status === 'scheduled'
    }
    if (status === 'expired') {
      return drop.status === 'active' && drop.endsAt && drop.endsAt <= new Date()
    }
    return drop.status === status
  })
}

/**
 * Get menu drop by ID
 */
export const getMenuDropById = async (dropId: string): Promise<MenuDrop | null> => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase not configured')
  }

  try {
    const q = query(
      collection(db, MENU_DROPS_COLLECTION),
      where('__name__', '==', dropId)
    )
    
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        endsAt: data.endsAt?.toDate(),
        scheduledFor: data.scheduledFor?.toDate()
      } as MenuDrop
    }
    
    return null
  } catch (error) {
    console.error('Failed to get menu drop from Firebase:', error)
    return null
  }
}

/**
 * Update menu drop
 */
export const updateMenuDrop = async (dropId: string, updateData: Partial<MenuDrop>): Promise<MenuDrop | null> => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase not configured')
  }

  try {
    const docRef = doc(db, MENU_DROPS_COLLECTION, dropId)
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: Timestamp.now()
    })
    
    return await getMenuDropById(dropId)
  } catch (error) {
    console.error('Failed to update menu drop in Firebase:', error)
    return null
  }
}

/**
 * Delete menu drop
 */
export const deleteMenuDrop = async (dropId: string): Promise<boolean> => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase not configured')
  }

  try {
    const docRef = doc(db, MENU_DROPS_COLLECTION, dropId)
    await deleteDoc(docRef)
    return true
  } catch (error) {
    console.error('Failed to delete menu drop from Firebase:', error)
    return false
  }
}

/**
 * Update menu drop quantity (when items are sold)
 */
export const updateMenuDropQuantity = async (dropId: string, quantitySold: number): Promise<MenuDrop | null> => {
  const drop = await getMenuDropById(dropId)
  if (!drop) return null
  
  const newSoldQuantity = (drop.soldQuantity || 0) + quantitySold
  const newAvailableQuantity = Math.max(0, drop.totalQuantity - newSoldQuantity)
  const newRevenue = (drop.revenue || 0) + (quantitySold * drop.price)
  
  return await updateMenuDrop(dropId, {
    soldQuantity: newSoldQuantity,
    availableQuantity: newAvailableQuantity,
    revenue: newRevenue,
    status: newAvailableQuantity === 0 ? 'ended' : drop.status
  })
}