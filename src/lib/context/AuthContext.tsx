"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { auth, db, googleProvider } from "../services/firebase"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  updateProfile,
  getIdToken,
  getIdTokenResult,
  signInWithPopup,
} from "firebase/auth"
import { doc, setDoc, getDoc, updateDoc, Timestamp } from "firebase/firestore"
import { toast } from "sonner"
import type { User, AuthContextType } from "@/types"
import type { Claims } from "@/types/auth"
import { performBackgroundRefresh } from "../session/exp"
import { safeFetch } from "../utils/safeFetch"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    // Return default values during build time or when outside provider
    return {
      user: null,
      claims: {},
      isLoading: false,
      isAuthenticated: false,
      login: async () => false,
      signup: async () => false,
      logout: async () => {},
      signInWithGoogle: async () => false,
      resetPassword: async () => false,
      sendVerificationEmail: async () => false,
      resendEmailVerification: async () => false
    }
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [claims, setClaims] = useState<Claims>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (!auth) {
      console.warn("Firebase auth not configured - authentication disabled")
      setIsLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Create basic user object immediately for faster UI response
          const basicUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || '',
            email: firebaseUser.email || '',
            role: 'customer', // Default role, will be updated with claims
            emailVerified: firebaseUser.emailVerified,
          }
          setUser(basicUser)
          setIsAuthenticated(true)
          setIsLoading(false) // Set loading to false immediately for faster UI

          // Get custom claims asynchronously without blocking UI
          const tokenResult = await firebaseUser.getIdTokenResult(false) // Use cached token first
          const userClaims = (tokenResult.claims ?? {}) as Claims
          setClaims(userClaims)
          
          // Update user role if different from claims
          if (userClaims.role && userClaims.role !== basicUser.role) {
            setUser(prev => prev ? { ...prev, role: userClaims.role || 'customer' } : null)
          }

          // Get user document from Firestore in background (non-blocking)
          getDoc(doc(db, 'users', firebaseUser.uid)).then(userDoc => {
            if (userDoc.exists()) {
              const userData = userDoc.data()
              setUser(prev => prev ? {
                ...prev,
                name: userData.name || prev.name,
                role: userClaims.role || userData.role || prev.role,
              } : null)
            }
          }).catch(error => {
            console.error('Error fetching user document (non-blocking):', error)
            // Don't update loading state since this is background operation
          })
          
        } catch (error) {
          console.error('Error in auth state change:', error)
          // Still set basic user object even if claims fail
          const basicUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || '',
            email: firebaseUser.email || '',
            role: 'customer',
            emailVerified: firebaseUser.emailVerified,
          }
          setUser(basicUser)
          setIsAuthenticated(true)
          setClaims({})
          setIsLoading(false)
        }
      } else {
        setUser(null)
        setClaims({})
        setIsAuthenticated(false)
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    setIsAuthenticated(!!user)
  }, [user])

  const login = async (email: string, password: string): Promise<boolean> => {
    if (!auth || !db) {
      toast.error("Firebase not configured - login disabled")
      return false
    }
    try {
      setIsLoading(true)
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      
      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        toast.error("Please verify your email address before signing in. Check your inbox for a verification link.")
        // Don't sign out, let them verify their email
        return false
      }
      
      // Force ID token refresh to get latest custom claims
      const idToken = await getIdToken(userCredential.user, true)
      
      // Create session cookie
      const response = await safeFetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ idToken }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create session')
      }
      
      toast.success("Welcome back to Broski's Kitchen!")
      return true
    } catch (error: unknown) {
      console.error("Login error:", error)
      let errorMessage = "An unexpected error occurred."
      
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      // Handle specific Firebase Auth errors
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const firebaseError = error as { code: string }
        switch (firebaseError.code) {
          case 'auth/user-not-found':
            errorMessage = "No account found with this email address."
            break
          case 'auth/wrong-password':
            errorMessage = "Incorrect password. Please try again."
            break
          case 'auth/invalid-email':
            errorMessage = "Please enter a valid email address."
            break
          case 'auth/user-disabled':
            errorMessage = "This account has been disabled. Please contact support."
            break
          case 'auth/too-many-requests':
            errorMessage = "Too many failed login attempts. Please try again later."
            break
          case 'auth/network-request-failed':
            errorMessage = "Network error. Please check your connection and try again."
            break
          default:
            errorMessage = "Login failed. Please try again."
        }
      }
      
      toast.error(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (email: string, password: string, displayName?: string): Promise<boolean> => {
    if (!auth || !db) {
      toast.error("Firebase not configured - signup disabled")
      return false
    }
    try {
      setIsLoading(true)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update profile with display name if provided
      if (displayName) {
        await updateProfile(userCredential.user, { displayName })
      }
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: displayName || '',
        email: email,
        role: 'customer',
        createdAt: Timestamp.now(),
        emailVerified: false,
      })
      
      // Send email verification
      await sendEmailVerification(userCredential.user)
      
      toast.success("Account created! Please check your email to verify your account before signing in.")
      return true
    } catch (error: unknown) {
      console.error("Signup error:", error)
      let errorMessage = "An unexpected error occurred."
      
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      // Handle specific Firebase Auth errors
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const firebaseError = error as { code: string }
        switch (firebaseError.code) {
          case 'auth/email-already-in-use':
            errorMessage = "An account with this email already exists."
            break
          case 'auth/invalid-email':
            errorMessage = "Please enter a valid email address."
            break
          case 'auth/operation-not-allowed':
            errorMessage = "Email/password accounts are not enabled."
            break
          case 'auth/weak-password':
            errorMessage = "Password is too weak. Please choose a stronger password."
            break
          case 'auth/network-request-failed':
            errorMessage = "Network error. Please check your connection and try again."
            break
          default:
            errorMessage = "Account creation failed. Please try again."
        }
      }
      
      toast.error(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithGoogle = async (): Promise<boolean> => {
    if (!auth || !db) {
      toast.error("Firebase not configured - Google sign-in disabled")
      return false
    }
    try {
      setIsLoading(true)
      const result = await signInWithPopup(auth, googleProvider)
      
      // Check if this is a new user and create/update their document
      const userDoc = await getDoc(doc(db, 'users', result.user.uid))
      
      if (!userDoc.exists()) {
        // Create new user document
        await setDoc(doc(db, 'users', result.user.uid), {
          name: result.user.displayName || '',
          email: result.user.email || '',
          role: 'customer',
          createdAt: Timestamp.now(),
          emailVerified: result.user.emailVerified,
        })
      } else {
        // Update existing user document with latest info
        await updateDoc(doc(db, 'users', result.user.uid), {
          name: result.user.displayName || '',
          emailVerified: result.user.emailVerified,
        })
      }
      
      // Force ID token refresh to get latest custom claims
      const idToken = await getIdToken(result.user, true)
      
      // Create session cookie
      const response = await safeFetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ idToken }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create session')
      }
      
      toast.success("Welcome to Broski's Kitchen!")
      return true
    } catch (error: unknown) {
      console.error("Google sign-in error:", error)
      let errorMessage = "Google sign-in failed. Please try again."
      
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      // Handle specific Firebase Auth errors
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const firebaseError = error as { code: string }
        switch (firebaseError.code) {
          case 'auth/popup-closed-by-user':
            errorMessage = "Sign-in was cancelled."
            break
          case 'auth/popup-blocked':
            errorMessage = "Pop-up was blocked. Please allow pop-ups and try again."
            break
          case 'auth/network-request-failed':
            errorMessage = "Network error. Please check your connection and try again."
            break
          case 'auth/account-exists-with-different-credential':
            errorMessage = "An account already exists with this email using a different sign-in method."
            break
          default:
            errorMessage = "Google sign-in failed. Please try again."
        }
      }
      
      toast.error(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    if (!auth) {
      console.warn("Firebase auth not configured - logout disabled")
      return
    }
    try {
      // Clear session cookie first
      await safeFetch('/api/session', {
        method: 'DELETE',
        credentials: 'include',
      })
      
      // Then sign out from Firebase
      await signOut(auth)
      
      toast.success("You've been signed out successfully.")
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Error signing out. Please try again.")
    }
  }

  const resetPassword = async (email: string): Promise<boolean> => {
    if (!auth) {
      toast.error("Firebase not configured - password reset disabled")
      return false
    }
    try {
      await sendPasswordResetEmail(auth, email)
      toast.success("Password reset email sent! Check your inbox.")
      return true
    } catch (error: unknown) {
      console.error("Password reset error:", error)
      let errorMessage = "Failed to send password reset email."
      
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const firebaseError = error as { code: string }
        switch (firebaseError.code) {
          case 'auth/user-not-found':
            errorMessage = "No account found with this email address."
            break
          case 'auth/invalid-email':
            errorMessage = "Please enter a valid email address."
            break
          case 'auth/network-request-failed':
            errorMessage = "Network error. Please check your connection and try again."
            break
          default:
            errorMessage = "Failed to send password reset email. Please try again."
        }
      }
      
      toast.error(errorMessage)
      return false
    }
  }

  const resendEmailVerification = async (): Promise<boolean> => {
    if (!auth?.currentUser) {
      toast.error("No user signed in")
      return false
    }
    try {
      await sendEmailVerification(auth.currentUser)
      toast.success("Verification email sent! Check your inbox.")
      return true
    } catch (error: unknown) {
      console.error("Email verification error:", error)
      let errorMessage = "Failed to send verification email."
      
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const firebaseError = error as { code: string }
        switch (firebaseError.code) {
          case 'auth/too-many-requests':
            errorMessage = "Too many requests. Please wait before requesting another verification email."
            break
          case 'auth/network-request-failed':
            errorMessage = "Network error. Please check your connection and try again."
            break
          default:
            errorMessage = "Failed to send verification email. Please try again."
        }
      }
      
      toast.error(errorMessage)
      return false
    }
  }

  const refreshUserToken = async (): Promise<void> => {
    if (!auth?.currentUser) return
    
    try {
      // Force token refresh to get latest custom claims
      const tokenResult = await auth.currentUser.getIdTokenResult(true)
      const userClaims = (tokenResult.claims ?? {}) as Claims
      setClaims(userClaims)
      
      // Update user role if it changed
      if (userClaims.role && user && userClaims.role !== user.role) {
        setUser(prev => prev ? { ...prev, role: userClaims.role || 'customer' } : null)
      }
    } catch (error) {
      console.error("Error refreshing user token:", error)
    }
  }

  // Computed values
  const isAdmin = claims.role === 'admin'
  


  const value = {
    user,
    currentUser: user, // Explicitly add currentUser to the value object
    claims,
    isLoading,
    loading: isLoading, // Add loading alias for consistency
    isAuthenticated,
    isAdmin, // Add isAdmin computed property
    login,
    signup,
    resetPassword,
    logout,
    signInWithGoogle,
    resendEmailVerification,
    sendVerificationEmail: resendEmailVerification,
    refreshUserToken,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}