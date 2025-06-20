import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app"
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app"
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app"
import { getAuth, onAuthStateChanged, Auth, User, GoogleAuthProvider } from "firebase/auth"
import { getFirestore, doc, setDoc, getDoc, Timestamp, Firestore } from "firebase/firestore"
import { getStorage, FirebaseStorage } from "firebase/storage"
import { toast } from "sonner"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Validate Firebase environment variables at runtime
const requiredConfigKeys = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
]

for (const key of requiredConfigKeys) {
  if (!firebaseConfig[key as keyof typeof firebaseConfig]) {
    const errorMessage = `Missing Firebase environment variable: NEXT_PUBLIC_FIREBASE_${key.toUpperCase()}`
    toast.error(errorMessage)
    throw new Error(errorMessage)
  }
}

let app: FirebaseApp
let auth: Auth
let db: Firestore
let storage: FirebaseStorage

try {
  app = !getApps().length ? initializeApp(firebaseConfig as Record<string, string>) : getApp()
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)
} catch (error: any) {
  console.error("Firebase initialization failed:", error)
  toast.error(`Failed to initialize Firebase: ${error.message || "Unknown error"}`)
  throw new Error("Failed to initialize Firebase. Check your environment variables and network connection.")
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
  if (!auth) {
    // If Firebase is not configured, use local fallback
    callback(getLocalUser() as unknown as User | null)
    return () => {} // Return empty unsubscribe function
  }
  
  // First check if there's a signed-in user
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    try {
      if (user) {
        callback(user)
      } else {
        // If no user, use local fallback
        callback(getLocalUser() as unknown as User | null)
      }
    } catch (error: any) {
      console.error('Error in onAuthStateChanged callback:', error)
      toast.error(`Authentication state error: ${error.message || "Unknown error"}`)
      callback(null) // Ensure callback is called even on error
    }
  })

  return unsubscribe
}

export const onAuthStateChangedWrapper = (callback: (user: User | null) => void) => {
  if (auth) {
    return onAuthStateChanged(auth, callback)
  }
  // If Firebase is not configured, call callback with null immediately
  callback(null)
  return () => {} // Return empty unsubscribe function
}

export const createUserDocument = async (user: { uid: string; email?: string; displayName?: string; }) => {
  if (!db) {
    toast.error("Firestore is not initialized.")
    return null
  }
  
  try {
    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || null,
        displayName: user.displayName || null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
      toast.success("User profile created successfully!")
    }
    
    return userRef
  } catch (error: any) {
    console.error('Error creating user document:', error)
    toast.error(`Failed to create user profile: ${error.message || "Unknown error"}`)
    return null
  }
}

export const getUserDocument = async (uid: string) => {
  if (!db) {
    toast.error("Firestore is not initialized.")
    return null
  }
  
  try {
    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)
    
    if (userSnap.exists()) {
      return userSnap.data()
    }
    
    return null
  } catch (error: any) {
    console.error('Error getting user document:', error)
    toast.error(`Failed to get user document: ${error.message || "Unknown error"}`)
    return null
  }
}

// Store verification status with fallback to localStorage
export const storeVerificationStatus = async (userId: string, isVerified: boolean, expiryDays = 30) => {
  try {
    // Only attempt to store in Firestore if it's not a local fallback user
    if (!userId.startsWith("local-")) {
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + expiryDays)

      if (!db) {
        throw new Error('Firestore is not configured')
      }
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
  } catch (error: any) {
    console.error("Error storing verification status:", error)
    toast.error(`Failed to store verification status: ${error.message || "Unknown error"}`)

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

export const getVerificationStatus = async (userId: string): Promise<boolean | null> => {
  if (userId === 'local-fallback-user') {
    console.warn('Skipping Firestore read for local fallback user.')
    return null
  }

  if (!db) {
    toast.error("Firestore is not initialized.")
    return null
  }

  try {
    const verificationDocRef = doc(db, 'verifications', userId)
    const docSnap = await getDoc(verificationDocRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      return data.isVerified
    } else {
      return null
    }
  } catch (error: any) {
    console.error('Error getting verification status:', error)
    toast.error(`Failed to get verification status: ${error.message || "Unknown error"}`)
    return null
  }
}

// Configure Google Auth Provider
let googleProvider: GoogleAuthProvider | null = null
if (isFirebaseConfigured && auth) {
  googleProvider = new GoogleAuthProvider()
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  })
}

export { app, auth, db, storage, isFirebaseConfigured, googleProvider }
