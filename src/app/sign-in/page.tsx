'use client'

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
import { FaUser, FaEnvelope, FaSignOutAlt, FaEdit, FaSave, FaTimes, FaCamera, FaHome, FaChevronRight } from "react-icons/fa"
import { toast } from "@/hooks/use-toast"
import { updateProfile } from "firebase/auth"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { auth, storage } from "../../lib/services/firebase"
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
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: user?.name || "" }
  })

  // Sync user data
  useEffect(() => {
    if (user?.id) {
      getUserProfile(user.id).then(p => {
        setProfile(p)
        form.setValue("displayName", p.displayName)
      })
    }
  }, [user?.id, form])

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) router.push('/auth')
  }, [isLoading, user, router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/session-logout', { method: 'POST' })
      await logout()
      toast({ title: 'Logged out', description: 'You have been logged out.' })
      router.push('/')
    } catch {
      await logout()
      router.push('/')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!file.type.startsWith('image/')) return toast({ title: 'Invalid file', variant: 'destructive' })
    if (file.size > 5_000_000) return toast({ title: 'File too large', variant: 'destructive' })

    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)

    setIsUploadingAvatar(true)
    const upload = async () => {
      const avatarRef = ref(storage, `avatars/${user.id}/${file.name}`)
      const snap = await uploadBytes(avatarRef, file)
      const url = await getDownloadURL(snap.ref)
      await updateUserProfile(user.id, { avatarUrl: url })
      setProfile(prev => prev ? { ...prev, avatarUrl: url } : prev)
      toast({ title: 'Avatar updated' })
    }
    upload().catch(() => toast({ title: 'Upload failed', variant: 'destructive' }))
      .finally(() => setIsUploadingAvatar(false))
  }

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return
    setIsSaving(true)
    try {
      if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: values.displayName })
      await updateUserProfile(user.id, { displayName: values.displayName, updatedAt: new Date() })
      toast({ title: 'Profile updated' })
      setIsEditing(false)
    } catch {
      toast({ title: 'Update failed', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || (user && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }
  if (!user) return null

  const formatDate = (d?: any) => d?.toDate ? d.toDate().toLocaleDateString() : new Date(d).toLocaleDateString()

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Navbar offset */}
      <main className="pt-16 container mx-auto px-4 pb-20 max-w-5xl space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center text-gray-400 text-sm">
          <Link href="/" className="flex items-center hover:text-amber-400">
            <FaHome className="mr-1" /> Home
          </Link>
          <FaChevronRight className="mx-2" />
          <span className="text-amber-400">Profile</span>
        </div>

        {/* Profile Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Avatar Card */}
          <Card className="bg-[#1A1A1A] border-[#333]">
            <CardHeader className="text-center">
              <div className="relative mx-auto mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-amber-400 mx-auto">
                  {avatarPreview || profile.avatarUrl ? (
                    <Image src={avatarPreview || profile.avatarUrl!} alt="Avatar" width={128} height={128} className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-amber-400 bg-opacity-20 flex items-center justify-center">
                      <FaUser className="text-amber-400 text-4xl" />
                    </div>
                  )}
                </div>
                <button onClick={() => fileInputRef.current?.click()} disabled={isUploadingAvatar}
                  className="absolute bottom-0 right-0 bg-amber-400 p-2 rounded-full shadow-lg hover:bg-amber-500 disabled:opacity-50">
                  {isUploadingAvatar ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/> : <FaCamera className="text-black" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </div>
              <CardTitle className="text-2xl">{profile.displayName}</CardTitle>
              <CardDescription>{profile.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Current Plan</span>
                <Badge variant="outline" className="text-amber-400 border-amber-400">
                  {profile.plan.toUpperCase()}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Member Since</span>
                <span>{formatDate(profile.createdAt)}</span>
              </div>
              <Button onClick={handleLogout} variant="outline" className="w-full text-red-500 border-red-500 hover:bg-red-500 hover:text-white">
                <FaSignOutAlt className="mr-2" /> Sign Out
              </Button>
            </CardContent>
          </Card>

          {/* Edit Card */}
          <Card className="bg-[#1A1A1A] border-[#333]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FaEdit className="mr-2 text-amber-400" /> Personal Information
              </CardTitle>
              <CardDescription>Update your details</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form} >
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField control={form.control} name="displayName" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-gray-300"><FaUser className="mr-2 text-amber-400"/> Display Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isEditing} className="bg-[#0A0A0A] border-[#333]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>

                  <FormItem>
                    <FormLabel className="flex items-center text-gray-300"><FaEnvelope className="mr-2 text-amber-400"/> Email</FormLabel>
                    <FormControl>
                      <Input value={profile.email} disabled className="bg-[#0A0A0A] border-[#333] text-gray-400 cursor-not-allowed" />
                    </FormControl>
                  </FormItem>

                  <div className="flex justify-end space-x-4">
                    {!isEditing ? ( 
                      <Button type="button" onClick={() => setIsEditing(true)} className="bg-amber-400 text-black">
                        <FaEdit className="mr-2"/> Edit
                      </Button>
                    ) : (
                      <>
                        <Button type="button" variant="outline" onClick={() => { form.setValue('displayName', profile.displayName); setIsEditing(false); }} disabled={isSaving}>
                          <FaTimes className="mr-2"/> Cancel
                        </Button>
                        <Button type="submit" className="bg-amber-400 text-black" disabled={isSaving}>
                          {isSaving ? <FaSave className="animate-spin mr-2" /> : <FaSave className="mr-2"/>} Save
                        </Button>
                      </>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

