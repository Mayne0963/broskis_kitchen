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

// Mock data fallback
const mockMenuDrops: MenuDrop[] = [
  {
    id: '1',
    name: 'Truffle Mac & Cheese Drop',
    description: 'Limited edition truffle-infused mac & cheese with aged gruyere',
    image: '/images/truffle-fries.jpg',
    price: 18.99,
    availableQuantity: 25,
    totalQuantity: 50,
    status: 'active',
    createdAt: new Date(),
    endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    createdBy: 'admin',
    revenue: 474.75,
    soldQuantity: 25
  },
  {
    id: '2',
    name: 'Wagyu Slider Trio',
    description: 'Three premium wagyu sliders with house-made sauces',
    image: '/images/wagyu-sandwich.jpg',
    price: 24.99,
    availableQuantity: 12,
    totalQuantity: 30,
    status: 'active',
    createdAt: new Date(),
    endsAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
    createdBy: 'admin',
    revenue: 449.82,
    soldQuantity: 18
  },
  {
    id: '3',
    name: 'Infused Brownie Bites',
    description: 'Premium cannabis-infused chocolate brownies (21+ only)',
    image: '/images/infused-brownie.jpg',
    price: 15.99,
    availableQuantity: 0,
    totalQuantity: 20,
    status: 'scheduled',
    createdAt: new Date(),
    scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdBy: 'admin',
    revenue: 0,
    soldQuantity: 0
  }
]

/**
 * Create a new menu drop
 */
export const createMenuDrop = async (dropData: Omit<MenuDrop, 'id' | 'createdAt' | 'updatedAt'>): Promise<MenuDrop> => {
  try {
    if (isFirebaseConfigured && db) {
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
    }
  } catch (error) {
    console.warn('Failed to create menu drop in Firebase:', error)
  }
  
  // Fallback to mock data
  const newDrop: MenuDrop = {
    ...dropData,
    id: Date.now().toString(),
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  mockMenuDrops.push(newDrop)
  return newDrop
}

/**
 * Get all menu drops
 */
export const getAllMenuDrops = async (): Promise<MenuDrop[]> => {
  try {
    if (isFirebaseConfigured && db) {
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
    }
  } catch (error) {
    console.warn('Failed to get menu drops from Firebase:', error)
  }
  
  // Fallback to mock data
  return mockMenuDrops
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
  try {
    if (isFirebaseConfigured && db) {
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
    }
  } catch (error) {
    console.warn('Failed to get menu drop from Firebase:', error)
  }
  
  // Fallback to mock data
  return mockMenuDrops.find(drop => drop.id === dropId) || null
}

/**
 * Update menu drop
 */
export const updateMenuDrop = async (dropId: string, updateData: Partial<MenuDrop>): Promise<MenuDrop | null> => {
  try {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, MENU_DROPS_COLLECTION, dropId)
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: Timestamp.now()
      })
      
      return await getMenuDropById(dropId)
    }
  } catch (error) {
    console.warn('Failed to update menu drop in Firebase:', error)
  }
  
  // Fallback to mock data
  const dropIndex = mockMenuDrops.findIndex(drop => drop.id === dropId)
  if (dropIndex !== -1) {
    mockMenuDrops[dropIndex] = {
      ...mockMenuDrops[dropIndex],
      ...updateData,
      updatedAt: new Date()
    }
    return mockMenuDrops[dropIndex]
  }
  
  return null
}

/**
 * Delete menu drop
 */
export const deleteMenuDrop = async (dropId: string): Promise<boolean> => {
  try {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, MENU_DROPS_COLLECTION, dropId)
      await deleteDoc(docRef)
      return true
    }
  } catch (error) {
    console.warn('Failed to delete menu drop from Firebase:', error)
  }
  
  // Fallback to mock data
  const dropIndex = mockMenuDrops.findIndex(drop => drop.id === dropId)
  if (dropIndex !== -1) {
    mockMenuDrops.splice(dropIndex, 1)
    return true
  }
  
  return false
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