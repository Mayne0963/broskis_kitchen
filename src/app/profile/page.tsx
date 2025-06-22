"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../lib/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { FaUser, FaEnvelope, FaCalendar, FaSignOutAlt, FaEdit, FaSave, FaTimes } from "react-icons/fa"
import { toast } from "@/hooks/use-toast"
import { updateProfile } from "firebase/auth"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters")
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout, isLoading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.name || ""
    }
  })

  // Update form when user data loads
  useEffect(() => {
    if (user?.name) {
      form.setValue("displayName", user.name)
    }
  }, [user, form])

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth")
    }
  }, [user, isLoading, router])

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
        duration: 3000,
      })
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return
    
    setIsSaving(true)
    try {
      // Update Firebase Auth profile
      if (user.firebaseUser) {
        await updateProfile(user.firebaseUser, {
          displayName: values.displayName
        })
      }

      // Update Firestore user document
      if (db) {
        const userRef = doc(db, "users", user.uid)
        await updateDoc(userRef, {
          name: values.displayName,
          updatedAt: new Date()
        })
      }

      toast({
        title: "Profile Updated",
        description: "Your display name has been updated successfully.",
      })
      
      setIsEditing(false)
    } catch (error) {
      console.error("Profile update error:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    form.setValue("displayName", user?.name || "")
    setIsEditing(false)
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--color-harvest-gold)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if user is not authenticated (redirect will happen)
  if (!user) {
    return null
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown"
    
    try {
      // Handle Firestore Timestamp
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString()
      }
      // Handle regular Date
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString()
      }
      // Handle string dates
      return new Date(timestamp).toLocaleDateString()
    } catch (error) {
      return "Unknown"
    }
  }

  return (
    <div className="min-h-screen py-20 bg-[#0A0A0A]">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-gray-400">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Summary Card */}
          <div className="lg:col-span-1">
            <Card className="bg-[#1A1A1A] border-[#333333]">
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-[var(--color-harvest-gold)] bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaUser className="text-[var(--color-harvest-gold)] text-2xl" />
                </div>
                <CardTitle className="text-white">{user.name}</CardTitle>
                <CardDescription className="text-gray-400">{user.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Plan</span>
                    <span className="text-[var(--color-harvest-gold)] font-medium capitalize">
                      {user.plan || "Free"}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Member Since</span>
                    <span className="text-white">
                      {formatDate(user.createdAt)}
                    </span>
                  </div>
                  
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                  >
                    <FaSignOutAlt className="mr-2" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <Card className="bg-[#1A1A1A] border-[#333333]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Profile Information</CardTitle>
                    <CardDescription className="text-gray-400">
                      Update your personal information
                    </CardDescription>
                  </div>
                  {!isEditing && (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      size="sm"
                      className="border-[var(--color-harvest-gold)] text-[var(--color-harvest-gold)] hover:bg-[var(--color-harvest-gold)] hover:text-[var(--color-rich-black)]"
                    >
                      <FaEdit className="mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Display Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center">
                    <FaUser className="mr-2" />
                    Display Name
                  </label>
                  {isEditing ? (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="displayName"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Enter your display name"
                                  className="bg-[#111111] border-[#333333] text-white"
                                  disabled={isSaving}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            size="sm"
                            className="bg-[var(--color-harvest-gold)] hover:bg-[var(--color-harvest-gold)]/90 text-[var(--color-rich-black)]"
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <>
                                <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <FaSave className="mr-2" />
                                Save
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                            className="border-gray-500 text-gray-400 hover:bg-gray-500 hover:text-white"
                          >
                            <FaTimes className="mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    <div className="p-3 bg-[#111111] border border-[#333333] rounded-md text-white">
                      {user.name || "Not set"}
                    </div>
                  )}
                </div>

                {/* Email (Read-only) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center">
                    <FaEnvelope className="mr-2" />
                    Email Address
                  </label>
                  <div className="p-3 bg-[#111111] border border-[#333333] rounded-md text-gray-400">
                    {user.email}
                  </div>
                  <p className="text-xs text-gray-500">
                    Email address cannot be changed. Contact support if you need to update it.
                  </p>
                </div>

                {/* Account Created (Read-only) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center">
                    <FaCalendar className="mr-2" />
                    Account Created
                  </label>
                  <div className="p-3 bg-[#111111] border border-[#333333] rounded-md text-gray-400">
                    {formatDate(user.createdAt)}
                  </div>
                </div>

                {/* Plan (Read-only) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Current Plan
                  </label>
                  <div className="p-3 bg-[#111111] border border-[#333333] rounded-md">
                    <span className="text-[var(--color-harvest-gold)] font-medium capitalize">
                      {user.plan || "Free"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
