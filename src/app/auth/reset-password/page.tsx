'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AuthLayout from '@/components/auth/AuthLayout'
import { validateEmail } from '../../../lib/utils/validation'
import { useAuth } from '@/lib/context/AuthContext'
import { toast } from '@/hooks/use-toast'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [errors, setErrors] = useState({ email: '' })
  const { resetPassword } = useAuth()
  const router = useRouter()

  const validateForm = (): boolean => {
    const newErrors = { email: '' }
    let isValid = true

    // Validate email
    if (!email.trim()) {
      newErrors.email = 'Email is required'
      isValid = false
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      const success = await resetPassword(email)
      if (success) {
        setEmailSent(true)
      }
    } catch (error) {
      console.error('Reset password error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <AuthLayout title="Check Your Email" subtitle={`We've sent a password reset link to ${email}`}>
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-400 text-center">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            
            <Button
              onClick={() => setEmailSent(false)}
              variant="outline"
              className="w-full"
            >
              Try Different Email
            </Button>
            
            <Link href="/auth/login">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your email address and we'll send you a link to reset your password.">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-gold-foil"
              placeholder="Enter your email"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-gold-foil hover:bg-gold-foil/90 text-black font-semibold"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/auth/login"
            className="text-gold-foil hover:text-gold-foil/80 text-sm font-medium flex items-center justify-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}