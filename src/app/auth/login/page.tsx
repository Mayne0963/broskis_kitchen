"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "../../../lib/context/AuthContext"
import { FaEnvelope, FaLock, FaGoogle, FaFacebook, FaApple } from "react-icons/fa"
import AuthLayout from "../../../components/auth/AuthLayout"
import { validateEmail, validatePassword } from "../../../lib/utils/validation"
import { toast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Reset errors
    setErrors({})

    // Validate inputs
    let hasErrors = false
    const newErrors: { email?: string; password?: string; general?: string } = {}

    if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address"
      hasErrors = true
    }

    if (!validatePassword(password)) {
      newErrors.password = "Password must be at least 8 characters"
      hasErrors = true
    }

    if (hasErrors) {
      setErrors(newErrors)
      return
    }

    // Attempt login
    try {
      const success = await login(email, password)

      if (success) {
        toast({
          title: "Login successful",
          description: "Welcome back to Broski's Kitchen!",
          duration: 3000,
        })
        router.push("/") // Redirect to home page after successful login
      } else {
        setErrors({
          general: "Invalid email or password. Please try again.",
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      setErrors({
        general: "An error occurred during login. Please try again.",
      })
    }
  }

  const handleSocialLogin = (provider: string) => {
    // This would be implemented with your social auth provider
    toast({
      title: `${provider} login`,
      description: `${provider} login is coming soon!`,
      duration: 3000,
    })
  }

  return (
    <AuthLayout title="Welcome Back" subtitle="Login to your account to continue your culinary journey">
      {errors.general && (
        <div className="bg-blood-red bg-opacity-20 text-blood-red p-4 rounded-md mb-6 animate-fade-in">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
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
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <Link href="/auth/forgot-password" className="text-sm text-gold-foil hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-500" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`input pl-10 w-full ${errors.password ? "border-blood-red" : "border-[#333333]"}`}
                placeholder="••••••••"
                required
              />
            </div>
            {errors.password && <p className="mt-1 text-sm text-blood-red">{errors.password}</p>}
          </div>

          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-[#333333] text-gold-foil focus:ring-gold-foil"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm">
              Remember me
            </label>
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
              Logging in...
            </span>
          ) : (
            "Login"
          )}
        </button>
      </form>

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#333333]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#1A1A1A] text-gray-400">Or continue with</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleSocialLogin("Google")}
            className="w-full inline-flex justify-center py-2 px-4 border border-[#333333] rounded-md shadow-sm bg-[#1A1A1A] text-sm font-medium text-white hover:bg-[#222222] transition-colors"
          >
            <FaGoogle className="text-red-500" />
          </button>
          <button
            type="button"
            onClick={() => handleSocialLogin("Facebook")}
            className="w-full inline-flex justify-center py-2 px-4 border border-[#333333] rounded-md shadow-sm bg-[#1A1A1A] text-sm font-medium text-white hover:bg-[#222222] transition-colors"
          >
            <FaFacebook className="text-blue-600" />
          </button>
          <button
            type="button"
            onClick={() => handleSocialLogin("Apple")}
            className="w-full inline-flex justify-center py-2 px-4 border border-[#333333] rounded-md shadow-sm bg-[#1A1A1A] text-sm font-medium text-white hover:bg-[#222222] transition-colors"
          >
            <FaApple />
          </button>
        </div>
      </div>

      <div className="mt-8 text-center space-y-2">
        <Link
          href="/auth/reset-password"
          className="text-gold-foil hover:text-gold-foil/80 text-sm font-medium block"
        >
          Forgot your password?
        </Link>
        <p className="text-sm text-gray-400">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-gold-foil hover:text-gold-foil/80 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
