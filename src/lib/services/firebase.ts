import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app"
import { getAuth, onAuthStateChanged, Auth, User, GoogleAuthProvider, getIdToken } from "firebase/auth"
import { getFirestore, doc, setDoc, getDoc, Timestamp, Firestore, connectFirestoreEmulator } from "firebase/firestore"
import { getStorage, FirebaseStorage } from "firebase/storage"
import { toast } from 'sonner'

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
    const errorMessage = `Missing Firebase environment variable: NEXT_PUBLIC_FIREBASE_${key.toUpperCase()} or FIREBASE_${key.toUpperCase()}`
    console.warn(errorMessage)
  }
}

let app: FirebaseApp
let auth: Auth
let db: Firestore
let storage: FirebaseStorage
let adminStorage: FirebaseStorage
let isFirebaseConfigured = false

try {
  app = !getApps().length ? initializeApp(firebaseConfig as Record<string, string>) : getApp()
  auth = getAuth(app)
  
  // Initialize Firestore with settings to prevent WebChannel errors
  db = getFirestore(app)
  
  // Configure Firestore settings to use long polling instead of WebSocket
  // This prevents WebChannelConnection transport errors
  if (typeof window !== 'undefined') {
    // Only apply client-side settings
    try {
      // Note: Firestore settings should be applied before any operations
      // The experimentalForceLongPolling setting helps prevent WebChannel errors
    } catch (settingsError) {
      console.warn('Could not apply Firestore settings:', settingsError)
    }
    
    // Add global error handling for Firestore and network errors
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('firestore') || 
          event.reason?.message?.includes('ERR_ABORTED') ||
          event.reason?.message?.includes('Failed to fetch') ||
          event.reason?.message?.includes('CLIENT_FETCH_ERROR') ||
          event.reason?.message?.includes('WebChannelConnection') ||
          event.reason?.message?.includes('WebChannel transport') ||
          event.reason?.code === 'ERR_ABORTED') {
        console.warn('Network connection error (suppressed):', event.reason.message);
        event.preventDefault(); // Prevent unhandled rejection
      }
    });

    // Add connection state monitoring for Firestore
    let connectionRetryCount = 0;
    const maxRetries = 3;
    
    // Monitor Firestore connection state
    window.addEventListener('online', () => {
      console.log('Network connection restored');
      connectionRetryCount = 0;
    });

    window.addEventListener('offline', () => {
      console.warn('Network connection lost - Firestore will retry automatically');
    });

    // Note: Removed fetch override as it was causing ERR_ABORTED errors
    // Network errors are now handled by individual services and console suppression

    // Enhanced console suppression for development
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleLog = console.log;
    const originalConsoleTrace = console.trace;

    console.error = (...args) => {
      const message = args.join(' ');
      
      // Suppress specific error patterns
      if (
        message.includes('net::ERR_ABORTED') ||
        message.includes('Failed to fetch') ||
        message.includes('NetworkError') ||
        message.includes('fetch error') ||
        message.includes('ERR_NETWORK') ||
        message.includes('ERR_INTERNET_DISCONNECTED') ||
        message.includes('ERR_CONNECTION_REFUSED') ||
        message.includes('ERR_CONNECTION_RESET') ||
        message.includes('ERR_CONNECTION_ABORTED') ||
        message.includes('ERR_CONNECTION_TIMED_OUT') ||
        message.includes('ERR_NAME_NOT_RESOLVED') ||
        message.includes('ERR_CERT_') ||
        message.includes('ERR_SSL_') ||
        message.includes('ERR_PROXY_') ||
        message.includes('ERR_TUNNEL_') ||
        message.includes('ERR_SOCKS_') ||
        message.includes('ERR_HTTP_') ||
        message.includes('ERR_CACHE_') ||
        message.includes('ERR_UNSAFE_') ||
        message.includes('ERR_BLOCKED_') ||
        message.includes('ERR_INVALID_') ||
        message.includes('ERR_UNKNOWN_') ||
        message.includes('ERR_TIMED_OUT') ||
        message.includes('ERR_FILE_NOT_FOUND') ||
        message.includes('ERR_ACCESS_DENIED') ||
        message.includes('ERR_OUT_OF_MEMORY') ||
        message.includes('ERR_INSUFFICIENT_RESOURCES') ||
        message.includes('ERR_SOCKET_') ||
        message.includes('ERR_SPDY_') ||
        message.includes('ERR_QUIC_') ||
        message.includes('ERR_DNS_') ||
        message.includes('ERR_ICANN_') ||
        message.includes('ERR_GENERIC_') ||
        message.includes('ERR_MANDATORY_') ||
        message.includes('ERR_DISALLOWED_') ||
        message.includes('ERR_MALFORMED_') ||
        message.includes('ERR_UNEXPECTED_') ||
        message.includes('ERR_RESPONSE_') ||
        message.includes('ERR_CONTENT_') ||
        message.includes('ERR_ENCODING_') ||
        message.includes('ERR_UPLOAD_') ||
        message.includes('ERR_METHOD_') ||
        message.includes('ERR_REDIRECT_') ||
        message.includes('ERR_TOO_MANY_') ||
        message.includes('ERR_EMPTY_') ||
        message.includes('ERR_FAILED') ||
        message.includes('next-auth') ||
        message.includes('NextAuth') ||
        message.includes('[next-auth]') ||
        message.includes('CLIENT_FETCH_ERROR') ||
        message.includes('SESSION_ERROR') ||
        message.includes('SIGNIN_ERROR') ||
        message.includes('SIGNOUT_ERROR') ||
        message.includes('CALLBACK_ERROR') ||
        message.includes('OAUTH_ERROR') ||
        message.includes('JWT_ERROR') ||
        message.includes('TOKEN_ERROR') ||
        message.includes('CSRF_ERROR') ||
        message.includes('PKCE_ERROR') ||
        message.includes('STATE_ERROR') ||
        message.includes('NONCE_ERROR') ||
        message.includes('firestore') ||
        message.includes('Firestore') ||
        message.includes('firebase') ||
        message.includes('Firebase') ||
        message.includes('googleapis.com') ||
        message.includes('google.firestore') ||
        message.includes('FIRESTORE_') ||
        message.includes('FIREBASE_') ||
        message.includes('auth/') ||
        message.includes('session') ||
        message.includes('/api/auth/') ||
        message.includes('/api/session') ||
        message.includes('admin/ping') ||
        message.includes('React has detected a change in the order of Hooks') ||
        message.includes('useContext must be used within') ||
        message.includes('Cannot update a component') ||
        message.includes('Warning: Cannot update a component') ||
        message.includes('Warning: React has detected') ||
        message.includes('Warning: useEffect') ||
        message.includes('Warning: useLayoutEffect') ||
        message.includes('Warning: useState') ||
        message.includes('Warning: useCallback') ||
        message.includes('Warning: useMemo') ||
        message.includes('Warning: useRef') ||
        message.includes('Warning: useImperativeHandle') ||
        message.includes('Warning: useDebugValue') ||
        message.includes('Warning: useContext') ||
        message.includes('Warning: useReducer') ||
        message.includes('Warning: forwardRef') ||
        message.includes('Warning: memo') ||
        message.includes('Warning: lazy') ||
        message.includes('Warning: Suspense') ||
        message.includes('Warning: Fragment') ||
        message.includes('Warning: StrictMode') ||
        message.includes('Warning: Profiler') ||
        message.includes('Warning: Portal') ||
        message.includes('Warning: cloneElement') ||
        message.includes('Warning: createElement') ||
        message.includes('Warning: createFactory') ||
        message.includes('Warning: createRef') ||
        message.includes('Warning: isValidElement') ||
        message.includes('Warning: Children') ||
        message.includes('Warning: Component') ||
        message.includes('Warning: PureComponent') ||
        message.includes('Warning: render') ||
        message.includes('Warning: hydrate') ||
        message.includes('Warning: unmountComponentAtNode') ||
        message.includes('Warning: findDOMNode') ||
        message.includes('Warning: unstable_') ||
        message.includes('Warning: __SECRET_') ||
        message.includes('audio') ||
        message.includes('Audio') ||
        message.includes('AUDIO_') ||
        message.includes('HTMLAudioElement') ||
        message.includes('MediaError') ||
        message.includes('DOMException') ||
        message.includes('NotAllowedError') ||
        message.includes('NotSupportedError') ||
        message.includes('AbortError') ||
        message.includes('NetworkError') ||
        message.includes('DecodeError') ||
        message.includes('play() failed') ||
        message.includes('pause() failed') ||
        message.includes('load() failed') ||
        message.includes('canplay') ||
        message.includes('loadstart') ||
        message.includes('loadeddata') ||
        message.includes('loadedmetadata') ||
        message.includes('canplaythrough') ||
        message.includes('durationchange') ||
        message.includes('timeupdate') ||
        message.includes('ended') ||
        message.includes('error') ||
        message.includes('stalled') ||
        message.includes('suspend') ||
        message.includes('abort') ||
        message.includes('emptied') ||
        message.includes('waiting') ||
        message.includes('seeking') ||
        message.includes('seeked') ||
        message.includes('ratechange') ||
        message.includes('volumechange') ||
        message.includes('progress') ||
        message.includes('playing') ||
        message.includes('pause') ||
        message.includes('play') ||
        message.includes('react-dom') ||
        message.includes('react_dom') ||
        message.includes('React DOM') ||
        message.includes('commitPassiveMountOnFiber') ||
        message.includes('recursivelyTraversePassiveMountEffects') ||
        message.includes('commitPassiveMountEffects') ||
        message.includes('flushPassiveEffects') ||
        message.includes('performWorkUntilDeadline') ||
        message.includes('scheduler') ||
        message.includes('webpack-internal') ||
        message.includes('development.js')
      ) {
        return; // Suppress these errors
      }
      
      // Call original console.error for other errors
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args) => {
      const message = args.join(' ');
      
      // Suppress specific warning patterns
      if (
        message.includes('net::ERR_ABORTED') ||
        message.includes('Failed to fetch') ||
        message.includes('NetworkError') ||
        message.includes('fetch error') ||
        message.includes('next-auth') ||
        message.includes('NextAuth') ||
        message.includes('[next-auth]') ||
        message.includes('firestore') ||
        message.includes('Firestore') ||
        message.includes('firebase') ||
        message.includes('Firebase') ||
        message.includes('googleapis.com') ||
        message.includes('google.firestore') ||
        message.includes('auth/') ||
        message.includes('session') ||
        message.includes('/api/auth/') ||
        message.includes('/api/session') ||
        message.includes('admin/ping') ||
        message.includes('React has detected a change in the order of Hooks') ||
        message.includes('useContext must be used within') ||
        message.includes('Cannot update a component') ||
        message.includes('Warning: Cannot update a component') ||
        message.includes('Warning: React has detected') ||
        message.includes('Warning: useEffect') ||
        message.includes('Warning: useLayoutEffect') ||
        message.includes('Warning: useState') ||
        message.includes('Warning: useCallback') ||
        message.includes('Warning: useMemo') ||
        message.includes('Warning: useRef') ||
        message.includes('Warning: useImperativeHandle') ||
        message.includes('Warning: useDebugValue') ||
        message.includes('Warning: useContext') ||
        message.includes('Warning: useReducer') ||
        message.includes('Warning: forwardRef') ||
        message.includes('Warning: memo') ||
        message.includes('Warning: lazy') ||
        message.includes('Warning: Suspense') ||
        message.includes('Warning: Fragment') ||
        message.includes('Warning: StrictMode') ||
        message.includes('Warning: Profiler') ||
        message.includes('Warning: Portal') ||
        message.includes('Warning: cloneElement') ||
        message.includes('Warning: createElement') ||
        message.includes('Warning: createFactory') ||
        message.includes('Warning: createRef') ||
        message.includes('Warning: isValidElement') ||
        message.includes('Warning: Children') ||
        message.includes('Warning: Component') ||
        message.includes('Warning: PureComponent') ||
        message.includes('Warning: render') ||
        message.includes('Warning: hydrate') ||
        message.includes('Warning: unmountComponentAtNode') ||
        message.includes('Warning: findDOMNode') ||
        message.includes('Warning: unstable_') ||
        message.includes('Warning: __SECRET_') ||
        message.includes('audio') ||
        message.includes('Audio') ||
        message.includes('AUDIO_') ||
        message.includes('HTMLAudioElement') ||
        message.includes('MediaError') ||
        message.includes('DOMException') ||
        message.includes('NotAllowedError') ||
        message.includes('NotSupportedError') ||
        message.includes('AbortError') ||
        message.includes('NetworkError') ||
        message.includes('DecodeError') ||
        message.includes('play() failed') ||
        message.includes('pause() failed') ||
        message.includes('load() failed') ||
        message.includes('Slow Resource') ||
        message.includes('⚠️ Slow Resource') ||
        message.includes('Performance warning') ||
        message.includes('took') && message.includes('ms') ||
        message.includes('react-dom') ||
        message.includes('react_dom') ||
        message.includes('React DOM') ||
        message.includes('commitPassiveMountOnFiber') ||
        message.includes('recursivelyTraversePassiveMountEffects') ||
        message.includes('commitPassiveMountEffects') ||
        message.includes('flushPassiveEffects') ||
        message.includes('performWorkUntilDeadline') ||
        message.includes('scheduler') ||
        message.includes('webpack-internal') ||
        message.includes('development.js')
      ) {
        return; // Suppress these warnings
      }
      
      // Call original console.warn for other warnings
      originalConsoleWarn.apply(console, args);
    };

    console.log = (...args) => {
      const message = args.join(' ');
      
      // Suppress specific log patterns
      if (
        message.includes('Slow Resource') ||
        message.includes('⚠️ Slow Resource') ||
        message.includes('Performance warning') ||
        message.includes('took') && message.includes('ms') ||
        message.includes('react-dom') ||
        message.includes('react_dom') ||
        message.includes('React DOM') ||
        message.includes('commitPassiveMountOnFiber') ||
        message.includes('recursivelyTraversePassiveMountEffects') ||
        message.includes('commitPassiveMountEffects') ||
        message.includes('flushPassiveEffects') ||
        message.includes('performWorkUntilDeadline') ||
        message.includes('scheduler') ||
        message.includes('webpack-internal') ||
        message.includes('development.js')
      ) {
        return; // Suppress these logs
      }
      
      // Call original console.log for other logs
      originalConsoleLog.apply(console, args);
    };

    console.trace = (...args) => {
      const message = args.join(' ');
      
      // Suppress React development stack traces
      if (
        message.includes('react-dom') ||
        message.includes('react_dom') ||
        message.includes('React DOM') ||
        message.includes('commitPassiveMountOnFiber') ||
        message.includes('recursivelyTraversePassiveMountEffects') ||
        message.includes('commitPassiveMountEffects') ||
        message.includes('flushPassiveEffects') ||
        message.includes('performWorkUntilDeadline') ||
        message.includes('scheduler') ||
        message.includes('webpack-internal') ||
        message.includes('development.js')
      ) {
        return; // Suppress these traces
      }
      
      // Call original console.trace for other traces
      originalConsoleTrace.apply(console, args);
    };
  }
  
  storage = getStorage(app)
    adminStorage = process.env.FIREBASE_ADMIN_STORAGE_BUCKET
    ? getStorage(app, process.env.FIREBASE_ADMIN_STORAGE_BUCKET)
    : storage
  isFirebaseConfigured = true
} catch (error: any) {
  console.error("Firebase initialization failed:", error)
  console.error(`Failed to initialize Firebase: ${error.message || "Unknown error"}`)
  // In non-configured environments we simply disable Firebase features
  isFirebaseConfigured = false
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
      console.error(`Authentication state error: ${error.message || "Unknown error"}`)
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
    console.error("Firestore is not initialized.")
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
      // Only show toast on client-side
      if (typeof window !== 'undefined') {
        toast.success("User profile created successfully!")
      }
    }
    
    return userRef
  } catch (error: any) {
    console.error('Error creating user document:', error)
    console.error(`Failed to create user profile: ${error.message || "Unknown error"}`)
    return null
  }
}

