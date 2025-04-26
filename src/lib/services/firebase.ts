import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getFirestore, doc, setDoc, getDoc, Timestamp } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

// Generate a local user ID instead of using anonymous authentication
export const getLocalUser = () => {
  // Check if we already have a local user ID in localStorage
  if (typeof window !== "undefined") {
    const localUserId = localStorage.getItem("localUserId")
    if (localUserId) {
      return {
        uid: localUserId,
        isAnonymous: true,
        isLocalFallback: true,
      }
    }

    // Generate a new local user ID
    const newLocalUserId = `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    localStorage.setItem("localUserId", newLocalUserId)

    return {
      uid: newLocalUserId,
      isAnonymous: true,
      isLocalFallback: true,
    }
  }

  // Fallback for SSR
  return {
    uid: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    isAnonymous: true,
    isLocalFallback: true,
  }
}

// Listen for auth state changes with local fallback
export const onAuthStateChange = (callback: (user: any) => void) => {
  // First check if there's a signed-in user
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      callback(user)
    } else {
      // If no user, use local fallback
      callback(getLocalUser())
    }
  })

  return unsubscribe
}

// Store verification status with fallback to localStorage
export const storeVerificationStatus = async (userId: string, isVerified: boolean, expiryDays = 30) => {
  try {
    // Only attempt to store in Firestore if it's not a local fallback user
    if (!userId.startsWith("local-")) {
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + expiryDays)

      await setDoc(doc(db, "verifications", userId), {
        verified: isVerified,
        timestamp: Timestamp.now(),
        expiryDate: Timestamp.fromDate(expiryDate),
      })
    }

    // Always store in localStorage as a fallback
    if (typeof window !== "undefined") {
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + expiryDays)

      localStorage.setItem("ageVerified", isVerified.toString())
      localStorage.setItem("ageVerifiedExpiry", expiryDate.toISOString())
    }

    return true
  } catch (error) {
    console.error("Error storing verification status:", error)

    // Fallback to localStorage
    if (typeof window !== "undefined") {
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + expiryDays)

      localStorage.setItem("ageVerified", isVerified.toString())
      localStorage.setItem("ageVerifiedExpiry", expiryDate.toISOString())
    }

    return true // Return true since we successfully stored in localStorage
  }
}

// Get verification status with fallback from localStorage
export const getVerificationStatus = async (userId: string) => {
  try {
    // Only attempt to get from Firestore if it's not a local fallback user
    if (!userId.startsWith("local-")) {
      const docRef = doc(db, "verifications", userId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        const now = new Date()
        const expiryDate = data.expiryDate.toDate()

        // Check if verification has expired
        if (now > expiryDate) {
          return false
        }

        return data.verified
      }
    }

    // Fallback to localStorage
    if (typeof window !== "undefined") {
      const verified = localStorage.getItem("ageVerified")
      const expiryStr = localStorage.getItem("ageVerifiedExpiry")

      if (verified && expiryStr) {
        const now = new Date()
        const expiryDate = new Date(expiryStr)

        // Check if verification has expired
        if (now > expiryDate) {
          return false
        }

        return verified === "true"
      }
    }

    return false
  } catch (error) {
    console.error("Error getting verification status:", error)

    // Fallback to localStorage
    if (typeof window !== "undefined") {
      const verified = localStorage.getItem("ageVerified")
      const expiryStr = localStorage.getItem("ageVerifiedExpiry")

      if (verified && expiryStr) {
        const now = new Date()
        const expiryDate = new Date(expiryStr)

        // Check if verification has expired
        if (now > expiryDate) {
          return false
        }

        return verified === "true"
      }
    }

    return false
  }
}

export { app, auth, db, storage }
