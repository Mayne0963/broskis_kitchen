'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/context/AuthContext'
import { toast, Toaster } from 'sonner'

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false)
  const { user, sendVerificationEmail, logout } = useAuth()
  const router = useRouter()

  const handleResendEmail = async () => {
    if (!user) return
    
    setIsResending(true)
    try {
      await sendVerificationEmail()
      toast.success('Verification email sent! Please check your inbox.')
    } catch (error) {
      console.error('Error sending verification email:', error)
      toast.error('Failed to send verification email. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/auth/login')
    } catch (error) {
      console.error('Error logging out:', error)
      toast.error('Failed to logout. Please try again.')
    }
  }

  const handleCheckVerification = () => {
    // Refresh the page to check if email is now verified
    window.location.reload()
  }

  if (!user) {
    router.push('/auth/login')
    return null
  }

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-harvest-gold)]/10 to-[var(--color-rich-black)]/5 p-4">
        <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-[var(--color-harvest-gold)]/10 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-[var(--color-harvest-gold)]" />
          </div>
          <CardTitle className="text-2xl font-bold text-[var(--color-rich-black)]">
            Verify Your Email
          </CardTitle>
          <CardDescription className="text-gray-600">
            We've sent a verification link to <strong>{user.email}</strong>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please check your email and click the verification link to continue. 
              Don't forget to check your spam folder!
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button 
              onClick={handleCheckVerification}
              className="w-full bg-[var(--color-harvest-gold)] hover:bg-[var(--color-harvest-gold)]/90 text-[var(--color-rich-black)] font-medium"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              I've Verified My Email
            </Button>

            <Button 
              onClick={handleResendEmail}
              disabled={isResending}
              variant="outline"
              className="w-full border-[var(--color-harvest-gold)] text-[var(--color-harvest-gold)] hover:bg-[var(--color-harvest-gold)]/10"
            >
              {isResending ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>

            <Button 
              onClick={handleLogout}
              variant="ghost"
              className="w-full text-gray-600 hover:text-[var(--color-rich-black)] hover:bg-gray-100"
            >
              Use Different Account
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>Didn't receive the email?</p>
            <p>Check your spam folder or try resending.</p>
          </div>
        </CardContent>
        </Card>
      </div>
    </>
  )
}