"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { FaEnvelope, FaArrowLeft } from "react-icons/fa"
import AuthLayout from "../../../components/auth/AuthLayout"
import { validateEmail } from "../../../lib/utils/validation"
import { useAuth } from "../../../lib/context/AuthContext"
import { toast } from "@/hooks/use-toast"

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState("")
  const [errors, setErrors] = useState<{ email?: string; general?: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Reset errors
    setErrors({})

    // Validate email
    if (!validateEmail(email)) {
      setErrors({ email: "Please enter a valid email address" })
      return
    }

    // Submit reset request
    setIsLoading(true)

    try {
      const success = await resetPassword(email)

      if (success) {
        setIsSubmitted(true)
        toast({
          title: "Reset link sent",
          description: "Check your email for instructions to reset your password",
          duration: 5000,
        })
      } else {
        setErrors({
          general: "Failed to send reset link. Please check your email and try again.",
        })
      }
    } catch (error) {
      console.error("Password reset error:", error)
      setErrors({
        general: "An error occurred. Please try again later.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout title="Forgot Password" subtitle="Enter your email to reset your password">
      {isSubmitted ? (
        <div className="text-center">
          <div className="bg-emerald-green bg-opacity-20 text-emerald-green p-6 rounded-md mb-6 animate-fade-in">
            <h3 className="text-lg font-medium mb-2">Reset Link Sent</h3>
            <p>
              We've sent a password reset link to <strong>{email}</strong>. Please check your email and follow the
              instructions to reset your password.
            </p>
          </div>

          <p className="text-sm text-gray-400 mb-6">
            Didn't receive an email? Check your spam folder or request another reset link.
          </p>

          <div className="flex flex-col space-y-4">
            <button
              type="button"
              className="btn-outline"
              onClick={() => {
                setEmail("")
                setIsSubmitted(false)
              }}
            >
              Try another email
            </button>

            <Link href="/auth/login" className="text-gold-foil hover:underline flex items-center justify-center gap-2">
              <FaArrowLeft size={12} /> Back to login
            </Link>
          </div>
        </div>
      ) : (
        <>
          {errors.general && (
            <div className="bg-blood-red bg-opacity-20 text-blood-red p-4 rounded-md mb-6 animate-fade-in">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`input pl-10 w-full ${errors.email ? "border-blood-red" : "border-[#333333]"}`}
                  placeholder="your@email.com"
                  required
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-blood-red">{errors.email}</p>}
            </div>

            <button type="submit" className="btn-primary w-full flex justify-center items-center" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                "Send Reset Link"
              )}
            </button>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-gold-foil hover:underline flex items-center justify-center gap-2"
              >
                <FaArrowLeft size={12} /> Back to login
              </Link>
            </div>
          </form>
        </>
      )}
    </AuthLayout>
  )
}
