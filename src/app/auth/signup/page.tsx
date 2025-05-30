"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "../../../lib/context/AuthContext"
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGoogle, FaFacebook, FaApple } from "react-icons/fa"
import AuthLayout from "../../../components/auth/AuthLayout"

import PasswordStrengthMeter from "../../../components/auth/PasswordStrengthMeter"
import { validateEmail, validatePassword, validateName, checkPasswordStrength, validatePasswordStrength } from "../../../lib/utils/validation"
import { toast } from "@/hooks/use-toast"

export default function SignupPage() {
  const router = useRouter()
  const { signup, isLoading } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    password?: string
    confirmPassword?: string
    terms?: string
    general?: string
  }>({})
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])

  const passwordStrength = checkPasswordStrength(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Reset errors
    setErrors({})

    // Validate inputs
    let hasErrors = false
    const newErrors: {
      name?: string
      email?: string
      password?: string
      confirmPassword?: string
      terms?: string
      general?: string
    } = {}

    if (!validateName(name)) {
      newErrors.name = "Please enter your full name"
      hasErrors = true
    }

    if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address"
      hasErrors = true
    }

    // Validate password with enhanced validation
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0] // Show first error in the field
      setPasswordErrors(passwordValidation.errors) // Store all errors for detailed display
      hasErrors = true
    } else {
      setPasswordErrors([])
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
      hasErrors = true
    }

    if (!agreeToTerms) {
      newErrors.terms = "You must agree to the terms and conditions"
      hasErrors = true
    }

    if (hasErrors) {
      setErrors(newErrors)
      return
    }

    // Attempt signup
    try {
      const success = await signup(name, email, password)

      if (success) {
        toast({
          title: "Account created successfully",
          description: "Welcome to Broski's Kitchen!",
          duration: 3000,
        })
        router.push("/") // Redirect to home page after successful signup
      } else {
        setErrors({
          general: "An error occurred during signup. This email may already be in use.",
        })
      }
    } catch (error) {
      console.error("Signup error:", error)
      setErrors({
        general: "An error occurred during signup. Please try again.",
      })
    }
  }

  const handleSocialSignup = (provider: string) => {
    // This would be implemented with your social auth provider
    toast({
      title: `${provider} signup`,
      description: `${provider} signup is coming soon!`,
      duration: 3000,
    })
  }

  return (
    <AuthLayout
      title="Create an Account"
      subtitle="Join Broski's Kitchen to unlock exclusive rewards and faster checkout"
    >
      {errors.general && (
        <div className="bg-blood-red bg-opacity-20 text-blood-red p-4 rounded-md mb-6 animate-fade-in">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-gray-500" />
              </div>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`input pl-10 w-full ${errors.name ? "border-blood-red" : "border-[#333333]"}`}
                placeholder="John Doe"
                required
              />
            </div>
            {errors.name && <p className="mt-1 text-sm text-blood-red">{errors.name}</p>}
          </div>

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

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-500" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`input pl-10 pr-10 w-full ${errors.password ? "border-blood-red" : "border-[#333333]"}`}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FaEyeSlash className="text-gray-500 hover:text-gray-300" />
                ) : (
                  <FaEye className="text-gray-500 hover:text-gray-300" />
                )}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-blood-red">{errors.password}</p>}
            {passwordErrors.length > 0 && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm font-medium text-red-800 mb-1">Password requirements:</p>
                <ul className="text-sm text-red-700 space-y-1">
                  {passwordErrors.map((error, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {password && <PasswordStrengthMeter strength={passwordStrength} />}

            <p className="mt-2 text-xs text-gray-400">
              Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-500" />
              </div>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`input pl-10 w-full ${errors.confirmPassword ? "border-blood-red" : "border-[#333333]"}`}
                placeholder="••••••••"
                required
              />
            </div>
            {errors.confirmPassword && <p className="mt-1 text-sm text-blood-red">{errors.confirmPassword}</p>}
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="terms"
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="h-4 w-4 rounded border-[#333333] text-gold-foil focus:ring-gold-foil"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="terms" className="text-gray-300">
                I agree to the{" "}
                <Link href="/terms" className="text-gold-foil hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-gold-foil hover:underline">
                  Privacy Policy
                </Link>
              </label>
              {errors.terms && <p className="mt-1 text-sm text-blood-red">{errors.terms}</p>}
            </div>
          </div>
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
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Creating account...
            </span>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#333333]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#1A1A1A] text-gray-400">Or sign up with</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleSocialSignup("Google")}
            className="w-full inline-flex justify-center py-2 px-4 border border-[#333333] rounded-md shadow-sm bg-[#1A1A1A] text-sm font-medium text-white hover:bg-[#222222] transition-colors"
          >
            <FaGoogle className="text-red-500" />
          </button>
          <button
            type="button"
            onClick={() => handleSocialSignup("Facebook")}
            className="w-full inline-flex justify-center py-2 px-4 border border-[#333333] rounded-md shadow-sm bg-[#1A1A1A] text-sm font-medium text-white hover:bg-[#222222] transition-colors"
          >
            <FaFacebook className="text-blue-600" />
          </button>
          <button
            type="button"
            onClick={() => handleSocialSignup("Apple")}
            className="w-full inline-flex justify-center py-2 px-4 border border-[#333333] rounded-md shadow-sm bg-[#1A1A1A] text-sm font-medium text-white hover:bg-[#222222] transition-colors"
          >
            <FaApple />
          </button>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-gray-400">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-gold-foil hover:underline">
          Login
        </Link>
      </p>
    </AuthLayout>
  )
}
