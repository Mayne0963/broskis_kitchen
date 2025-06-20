'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/lib/context/AuthContext'
import { AuthLayout } from '@/components/auth/AuthLayout'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { resetPassword } = useAuth()

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  })

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true)
    
    try {
      await resetPassword(values.email)
      setIsSuccess(true)
    } catch (error) {
      console.error('Password reset error:', error)
      form.setError('root', {
        message: 'An error occurred while sending the reset email. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <AuthLayout>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-[var(--color-rich-black)]">
              Check Your Email
            </CardTitle>
            <CardDescription className="text-gray-600">
              If that email exists, we've sent reset instructions to your inbox.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 text-center">
              <p>Didn't receive the email? Check your spam folder or try again.</p>
            </div>
            
            <Button 
              onClick={() => setIsSuccess(false)}
              variant="outline"
              className="w-full"
            >
              Try Again
            </Button>
            
            <div className="text-center">
              <Link 
                href="/auth/login" 
                className="inline-flex items-center text-sm text-[var(--color-harvest-gold)] hover:underline"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-[var(--color-rich-black)]">
            Forgot Password?
          </CardTitle>
          <CardDescription className="text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {form.formState.errors.root && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="you@broski.com"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-[var(--color-harvest-gold)] hover:bg-[var(--color-harvest-gold)]/90 text-[var(--color-rich-black)] font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Sending Reset Link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <Link 
              href="/auth/login" 
              className="inline-flex items-center text-sm text-[var(--color-harvest-gold)] hover:underline"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
