import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/session'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Shield, Calendar } from "lucide-react"
import ProfileForm from '@/components/profile/ProfileForm'

// Force dynamic rendering to ensure fresh auth checks
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProfilePage() {
  // Verify session on the server
  const user = await getServerUser()
  
  // If no valid session, redirect to login (middleware should handle this, but this is a fallback)
  if (!user) {
    redirect('/login?next=/profile')
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="bg-gradient-to-r from-yellow-400 to-yellow-600">
            <div className="flex items-center space-x-6">
              <Avatar className="w-24 h-24 border-4 border-white">
                <AvatarFallback className="bg-gray-600 text-white text-2xl">
                  {(user.name || user.email || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-3xl font-bold text-white">
                  {user.name || "Welcome!"}
                </CardTitle>
                <CardDescription className="text-yellow-100">
                  {user.email}
                </CardDescription>
                {user.role === 'admin' && (
                  <Badge className="mt-2 bg-red-500 text-white">
                    <Shield className="w-4 h-4 mr-1" />
                    Admin
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center text-gray-300">
                  <User className="w-4 h-4 mr-2" />
                  <span className="font-medium">Name:</span>
                </div>
                <p className="text-white ml-6">{user.name || 'Not provided'}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-gray-300">
                  <Mail className="w-4 h-4 mr-2" />
                  <span className="font-medium">Email:</span>
                </div>
                <p className="text-white ml-6">{user.email}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-gray-300">
                  <Shield className="w-4 h-4 mr-2" />
                  <span className="font-medium">Role:</span>
                </div>
                <p className="text-white ml-6 capitalize">{user.role}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-gray-300">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="font-medium">Email Verified:</span>
                </div>
                <p className="text-white ml-6">
                  {user.emailVerified ? (
                    <Badge className="bg-green-500">Verified</Badge>
                  ) : (
                    <Badge className="bg-red-500">Not Verified</Badge>
                  )}
                </p>
              </div>
            </div>
            
            <Separator className="bg-gray-700" />
            
            {/* Client-side profile form component for editing */}
            <ProfileForm user={user} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

