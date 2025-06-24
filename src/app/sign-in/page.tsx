"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "../../lib/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { FaUser, FaEnvelope, FaCalendar, FaSignOutAlt, FaEdit, FaSave, FaTimes, FaCamera, FaHome, FaChevronRight } from "react-icons/fa"
import { toast } from "@/hooks/use-toast"
import { updateProfile } from "firebase/auth"
import { doc, updateDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, auth, storage } from "../../lib/services/firebase"
import { getUserProfile, updateUserProfile, UserProfile } from "../../lib/services/userService"

const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters")
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout, isLoading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [userFirestoreProfile, setUserFirestoreProfile] = useState<UserProfile | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Fetch user's Firestore profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id) {
        const profile = await getUserProfile(user.id)
        setUserFirestoreProfile(profile)
      }
    }
    fetchProfile()
  }, [user?.id])

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth")
    }
  }, [user, isLoading, router])

  const handleLogout = async () => {
    try {
      // Call the session logout API
      const response = await fetch('/api/auth/session-logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        await logout()
        toast({
          title: "Logged out",
          description: "You have been successfully logged out",
          duration: 3000,
        })
        router.push("/")
      } else {
        throw new Error('Session logout failed')
      }
    } catch (error) {
      console.error("Logout error:", error)
      // Fallback to regular logout
      await logout()
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
        duration: 3000,
      })
      router.push("/")
    }
  }

  const handleAvatarUpload = async (file: File) => {
    if (!user?.id) return
    
    setIsUploadingAvatar(true)
    try {
      // Create a reference to the file in Firebase Storage
      const avatarRef = ref(storage, `avatars/${user.id}/${file.name}`)
      
      // Upload the file
      const snapshot = await uploadBytes(avatarRef, file)
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      // Update user profile with new avatar URL
      await updateUserProfile(user.id, {
        avatarUrl: downloadURL
      })
      
      // Update local state
      setUserFirestoreProfile(prev => prev ? { ...prev, avatarUrl: downloadURL } : null)
      setAvatarPreview(downloadURL)
      
      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated successfully.",
      })
    } catch (error) {
      console.error("Avatar upload error:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please select an image file.",
          variant: "destructive",
        })
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        })
        return
      }
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      
      // Upload the file
      handleAvatarUpload(file)
    }
  }

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return
    
    setIsSaving(true)
    try {
      // Update Firebase Auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: values.displayName
        })
      }

      // Update Firestore user document
      if (user.id) {
        await updateUserProfile(user.id, {
          displayName: values.displayName,
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

  // Show loading state while checking authentication or fetching profile
  if (isLoading || (user && !userFirestoreProfile)) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--color-harvest-gold)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading profile...</p>
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
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header Bar */}
      <div className="w-full bg-[#1A1A1A] border-b border-[#333333] shadow-lg">
        <div className="container mx-auto px-4 py-6">
          {/* Breadcrumbs */}
          <div className="flex items-center text-sm text-gray-400 mb-4">
            <Link href="/" className="hover:text-[var(--color-harvest-gold)] transition-colors flex items-center">
              <FaHome className="mr-1" />
              Home
            </Link>
            <FaChevronRight className="mx-2 text-xs" />
            <span className="text-[var(--color-harvest-gold)]">Profile</span>
          </div>
          
          {/* Page Title */}
          <h1 className="text-4xl font-bold text-[var(--color-harvest-gold)] mb-2">My Profile</h1>
          <p className="text-gray-300">Manage your account information and preferences</p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Avatar & Basic Info */}
          <div className="space-y-6">
            <Card className="bg-[#1A1A1A] border-[#333333] shadow-xl">
              <CardHeader className="text-center pb-6">
                {/* Avatar Section */}
                <div className="relative mx-auto mb-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[var(--color-harvest-gold)] shadow-lg">
                    {avatarPreview || userFirestoreProfile?.avatarUrl ? (
                      <Image
                        src={avatarPreview || userFirestoreProfile?.avatarUrl || ''}
                        alt="Profile Avatar"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[var(--color-harvest-gold)] bg-opacity-20 flex items-center justify-center">
                        <FaUser className="text-[var(--color-harvest-gold)] text-4xl" />
                      </div>
                    )}
                  </div>
                  
                  {/* Avatar Upload Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-[var(--color-harvest-gold)] hover:bg-[var(--color-harvest-gold)]/90 text-black rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingAvatar ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FaCamera className="text-sm" />
                    )}
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                
                <CardTitle className="text-2xl text-white mb-2">
                  {userFirestoreProfile?.displayName || user.name}
                </CardTitle>
                <CardDescription className="text-gray-400 text-lg">
                  {userFirestoreProfile?.email || user.email}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Plan Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-medium">Current Plan</span>
                  <Badge 
                    variant="outline" 
                    className={`border-2 px-4 py-2 font-bold text-sm ${
                      (userFirestoreProfile?.plan || 'Free').toLowerCase() === 'premium' 
                        ? 'border-[var(--color-harvest-gold)] text-[var(--color-harvest-gold)] bg-[var(--color-harvest-gold)]/10'
                        : 'border-gray-500 text-gray-300 bg-gray-500/10'
                    }`}
                  >
                    {(userFirestoreProfile?.plan || "Free").toUpperCase()}
                  </Badge>
                </div>
                
                {/* Member Since */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-medium">Member Since</span>
                  <span className="text-white font-medium">
                    {formatDate(userFirestoreProfile?.createdAt)}
                  </span>
                </div>
                
                {/* Sign Out Button */}
                <div className="pt-4 border-t border-[#333333]">
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200"
                  >
                    <FaSignOutAlt className="mr-2" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Editable Information */}
          <div className="space-y-6">
            <Card className="bg-[#1A1A1A] border-[#333333] shadow-xl">
              <CardHeader className="border-b border-[#333333]">
                <CardTitle className="text-2xl text-white flex items-center">
                  <FaEdit className="mr-3 text-[var(--color-harvest-gold)]" />
                  Personal Information
                </CardTitle>
                <CardDescription className="text-gray-400 text-base">
                  Update your account details and preferences.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* Display Name Field */}
                    <FormField
                      control={form.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300 text-base font-semibold flex items-center">
                            <FaUser className="mr-2 text-[var(--color-harvest-gold)]" />
                            Display Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your display name"
                              {...field}
                              disabled={!isEditing || isSaving}
                              className="bg-[#0A0A0A] border-[#333333] text-white text-lg py-3 focus-visible:ring-2 focus-visible:ring-[var(--color-harvest-gold)] focus-visible:border-[var(--color-harvest-gold)] transition-all duration-200"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />

                    {/* Email Field (Read-only) */}
                    <FormItem>
                      <FormLabel className="text-gray-300 text-base font-semibold flex items-center">
                        <FaEnvelope className="mr-2 text-[var(--color-harvest-gold)]" />
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          value={userFirestoreProfile?.email || user.email || ""}
                          disabled
                          className="bg-[#0A0A0A] border-[#333333] text-gray-400 text-lg py-3 cursor-not-allowed opacity-60"
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500 mt-1">
                        Email address cannot be changed. Contact support if needed.
                      </p>
                    </FormItem>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-[#333333]">
                      {!isEditing ? (
                        <Button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          size="lg"
                          className="bg-[var(--color-harvest-gold)] text-black hover:bg-[var(--color-harvest-gold)]/90 font-semibold px-8 transition-all duration-200 hover:scale-105"
                        >
                          <FaEdit className="mr-2" />
                          Edit Profile
                        </Button>
                      ) : (
                        <>
                          <Button
                            type="button"
                            onClick={handleCancelEdit}
                            variant="outline"
                            size="lg"
                            className="border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white font-semibold px-6 transition-all duration-200"
                            disabled={isSaving}
                          >
                            <FaTimes className="mr-2" />
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            size="lg"
                            className="bg-[var(--color-harvest-gold)] text-black hover:bg-[var(--color-harvest-gold)]/90 font-semibold px-8 transition-all duration-200 hover:scale-105"
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <>
                                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <FaSave className="mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
