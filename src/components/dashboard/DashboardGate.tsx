"use client";

import { useAuth } from '@/lib/context/AuthContext'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
})

type LoginFormValues = z.infer<typeof loginSchema>

interface DashboardGateProps {
  initialPaymentMethods?: any[]
  initialAddresses?: any[]
  initialPaymentHistory?: any[]
  initialOrderHistory?: any[]
  userId?: string
}

export default function DashboardGate({
  initialPaymentMethods = [],
  initialAddresses = [],
  initialPaymentHistory = [],
  initialOrderHistory = [],
  userId = ''
}: DashboardGateProps) {
  const { user, isLoading, login, signOut } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true)
    
    try {
      const success = await login(values.email, values.password)
      if (success) {
        // User will be automatically updated via AuthContext
        form.reset()
      }
    } catch (error) {
      console.error('Login error:', error)
      form.setError('root', {
        message: 'Invalid email or password. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-[#1A1A1A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-2 border-[var(--color-harvest-gold)] border-t-transparent rounded-full animate-spin" />
          <p className="text-lg">Loading your space…</p>
        </div>
      </div>
    )
  }

  // Show dashboard if user is authenticated
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-[#1A1A1A] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 text-[var(--color-harvest-gold)]">
              Welcome to Your Dashboard
            </h1>
            <p className="text-xl text-gray-300">
              Hello, {user.email}! You are successfully logged in.
            </p>
          </div>
          
          <div className="bg-[var(--color-dark-charcoal)] rounded-lg p-8 border border-[var(--color-harvest-gold)]/20">
            <h2 className="text-2xl font-semibold mb-4 text-[var(--color-harvest-gold)]">
              Dashboard Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-black/50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-white">Order History</h3>
                <p className="text-gray-400">View your past orders and track current ones.</p>
              </div>
              <div className="bg-black/50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-white">Rewards</h3>
                <p className="text-gray-400">Check your loyalty points and rewards.</p>
              </div>
              <div className="bg-black/50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-white">Payment Methods</h3>
                <p className="text-gray-400">Manage your saved payment options.</p>
              </div>
              <div className="bg-black/50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-white">Addresses</h3>
                <p className="text-gray-400">Update your delivery addresses.</p>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <button 
                onClick={() => signOut()}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show inline login form if user is not authenticated
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-[#1A1A1A] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-harvest-gold)] mb-2">
            Sign in to view your dashboard
          </h1>
          <p className="text-gray-300">
            Access your orders, rewards, and account settings
          </p>
        </div>

        <Card className="bg-[var(--color-dark-charcoal)] border-[var(--color-harvest-gold)]/20">
          <CardContent className="pt-6">
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
                      <FormLabel className="text-white">Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="you@broski.com"
                          disabled={isSubmitting}
                          className="bg-[var(--color-rich-black)] border-[var(--color-harvest-gold)]/30 text-white placeholder:text-gray-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            className="pr-10 bg-[var(--color-rich-black)] border-[var(--color-harvest-gold)]/30 text-white placeholder:text-gray-400"
                            disabled={isSubmitting}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                            disabled={isSubmitting}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <Link 
                      href="/auth/forgot-password" 
                      className="text-[var(--color-harvest-gold)] hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-[var(--color-harvest-gold)] hover:bg-[var(--color-harvest-gold)]/90 text-[var(--color-rich-black)] font-medium"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[var(--color-harvest-gold)]/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[var(--color-dark-charcoal)] px-2 text-gray-400">Or continue with</span>
                </div>
              </div>
              
              <div className="mt-6">
                <GoogleSignInButton text="Sign in with Google" />
              </div>
            </div>

            <div className="mt-6 text-center text-sm text-gray-400">
              Don&apos;t have an account?{' '}
              <Link 
                href="/auth/signup" 
                className="text-[var(--color-harvest-gold)] hover:underline font-medium"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}