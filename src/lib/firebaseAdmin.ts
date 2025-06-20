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

// Lazy initialization
function getAdminAuth() {
  if (!adminAuth) {
    const { auth } = initializeFirebaseAdmin()
    adminAuth = auth
  }
  return adminAuth
}

function getAdminApp() {
  if (!adminApp) {
    const { app } = initializeFirebaseAdmin()
    adminApp = app
  }
  return adminApp
}

// Export the admin instances with lazy initialization
export { getAdminAuth as adminAuth, getAdminApp as adminApp }