"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../lib/context/AuthContext"
import { FaUser, FaEnvelope, FaLock, FaSignOutAlt, FaHistory, FaHeart, FaCreditCard } from "react-icons/fa"
import { toast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState("profile")

  // Redirect to login if not authenticated
  if (!isLoading && !user) {
    router.push("/auth/login")
    return null
  }

  const handleLogout = async () => {
    await logout()
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
      duration: 3000,
    })
    router.push("/")
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">My Account</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[#1A1A1A] rounded-lg border border-[#333333] overflow-hidden">
              <div className="p-6 bg-[#111111] border-b border-[#333333]">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gold-foil bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                    <FaUser className="text-gold-foil" />
                  </div>
                  <div>
                    <h2 className="font-bold">{user?.name}</h2>
                    <p className="text-sm text-gray-400">{user?.email}</p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <nav className="space-y-1">
                  <button
                    className={`w-full text-left px-4 py-2 rounded-md flex items-center ${
                      activeTab === "profile" ? "bg-gold-foil bg-opacity-20 text-gold-foil" : "hover:bg-[#222222]"
                    }`}
                    onClick={() => setActiveTab("profile")}
                  >
                    <FaUser className="mr-3" /> Profile
                  </button>
                  <button
                    className={`w-full text-left px-4 py-2 rounded-md flex items-center ${
                      activeTab === "orders" ? "bg-gold-foil bg-opacity-20 text-gold-foil" : "hover:bg-[#222222]"
                    }`}
                    onClick={() => setActiveTab("orders")}
                  >
                    <FaHistory className="mr-3" /> Order History
                  </button>
                  <button
                    className={`w-full text-left px-4 py-2 rounded-md flex items-center ${
                      activeTab === "favorites" ? "bg-gold-foil bg-opacity-20 text-gold-foil" : "hover:bg-[#222222]"
                    }`}
                    onClick={() => setActiveTab("favorites")}
                  >
                    <FaHeart className="mr-3" /> Favorites
                  </button>
                  <button
                    className={`w-full text-left px-4 py-2 rounded-md flex items-center ${
                      activeTab === "payment" ? "bg-gold-foil bg-opacity-20 text-gold-foil" : "hover:bg-[#222222]"
                    }`}
                    onClick={() => setActiveTab("payment")}
                  >
                    <FaCreditCard className="mr-3" /> Payment Methods
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 rounded-md flex items-center text-blood-red hover:bg-[#222222]"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt className="mr-3" /> Logout
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-[#1A1A1A] rounded-lg border border-[#333333] p-6">
              {activeTab === "profile" && (
                <div className="animate-fade-in">
                  <h2 className="text-xl font-bold mb-6">Profile Information</h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name</label>
                      <div className="flex items-center">
                        <div className="bg-[#222222] p-3 rounded-l-md border-y border-l border-[#333333]">
                          <FaUser className="text-gray-500" />
                        </div>
                        <input
                          type="text"
                          value={user?.name || ""}
                          readOnly
                          className="input rounded-l-none w-full bg-[#222222]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Email Address</label>
                      <div className="flex items-center">
                        <div className="bg-[#222222] p-3 rounded-l-md border-y border-l border-[#333333]">
                          <FaEnvelope className="text-gray-500" />
                        </div>
                        <input
                          type="email"
                          value={user?.email || ""}
                          readOnly
                          className="input rounded-l-none w-full bg-[#222222]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Password</label>
                      <div className="flex items-center">
                        <div className="bg-[#222222] p-3 rounded-l-md border-y border-l border-[#333333]">
                          <FaLock className="text-gray-500" />
                        </div>
                        <input
                          type="password"
                          value="••••••••"
                          readOnly
                          className="input rounded-l-none w-full bg-[#222222]"
                        />
                      </div>
                      <div className="mt-2">
                        <button
                          className="text-gold-foil hover:underline text-sm"
                          onClick={() => router.push("/auth/forgot-password")}
                        >
                          Change Password
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#333333]">
                      <button className="btn-primary">Edit Profile</button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "orders" && (
                <div className="animate-fade-in">
                  <h2 className="text-xl font-bold mb-6">Order History</h2>
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-[#222222] rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaHistory className="text-gray-500 text-2xl" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Orders Yet</h3>
                    <p className="text-gray-400 mb-6">You haven't placed any orders yet.</p>
                    <button className="btn-primary" onClick={() => router.push("/menu")}>
                      Browse Menu
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "favorites" && (
                <div className="animate-fade-in">
                  <h2 className="text-xl font-bold mb-6">Favorites</h2>
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-[#222222] rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaHeart className="text-gray-500 text-2xl" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Favorites Yet</h3>
                    <p className="text-gray-400 mb-6">You haven't added any items to your favorites yet.</p>
                    <button className="btn-primary" onClick={() => router.push("/menu")}>
                      Browse Menu
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "payment" && (
                <div className="animate-fade-in">
                  <h2 className="text-xl font-bold mb-6">Payment Methods</h2>
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-[#222222] rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaCreditCard className="text-gray-500 text-2xl" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Payment Methods</h3>
                    <p className="text-gray-400 mb-6">You haven't added any payment methods yet.</p>
                    <button className="btn-primary">Add Payment Method</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
