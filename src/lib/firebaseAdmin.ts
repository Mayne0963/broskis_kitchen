import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

// Initialize Firebase Admin SDK
let adminAuth: any = null
let adminApp: any = null

function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    return { auth: getAuth(), app: getApp() }
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  
  if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PROJECT_ID) {
    console.warn('Firebase Admin SDK configuration missing - some features may not work')
    return { auth: null, app: null }
  }

  try {
    const app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    })
    console.log('Firebase Admin SDK initialized successfully')
    return { auth: getAuth(app), app }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error)
    return { auth: null, app: null }
  }
}

// Remove lazy initialization functions
// Initialize immediately at module level
const { auth, app } = initializeFirebaseAdmin();

// Export functions that return the initialized instances
export const adminAuth = () => auth;
export const adminApp = () => app;