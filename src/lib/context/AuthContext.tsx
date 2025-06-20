"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { auth, db } from "../services/firebase"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  updateProfile,
  getIdToken,
} from "firebase/auth"
import { doc, setDoc, getDoc, updateDoc, Timestamp } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import type { User, AuthContextType } from "@/types"

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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!auth || !db) {
      // If Firebase is not configured, user remains null
      setUser(null)
      setIsLoading(false)
      return
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', authUser.uid))
          const userData = userDoc.data()
          
          const appUser: User = {
            id: authUser.uid,
            name: userData?.name || authUser.displayName || "User",
            email: authUser.email || "",
            emailVerified: authUser.emailVerified,
            role: userData?.role || 'customer',
          }
          setUser(appUser)
        } catch (error) {
          console.error('Error fetching user data:', error)
          // Fallback to Firebase user data
          const appUser: User = {
            id: authUser.uid,
            name: authUser.displayName || "User",
            email: authUser.email || "",
            emailVerified: authUser.emailVerified,
            role: 'customer',
          }
          setUser(appUser)
        }
      } else {
        // No authenticated user
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    if (!auth || !db) {
      toast({
        title: "Authentication Error",
        description: "Firebase not configured - login disabled",
        variant: "destructive",
      })
      return false
    }
    try {
      setIsLoading(true)
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      
      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        toast({
          title: "Email Not Verified",
          description: "Please verify your email address before signing in. Check your inbox for a verification link.",
          variant: "destructive",
        })
        // Don't sign out, let them verify their email
        return false
      }
      
      // Create session cookie
      const idToken = await getIdToken(userCredential.user)
      const response = await fetch('/api/auth/session-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      })

      if (!response.ok) {
        throw new Error('Failed to create session')
      }
      
      toast({
        title: "Login Successful",
        description: "Welcome back to Broski's Kitchen!",
      })
      return true
    } catch (error: unknown) {
      console.error("Login error:", error)
      let errorMessage = "Invalid email or password"
      
      // Handle specific Firebase error codes
      const firebaseError = error as { code?: string }
      switch (firebaseError.code) {
        case 'auth/invalid-email':
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
          errorMessage = error.message || "Invalid email or password"
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    if (!auth || !db) {
      toast({
        title: "Authentication Error",
        description: "Firebase not configured - signup disabled",
        variant: "destructive",
      })
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

      // Save user data to Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        email,
        role: 'customer',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      toast({
        title: "Account Created Successfully",
        description: "Please check your email to verify your account before signing in.",
      })
      return true
    } catch (error: unknown) {
      console.error("Signup error:", error)
      let errorMessage = "Failed to create account"
      
      // Handle specific Firebase error codes
      const firebaseError = error as { code?: string }
      switch (firebaseError.code) {
        case 'auth/email-already-in-use':
          errorMessage = "An account with this email already exists. Please sign in instead."
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
          errorMessage = error.message || "Failed to create account"
      }
      
      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    if (!auth || !db) {
      // For local users, just clear the user state
      setUser(null)
      toast({
        title: "Logged Out",
        description: "You have been logged out",
      })
      return
    }
    try {
      // Clear session cookie first
      await fetch('/api/auth/session-logout', {
        method: 'POST',
      })
      
      // Then sign out from Firebase
      await signOut(auth)
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully",
      })
    } catch (error: unknown) {
      console.error("Logout error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to logout"
      toast({
        title: "Logout Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const resetPassword = async (email: string): Promise<boolean> => {
    if (!auth || !db) {
      toast({
        title: "Password Reset Error",
        description: "Firebase not configured - password reset disabled",
        variant: "destructive",
      })
      return false
    }
    try {
      await sendPasswordResetEmail(auth, email)
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for password reset instructions",
      })
      return true
    } catch (error: unknown) {
      console.error("Password reset error:", error)
      let errorMessage = "Failed to send password reset email"
      
      // Handle specific Firebase error codes
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
          errorMessage = error.message || "Failed to send password reset email"
      }
      
      toast({
        title: "Password Reset Failed",
        description: errorMessage,
        variant: "destructive",
      })
      return false
    }
  }
  
  const resendEmailVerification = async (): Promise<boolean> => {
    if (!auth || !auth.currentUser) {
      toast({
        title: "Verification Error",
        description: "You must be logged in to resend verification email",
        variant: "destructive",
      })
      return false
    }
    try {
      await sendEmailVerification(auth.currentUser)
      toast({
        title: "Verification Email Sent",
        description: "Please check your email to verify your account",
      })
      return true
    } catch (error: unknown) {
      console.error("Email verification error:", error)
      let errorMessage = "Failed to send verification email"
      
      // Handle specific Firebase error codes
      const firebaseError = error as { code?: string }
      switch (firebaseError.code) {
        case 'auth/too-many-requests':
          errorMessage = "Too many requests. Please try again later."
          break
        case 'auth/network-request-failed':
          errorMessage = "Network error. Please check your connection and try again."
          break
        default:
          errorMessage = error.message || "Failed to send verification email"
      }
      
      toast({
        title: "Verification Email Failed",
        description: errorMessage,
        variant: "destructive",
      })
      return false
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        resetPassword,
        resendEmailVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
