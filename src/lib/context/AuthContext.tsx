"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { auth, db, getLocalUser } from "../services/firebase"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth"
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import type { User } from "@/types"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  signup: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!auth || !db) {
      // If Firebase is not configured, create a local user
      const localUser = getLocalUser()
      setUser({
        id: localUser.uid,
        name: "Local User",
        email: "local@example.com",
        isGuest: true,
      })
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
            isGuest: false,
          }
          setUser(appUser)
        } catch (error) {
          console.error('Error fetching user data:', error)
          // Fallback to Firebase user data
          const appUser: User = {
            id: authUser.uid,
            name: authUser.displayName || "User",
            email: authUser.email || "",
            isGuest: false,
          }
          setUser(appUser)
        }
      } else {
        // Create a local user when not authenticated
        const localUser = getLocalUser()
        setUser({
          id: localUser.uid,
          name: "Guest User",
          email: "guest@example.com",
          isGuest: true,
        })
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
      await signInWithEmailAndPassword(auth, email, password)
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      })
      return true
    } catch (error: any) {
      console.error("Login error:", error)
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
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

      // Save user data to Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        email,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      toast({
        title: "Account Created",
        description: "Welcome to Broski's Kitchen!",
      })
      return true
    } catch (error: any) {
      console.error("Signup error:", error)
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create account",
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
      await signOut(auth)
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully",
      })
    } catch (error: any) {
      console.error("Logout error:", error)
      toast({
        title: "Logout Error",
        description: error.message || "Failed to logout",
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
    } catch (error: any) {
      console.error("Password reset error:", error)
      toast({
        title: "Password Reset Failed",
        description: error.message || "Failed to send password reset email",
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
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
