'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { SessionUser } from '@/lib/auth/session'

const profileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  email: z.string().email('Invalid email address'),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileFormProps {
  user: SessionUser
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user.name || '',
      email: user.email,
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      // Refresh the page to show updated data
      router.refresh()
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })
      
      if (response.ok) {
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="displayName" className="text-white">
            Display Name
          </Label>
          <Input
            id="displayName"
            {...register('displayName')}
            className="mt-1 bg-gray-700 border-gray-600 text-white"
            disabled={isLoading}
          />
          {errors.displayName && (
            <p className="text-red-400 text-sm mt-1">
              {errors.displayName.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="email" className="text-white">
            Email
          </Label>
          <Input
            id="email"
            {...register('email')}
            className="mt-1 bg-gray-700 border-gray-600 text-white"
            disabled
          />
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">
              {errors.email.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          type="submit"
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
          disabled={isLoading}
        >
          {isLoading ? 'Updating...' : 'Update Profile'}
        </Button>
        <Button
          type="button"
          onClick={handleLogout}
          variant="outline"
          className="border-gray-600 text-white hover:bg-gray-700"
        >
          Logout
        </Button>
      </div>
    </form>
  )
}