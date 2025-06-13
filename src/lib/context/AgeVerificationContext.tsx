"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { getLocalUser, storeVerificationStatus, getVerificationStatus } from "../services/firebase"

interface AgeVerificationContextType {
  isVerified: boolean
  isVerifying: boolean
  showModal: boolean
  error: string | null
  verifyAge: (month: number, year: number) => Promise<boolean>
  requestVerification: () => void
  closeModal: () => void
}

const AgeVerificationContext = createContext<AgeVerificationContextType | undefined>(undefined)

export const useAgeVerification = () => {
  const context = useContext(AgeVerificationContext)
  if (context === undefined) {
    throw new Error("useAgeVerification must be used within an AgeVerificationProvider")
  }
  return context
}

interface AgeVerificationProviderProps {
  children: React.ReactNode
  expiryDays?: number
}

export const AgeVerificationProvider: React.FC<AgeVerificationProviderProps> = ({
  children,
  expiryDays = Number(process.env.AGE_VERIFICATION_EXPIRY_DAYS || "30"),
}) => {
  const [isVerified, setIsVerified] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Check verification status on mount
  useEffect(() => {
    const checkVerification = async () => {
      try {
        // Get local user
        const user = getLocalUser()
        setUserId(user.uid)

        // Check verification status
        const verified = await getVerificationStatus(user.uid)
        setIsVerified(verified)
      } catch (error) {
        console.error("Error checking verification status:", error)
        setIsVerified(false)
      }
    }

    checkVerification()
  }, [])

  // Function to verify age
  const verifyAge = useCallback(
    async (month: number, year: number): Promise<boolean> => {
      if (!userId) return false

      setIsVerifying(true)
      setError(null)

      try {
        const birthDate = new Date(year, month - 1)
        const today = new Date()

        // Calculate age
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()

        // Adjust age if birthday hasn't occurred yet this year
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }

        if (age < 21) {
          setError("You must be 21 years or older to access this content.")
          setIsVerified(false)
          return false
        }

        // Store verification status
        await storeVerificationStatus(userId, true, expiryDays)
        setIsVerified(true)
        return true
      } catch (error) {
        console.error("Error verifying age:", error)
        setError("An error occurred during verification. Please try again.")
        return false
      } finally {
        setIsVerifying(false)
      }
    },
    [userId, expiryDays],
  )

  // Function to request verification
  const requestVerification = useCallback(() => {
    if (!isVerified) {
      setShowModal(true)
    }
  }, [isVerified])

  // Function to close modal
  const closeModal = useCallback(() => {
    setShowModal(false)
  }, [])

  return (
    <AgeVerificationContext.Provider
      value={{
        isVerified,
        isVerifying,
        showModal,
        error,
        verifyAge,
        requestVerification,
        closeModal,
      }}
    >
      {children}
    </AgeVerificationContext.Provider>
  )
}
