import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app"
import { getAuth, onAuthStateChanged, Auth, User } from "firebase/auth"
import { getFirestore, doc, setDoc, getDoc, Timestamp, Firestore } from "firebase/firestore"
import { getStorage, FirebaseStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:demo",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-DEMO",
}

// Check if Firebase is properly configured
const isFirebaseConfigured = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "your-firebase-api-key" &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== "your-project-id"

// Initialize Firebase only if properly configured
let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let storage: FirebaseStorage | null = null

if (isFirebaseConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)
  } catch (error) {
    console.warn("Firebase initialization failed:", error)
  }
}

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
export const onAuthStateChange = (callback: (user: User | null) => void) => {
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

export { app, auth, db, storage, isFirebaseConfigured }
