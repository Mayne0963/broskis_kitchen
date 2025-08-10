'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, RefreshCw } from 'lucide-react'

interface EmailVerificationBannerProps {
  className?: string
}

export function EmailVerificationBanner({ className }: EmailVerificationBannerProps) {
  const { user, resendEmailVerification } = useAuth()
  const [isResending, setIsResending] = useState(false)

  // Don't show banner if user is not authenticated or is verified
  if (!user || user.emailVerified) {
    return null
  }

  const handleResendVerification = async () => {
    setIsResending(true)
    try {
      await resendEmailVerification()
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Alert className={`border-[var(--color-harvest-gold)]/30 bg-[var(--color-harvest-gold)]/10 ${className}`}>
      <Mail className="h-4 w-4 text-[var(--color-harvest-gold)]" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="text-[var(--color-harvest-gold)]">
          <strong>Email verification required.</strong> Please check your email and click the verification link to access all features.
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResendVerification}
          disabled={isResending}
          className="ml-4 border-[var(--color-harvest-gold)]/50 text-[var(--color-harvest-gold)] hover:bg-[var(--color-harvest-gold)]/20"
        >
          {isResending ? (
            <>
              <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
              Sending...
            </>
          ) : (
            'Resend Email'
          )}
        </Button>
      </AlertDescription>
    </Alert>
  )
}