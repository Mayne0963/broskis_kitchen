import { doc, getDoc, updateDoc, DocumentData, Timestamp } from "firebase/firestore"
import { db } from "./firebase"

export interface UserProfile extends DocumentData {
  uid: string;
  displayName: string;
  email: string;
  plan: string;
  createdAt: Timestamp;
  avatarUrl?: string;
  updatedAt?: Date;
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!db) {
    console.error("Firestore DB is not initialized.")
    return null
  }
  try {
    const userRef = doc(db, "users", uid)
    const docSnap = await getDoc(userRef)

    if (docSnap.exists()) {
      return { uid, ...docSnap.data() } as UserProfile
    } else {
      console.log("No such user document!")
      return null
    }
  } catch (error) {
    console.error("Error getting user profile:", error)
    return null
  }
}

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  if (!db) {
    console.error("Firestore DB is not initialized.")
    return
  }
  try {
    const userRef = doc(db, "users", uid)
    await updateDoc(userRef, { ...data, updatedAt: new Date() })
    console.log("User profile updated successfully!")
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw error
  }
}