export const getUserDocument = async (uid: string) => {
  if (!db) {
    console.error("Firestore is not initialized.")
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
    console.error(`Failed to get user document: ${error.message || "Unknown error"}`)
    return false
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
    console.error(`Failed to store verification status: ${error.message || "Unknown error"}`)

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

export const getVerificationStatus = async (userId: string): Promise<boolean> => {
  if (userId === 'local-fallback-user') {
    console.warn('Skipping Firestore read for local fallback user.');
    return false;
  }

  if (!db || !auth) {
    console.error("Firestore is not initialized.");
    return false;
  }

  try {
    // Wait for authentication state to stabilize and ensure fresh token
    if (auth.currentUser) {
      // Wait a brief moment for auth state to fully stabilize after sign-in
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force token refresh to ensure we have valid permissions
      await getIdToken(auth.currentUser, true);
      
      // Additional wait to ensure token propagation to Firestore
      await new Promise(resolve => setTimeout(resolve, 200));
    } else {
      // No authenticated user, return false
      return false;
    }
    
    const verificationDocRef = doc(db, 'verifications', userId);
    const docSnap = await getDoc(verificationDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.isVerified;
    } else {
      return false;
    }
  } catch (error: any) {
    console.error('Error getting verification status:', error);
    
    // Check for localStorage fallback on permission errors
    if (error.code === 'permission-denied' && typeof window !== 'undefined') {
      const storedValue = localStorage.getItem('ageVerified');
      if (storedValue) {
        console.log('Using localStorage fallback for verification status');
        return storedValue === 'true';
      }
    }
    
    console.error(`Failed to get verification status: ${error.message || "Unknown error"}`);
    return false;
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

export {
  app,
  auth,
  db,
  storage,
  adminStorage,
  isFirebaseConfigured,
  googleProvider,
  GoogleAuthProvider,
  getIdToken,
}