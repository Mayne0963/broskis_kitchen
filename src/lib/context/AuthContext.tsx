"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth"
import { app, isFirebaseConfigured } from "../services/firebase"
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
  const auth = isFirebaseConfigured && app ? getAuth(app) : null

  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      setIsLoading(false)
      return
    }
    
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        // Convert Firebase user to our User type
        const appUser: User = {
          id: authUser.uid,
          name: authUser.displayName || "Guest User",
          email: authUser.email || "",
          isGuest: false,
        }
        setUser(appUser)
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [auth])

  const login = async (email: string, password: string): Promise<boolean> => {
    if (!auth || !isFirebaseConfigured) {
      console.warn("Firebase not configured - login disabled")
      return false
    }
    try {
      setIsLoading(true)
      await signInWithEmailAndPassword(auth, email, password)
      return true
    } catch (error) {
      console.error("Login error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    if (!auth || !isFirebaseConfigured) {
      console.warn("Firebase not configured - signup disabled")
      return false
    }
    try {
      setIsLoading(true)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Update profile with name
      await updateProfile(userCredential.user, {
        displayName: name,
      })

      return true
    } catch (error) {
      console.error("Signup error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    if (!auth || !isFirebaseConfigured) {
      console.warn("Firebase not configured - logout disabled")
      return
    }
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const resetPassword = async (email: string): Promise<boolean> => {
    if (!auth || !isFirebaseConfigured) {
      console.warn("Firebase not configured - password reset disabled")
      return false
    }
    try {
      await sendPasswordResetEmail(auth, email)
      return true
    } catch (error) {
      console.error("Password reset error:", error)
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
