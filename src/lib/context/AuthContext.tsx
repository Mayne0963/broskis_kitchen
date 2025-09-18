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

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
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
          // Get custom claims from Firebase Auth
          const tokenResult = await firebaseUser.getIdTokenResult(true)
          const userClaims = (tokenResult.claims ?? {}) as Claims
          
          // Get user document from Firestore for basic profile data
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          
          if (userDoc.exists()) {
            const userData = userDoc.data()
            const userWithId: User = {
              id: firebaseUser.uid,
              name: userData.name || firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              role: userClaims.role || userData.role || 'customer',
              emailVerified: firebaseUser.emailVerified,
            }
            setUser(userWithId)
          } else {
            // If no user document exists, create a basic user object
            const basicUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              role: userClaims.role || 'customer',
              emailVerified: firebaseUser.emailVerified,
            }
            setUser(basicUser)
          }
          
          setClaims(userClaims)
        } catch (error) {
          console.error('Error fetching user data:', error)
          // Fallback to basic user object if Firestore fails
          const basicUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || '',
            email: firebaseUser.email || '',
            role: 'customer',
            emailVerified: firebaseUser.emailVerified,
          }
          setUser(basicUser)
          setClaims({})
        }
      } else {
        setUser(null)
        setClaims({})
      }
      setIsLoading(false)
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
      const response = await fetch('/api/session', {
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

      toast.error(errorMessage)
      
      // Handle specific Firebase error codes
      const firebaseError = error as { code?: string }
      switch (firebaseError.code) {
        case 'auth/invalid-email':
        case 'auth/invalid-credential':
          errorMessage = "Please enter a valid email address."
          break
        case 'auth/user-disabled':
          errorMessage = "This account has been disabled. Please contact support."
          break
        case 'auth/user-not-found':
          errorMessage = "No account found with this email address. Please sign up first."
          break
        case 'auth/wrong-password':
          errorMessage = "Incorrect password. Please try again or reset your password."
          break
        case 'auth/invalid-credential':
          errorMessage = "Invalid email or password. Please check your credentials and try again."
          break
        case 'auth/too-many-requests':
          errorMessage = "Too many failed login attempts. Please try again later or reset your password."
          break
        case 'auth/network-request-failed':
          errorMessage = "Network error. Please check your connection and try again."
          break
        default:
          errorMessage = (error as Error).message || "Invalid email or password"
      }
      
      toast.error(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    if (!auth || !db) {
      toast.error("Firebase not configured - signup disabled")
      return false
    }
    try {
      setIsLoading(true)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Update profile with name
      await updateProfile(userCredential.user, {
        displayName: name,
      })

      // Send email verification
      await sendEmailVerification(userCredential.user)

      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        email,
        role: 'user',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      toast.success("Account created! Please verify your email address.")
      return true
    } catch (error: unknown) {
      console.error("Signup error:", error)
      let errorMessage = "Failed to create account."

      const firebaseError = error as { code?: string }
      switch (firebaseError.code) {
        case 'auth/email-already-in-use':
          errorMessage = "This email address is already in use. Please log in or use a different email."
          break
        case 'auth/invalid-email':
          errorMessage = "Please enter a valid email address."
          break
        case 'auth/operation-not-allowed':
          errorMessage = "Email/password accounts are not enabled. Please contact support."
          break
        case 'auth/weak-password':
          errorMessage = "Password is too weak. Please choose a stronger password."
          break
        case 'auth/network-request-failed':
          errorMessage = "Network error. Please check your connection and try again."
          break
        default:
          errorMessage = (error as Error).message || "Failed to create account."
      }

      toast.error(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (email: string): Promise<boolean> => {
    if (!auth) {
      toast.error("Firebase not configured - password reset disabled")
      return false
    }
    try {
      await sendPasswordResetEmail(auth, email)
      toast.success("Please check your inbox for instructions to reset your password.")
      return true
    } catch (error: unknown) {
      console.error("Password reset error:", error)
      let errorMessage = "Failed to send password reset email."

      const firebaseError = error as { code?: string }
      switch (firebaseError.code) {
        case 'auth/invalid-email':
          errorMessage = "Please enter a valid email address."
          break
        case 'auth/user-not-found':
          errorMessage = "No account found with this email address."
          break
        case 'auth/network-request-failed':
          errorMessage = "Network error. Please check your connection and try again."
          break
        default:
          errorMessage = (error as Error).message || "Failed to send password reset email."
      }

      toast.error(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    if (!auth) {
      toast.error("Firebase not configured - logout disabled")
      return
    }
    try {
      // Clear session cookie first
      await fetch('/api/session', { 
        method: 'DELETE',
        credentials: 'include'
      })
      await signOut(auth)
      toast.success("You have been successfully logged out.")
      return
    } catch (error: unknown) {
      console.error("Logout error:", error)
      let errorMessage = "Failed to log out."

      const firebaseError = error as { code?: string }
      switch (firebaseError.code) {
        case 'auth/network-request-failed':
          errorMessage = "Network error. Please check your connection and try again."
          break
        default:
          errorMessage = (error as Error).message || "Failed to log out."
      }

      toast.error(errorMessage)
      return
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithGoogle = async (): Promise<boolean> => {
    if (!auth || !googleProvider) {
      toast.error("Firebase or Google Provider not configured - Google Sign-In disabled")
      return false;
    }
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
  
      // Create or update user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: user.displayName,
        email: user.email,
        role: 'user',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }, { merge: true });
  
      // Create session cookie with exponential backoff retry logic
      let sessionCreated = false;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!sessionCreated && retryCount < maxRetries) {
        try {
          // Force token refresh before getting ID token
          const idToken = await getIdToken(user, true);
          
          const response = await fetch('/api/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ idToken }),
          });
  
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create session');
          }
          
          sessionCreated = true;
        } catch (sessionError: any) {
          console.warn(`Session creation attempt ${retryCount + 1} failed:`, sessionError);
          
          // Check for quota exceeded error and stop retries immediately
          if (sessionError?.code === 'auth/quota-exceeded') {
            throw sessionError;
          }
          
          retryCount++;
          
          if (retryCount >= maxRetries) {
            throw sessionError;
          }
          
          // Exponential backoff: 1s → 2s → 4s (max 30s)
          const backoffDelay = Math.min(1000 * Math.pow(2, retryCount - 1), 30000);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
  
      toast.success("Welcome to Broski's Kitchen!");
      return true;
    } catch (error: unknown) {
      console.error("Google Sign-In error:", error);
      let errorMessage = "Failed to sign in with Google.";
  
      const firebaseError = error as { code?: string };
      switch (firebaseError.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = "Google Sign-In popup closed. Please try again.";
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = "Google Sign-In popup already open. Please wait.";
          break;
        case 'auth/operation-not-allowed':
          errorMessage = "Google Sign-In is not enabled. Please contact support.";
          break;
        case 'auth/quota-exceeded':
          errorMessage = "Rate limit exceeded. Please wait before trying again.";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Network error. Please check your connection and try again.";
          break;
        default:
          errorMessage = (error as Error).message || "Failed to sign in with Google.";
      }
  
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resendEmailVerification = async (): Promise<boolean> => {
    if (!auth || !auth.currentUser) {
      toast.error("No authenticated user found to resend verification email.")
      return false
    }
    try {
      setIsLoading(true)
      await sendEmailVerification(auth.currentUser)
      toast.success("A new verification email has been sent to your inbox.")
      return true
    } catch (error: unknown) {
      console.error("Resend email verification error:", error)
      let errorMessage = "Failed to resend verification email."

      const firebaseError = error as { code?: string }
      switch (firebaseError.code) {
        case 'auth/too-many-requests':
          errorMessage = "Too many requests. Please wait a moment before trying again."
          break
        case 'auth/network-request-failed':
          errorMessage = "Network error. Please check your connection and try again."
          break
        default:
          errorMessage = (error as Error).message || "Failed to resend verification email."
      }

      toast.error(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUserToken = async (): Promise<boolean> => {
    if (!auth || !auth.currentUser) {
      return false
    }
    try {
      const tokenResult = await getIdTokenResult(auth.currentUser, true)
      const userClaims = (tokenResult.claims ?? {}) as Claims
      setClaims(userClaims)
      return true
    } catch (error) {
      console.error('Error refreshing user token:', error)
      return false
    }
  }



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