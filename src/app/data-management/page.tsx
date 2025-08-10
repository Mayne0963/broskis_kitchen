'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Download, 
  Trash2, 
  Edit, 
  Eye, 
  Shield, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  ShoppingBag, 
  Star,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

interface UserData {
  personalInfo: {
    name: string
    email: string
    phone: string
    dateOfBirth: string
    createdAt: string
  }
  addresses: Array<{
    id: string
    type: string
    address: string
    isDefault: boolean
  }>
  paymentMethods: Array<{
    id: string
    type: string
    lastFour: string
    expiryDate: string
  }>
  orderHistory: Array<{
    id: string
    date: string
    total: number
    status: string
  }>
  preferences: {
    notifications: boolean
    marketing: boolean
    analytics: boolean
  }
  loyaltyData: {
    points: number
    tier: string
    joinDate: string
  }
}

// Mock user data - in real app, this would come from API
const mockUserData: UserData = {
  personalInfo: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '1990-05-15',
    createdAt: '2023-01-15'
  },
  addresses: [
    {
      id: '1',
      type: 'Home',
      address: '123 Main St, Anytown, ST 12345',
      isDefault: true
    },
    {
      id: '2',
      type: 'Work',
      address: '456 Business Ave, Corporate City, ST 67890',
      isDefault: false
    }
  ],
  paymentMethods: [
    {
      id: '1',
      type: 'Visa',
      lastFour: '4242',
      expiryDate: '12/25'
    },
    {
      id: '2',
      type: 'Mastercard',
      lastFour: '8888',
      expiryDate: '08/26'
    }
  ],
  orderHistory: [
    {
      id: 'ORD-001',
      date: '2024-01-15',
      total: 45.99,
      status: 'delivered'
    },
    {
      id: 'ORD-002',
      date: '2024-01-10',
      total: 32.50,
      status: 'delivered'
    }
  ],
  preferences: {
    notifications: true,
    marketing: false,
    analytics: true
  },
  loyaltyData: {
    points: 1250,
    tier: 'Gold',
    joinDate: '2023-01-15'
  }
}

export default function DataManagementPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    // Simulate API call
    const fetchUserData = async () => {
      try {
        // In real app: const response = await fetch('/api/user/data')
        await new Promise(resolve => setTimeout(resolve, 1000))
        setUserData(mockUserData)
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleExportData = async () => {
    setExportLoading(true)
    try {
      // In real app: API call to generate and download data export
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Create and download JSON file
      const dataStr = JSON.stringify(userData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `broski-kitchen-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
    } finally {
      setExportLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }
    
    setDeleteLoading(true)
    try {
      // In real app: API call to initiate account deletion
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Account deletion request submitted. You will receive a confirmation email.')
    } catch (error) {
      console.error('Error deleting account:', error)
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Data</h1>
          <p className="text-gray-600">Unable to load your data. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Management</h1>
          <p className="text-gray-600">
            View, export, or delete your personal data in compliance with GDPR regulations.
          </p>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Your Data Rights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={handleExportData} 
                disabled={exportLoading}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {exportLoading ? 'Preparing Export...' : 'Export My Data'}
              </Button>
              
              <Button 
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {deleteLoading ? 'Processing...' : 'Delete Account'}
              </Button>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <p className="mb-2">
                <strong>Right to Access:</strong> You can view all your personal data below.
              </p>
              <p className="mb-2">
                <strong>Right to Portability:</strong> Export your data in a machine-readable format.
              </p>
              <p>
                <strong>Right to Erasure:</strong> Request deletion of your account and associated data.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-gray-900">{userData.personalInfo.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email Address</label>
                <p className="text-gray-900">{userData.personalInfo.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone Number</label>
                <p className="text-gray-900">{userData.personalInfo.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                <p className="text-gray-900">{userData.personalInfo.dateOfBirth}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Account Created</label>
                <p className="text-gray-900">{userData.personalInfo.createdAt}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <Link href="/profile">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Addresses */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Saved Addresses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userData.addresses.map((address) => (
                <div key={address.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{address.type}</span>
                      {address.isDefault && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{address.address}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userData.paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">{method.type} ending in {method.lastFour}</span>
                    <p className="text-sm text-gray-600">Expires {method.expiryDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order History */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Order History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userData.orderHistory.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">Order {order.id}</span>
                    <p className="text-sm text-gray-600">{order.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${order.total.toFixed(2)}</p>
                    <Badge 
                      variant={order.status === 'delivered' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Loyalty Data */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Loyalty Program Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Current Points</label>
                <p className="text-2xl font-bold text-amber-600">{userData.loyaltyData.points}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Tier Status</label>
                <p className="text-lg font-semibold">{userData.loyaltyData.tier}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Member Since</label>
                <p className="text-gray-900">{userData.loyaltyData.joinDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Privacy Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Email Notifications</span>
                <Badge variant={userData.preferences.notifications ? 'default' : 'secondary'}>
                  {userData.preferences.notifications ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Marketing Communications</span>
                <Badge variant={userData.preferences.marketing ? 'default' : 'secondary'}>
                  {userData.preferences.marketing ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Analytics Cookies</span>
                <Badge variant={userData.preferences.analytics ? 'default' : 'secondary'}>
                  {userData.preferences.analytics ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
            
            <div className="mt-4">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Update Preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Retention Notice */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Data Retention Policy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                <strong>Account Data:</strong> Retained while your account is active and for 30 days after deletion request.
              </p>
              <p>
                <strong>Order History:</strong> Retained for 7 years for tax and legal compliance purposes.
              </p>
              <p>
                <strong>Marketing Data:</strong> Retained until you opt out or for 3 years of inactivity.
              </p>
              <p>
                <strong>Analytics Data:</strong> Anonymized and retained for up to 26 months.
              </p>
            </div>
            
            <div className="mt-4">
              <Link href="/privacy" className="text-blue-600 hover:underline text-sm">
                Read our full Privacy Policy
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}