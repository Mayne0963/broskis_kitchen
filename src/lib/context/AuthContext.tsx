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
  signInWithPopup,
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
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (!auth || !db) {
      // If Firebase is not configured, user remains null
      setUser(null)
      setIsLoading(false)

    }
    
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          // Brief delay to ensure auth state stabilization after sign-in
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Get Firebase ID token to access custom claims
          const idTokenResult = await authUser.getIdTokenResult(true); // Force refresh
          const customClaims = idTokenResult.claims;
          
          // Get user data from Firestore
          let userData = null;
          if (db) {
            const userDoc = await getDoc(doc(db, 'users', authUser.uid))
            userData = userDoc.data()
          }
          
          // Determine user role from custom claims or Firestore
          let userRole = 'user';
          if (customClaims.admin === true) {
            userRole = 'admin';
          } else if (customClaims.role) {
            userRole = customClaims.role;
          } else if (userData?.role) {
            userRole = userData.role;
          }
          
          const appUser: User = {
            id: authUser.uid,
            name: userData?.name || authUser.displayName || "User",
            email: authUser.email || "",
            emailVerified: authUser.emailVerified,
            role: userRole,
          }
          
          console.log('User authenticated with role:', userRole, 'Custom claims:', customClaims);
          setUser(appUser)
        } catch (error) {
          console.error('Error fetching user data:', error)
          // Fallback to Firebase user data
          const appUser: User = {
            id: authUser.uid,
            name: authUser.displayName || "User",
            email: authUser.email || "",
            emailVerified: authUser.emailVerified,
            role: 'user',
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

  useEffect(() => {
    setIsAuthenticated(!!user)
  }, [user])

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
      
      // Force ID token refresh to get latest custom claims
      const idToken = await getIdToken(userCredential.user, true)
      
      // Create session cookie
      const response = await fetch('/api/auth/session-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create session')
      }
      
      toast({
        title: "Login Successful",
        description: "Welcome back to Broski's Kitchen!",
      })
      return true
    } catch (error: unknown) {
      console.error("Login error:", error)
      let errorMessage = "An unexpected error occurred."
      
      if (error instanceof Error) {
        errorMessage = error.message
      }

      toast({
        title: "Login Error",
        description: errorMessage,
        variant: "destructive",
      })
      
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

      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        email,
        role: 'user',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      toast({
        title: "Signup Successful",
        description: "Account created! Please verify your email address.",
      })
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

  const resetPassword = async (email: string): Promise<boolean> => {
    if (!auth) {
      toast({
        title: "Authentication Error",
        description: "Firebase not configured - password reset disabled",
        variant: "destructive",
      })
      return false
    }
    try {
      await sendPasswordResetEmail(auth, email)
      toast({
        title: "Password Reset Email Sent",
        description: "Please check your inbox for instructions to reset your password.",
      })
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

      toast({
        title: "Password Reset Failed",
        description: errorMessage,
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    if (!auth) {
      toast({
        title: "Authentication Error",
        description: "Firebase not configured - logout disabled",
        variant: "destructive",
      })
      return
    }
    try {
      await signOut(auth)
      // Clear session cookie
      await fetch('/api/auth/session-logout', { method: 'POST' })
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      })
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

      toast({
        title: "Logout Failed",
        description: errorMessage,
        variant: "destructive",
      })
      return
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithGoogle = async (): Promise<boolean> => {
    if (!auth || !googleProvider) {
      toast({
        title: "Authentication Error",
        description: "Firebase or Google Provider not configured - Google Sign-In disabled",
        variant: "destructive",
      })
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
  
      // Create session cookie with retry logic
      let sessionCreated = false;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!sessionCreated && retryCount < maxRetries) {
        try {
          // Force token refresh before getting ID token
          const idToken = await getIdToken(user, true);
          
          const response = await fetch('/api/auth/session-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken }),
          });
  
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create session');
          }
          
          sessionCreated = true;
        } catch (sessionError) {
          console.warn(`Session creation attempt ${retryCount + 1} failed:`, sessionError);
          retryCount++;
          
          if (retryCount >= maxRetries) {
            throw sessionError;
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
  
      toast({
        title: "Google Sign-In Successful",
        description: "Welcome to Broski's Kitchen!",
      });
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
        case 'auth/network-request-failed':
          errorMessage = "Network error. Please check your connection and try again.";
          break;
        default:
          errorMessage = (error as Error).message || "Failed to sign in with Google.";
      }
  
      toast({
        title: "Google Sign-In Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resendEmailVerification = async (): Promise<boolean> => {
    if (!auth || !auth.currentUser) {
      toast({
        title: "Authentication Error",
        description: "No authenticated user found to resend verification email.",
        variant: "destructive",
      })
      return false
    }
    try {
      setIsLoading(true)
      await sendEmailVerification(auth.currentUser)
      toast({
        title: "Verification Email Sent",
        description: "A new verification email has been sent to your inbox.",
      })
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

      toast({
        title: "Resend Verification Failed",
        description: errorMessage,
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUserToken = async (): Promise<boolean> => {
    if (!auth?.currentUser) {
      console.log('No current user to refresh token for')
      return false
    }
    try {
      // Force refresh the ID token to get latest custom claims
      const idTokenResult = await auth.currentUser.getIdTokenResult(true)
      const customClaims = idTokenResult.claims
      
      // Update user role based on refreshed claims
      if (user) {
        let userRole = 'user'
        if (customClaims.admin === true) {
          userRole = 'admin'
        } else if (customClaims.role) {
          userRole = customClaims.role
        }
        
        const updatedUser = {
          ...user,
          role: userRole
        }
        
        console.log('Token refreshed, updated role:', userRole, 'Custom claims:', customClaims)
        setUser(updatedUser)
        
        toast({
          title: "Permissions Updated",
          description: "Your account permissions have been refreshed.",
        })
        return true
      }
      return false
    } catch (error) {
      console.error('Error refreshing user token:', error)
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh account permissions.",
        variant: "destructive",
      })
      return false
    }
  }

  const isAdmin = user?.role === 'admin'
  
  // Debug logging for admin status
  useEffect(() => {
    if (user) {
      console.log('AuthContext Debug:', {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified
        },
        isAdmin,
        isAuthenticated
      })
    }
  }, [user, isAdmin, isAuthenticated])

  const value = {
    user,
    currentUser: user, // Explicitly add currentUser to the value object
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