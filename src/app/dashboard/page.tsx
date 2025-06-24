import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "../../lib/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FaHome, FaChevronRight, FaUser, FaShoppingCart, FaGift, FaMusic } from "react-icons/fa"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1A1A1A] text-white">
        <p>Loading dashboard...</p>
      </div>
    )
  }

  if (!user) {
    return null // Should be redirected by useEffect
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header Bar with Breadcrumbs */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Link href="/" className="flex items-center hover:text-gold-500">
              <FaHome className="mr-1" /> Home
            </Link>
            <FaChevronRight className="h-3 w-3" />
            <span>Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold text-gold-500">My Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Profile Card */}
          <Card className="bg-gray-800 text-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-gold-500">Profile Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2">Welcome, {user.name || user.email}!</p>
              <p className="mb-4 text-sm text-gray-400">Manage your personal information.</p>
              <Button asChild className="w-full bg-gold-600 hover:bg-gold-700">
                <Link href="/profile">
                  <FaUser className="mr-2" /> View Profile
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Orders Card */}
          <Card className="bg-gray-800 text-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-gold-500">My Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-gray-400">Track your recent orders and view order history.</p>
              <Button asChild className="w-full bg-gold-600 hover:bg-gold-700">
                <Link href="/orders">
                  <FaShoppingCart className="mr-2" /> View Orders
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Rewards Card */}
          <Card className="bg-gray-800 text-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-gold-500">My Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-gray-400">Check your loyalty points and redeem rewards.</p>
              <Button asChild className="w-full bg-gold-600 hover:bg-gold-700">
                <Link href="/rewards">
                  <FaGift className="mr-2" /> View Rewards
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Music Card (Example of another section) */}
          <Card className="bg-gray-800 text-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-gold-500">My Music</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-gray-400">Explore your saved music and playlists.</p>
              <Button asChild className="w-full bg-gold-600 hover:bg-gold-700">
                <Link href="/music">
                  <FaMusic className="mr-2" /> Go to Music
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}