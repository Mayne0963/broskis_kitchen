'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/context/AuthContext'
import AuthLayout from '@/components/auth/AuthLayout'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import { useAfterSignIn } from '@/lib/auth/afterSignIn'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const afterSignIn = useAfterSignIn()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true)
    
    try {
      const success = await login(values.email, values.password)
      if (success) {
        const nextParam = searchParams.get('next')
        const dest = nextParam && nextParam.startsWith('/') ? nextParam : '/dashboard'
        await afterSignIn(dest)
      }
    } catch (error) {
      console.error('Login error:', error)
      form.setError('root', {
        message: 'Invalid email or password. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your Broski's Kitchen account">
      <Card className="w-full max-w-md">
        
        <CardContent>
          {searchParams.get('error') === 'admin_required' && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Admin access required. Please sign in with an authorized admin account.</AlertDescription>
            </Alert>
          )}
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

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          className="pr-10"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          disabled={isLoading}
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
                disabled={isLoading}
              >
                {isLoading ? (
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
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            
            <div className="mt-6">
              <GoogleSignInButton text="Sign in with Google" />
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
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
    </AuthLayout>
  )
}
