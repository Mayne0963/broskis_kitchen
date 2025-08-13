'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle, 
  X,
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
  Search,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/context/AuthContext'

interface MenuDrop {
  id: string
  name: string
  description?: string
  status: 'active' | 'scheduled' | 'ended'
  startTime: Date
  endTime: Date
  totalQuantity: number
  soldQuantity: number
  revenue: number
  price: number
  category?: string
  image?: string
  createdAt: Date
  updatedAt: Date
}

interface MenuDropsTabProps {
  initialMenuDrops?: MenuDrop[]
}

interface NewMenuDrop {
  name: string
  description: string
  price: number
  quantity: number
  startTime: string
  endTime: string
  image: string
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-gold-foil/20 text-gold-foil'
    case 'scheduled':
      return 'bg-harvest-gold/20 text-harvest-gold'
    case 'ended':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return CheckCircle
    case 'scheduled':
      return Clock
    case 'ended':
      return X
    default:
      return Clock
  }
}

const formatDateTime = (date: Date) => {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export default function MenuDropsTab({ initialMenuDrops = [] }: MenuDropsTabProps) {
  const [menuDrops, setMenuDrops] = useState<MenuDrop[]>(initialMenuDrops)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingDrop, setEditingDrop] = useState<MenuDrop | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'scheduled' | 'ended'>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'special' | 'seasonal' | 'limited'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [newDrop, setNewDrop] = useState<NewMenuDrop>({
    name: '',
    description: '',
    price: 0,
    quantity: 0,
    startTime: '',
    endTime: '',
    image: ''
  })

  const { user } = useAuth()

  // Fetch menu drops from API endpoint
  const fetchMenuDrops = async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const token = await user.getIdToken()
      const response = await fetch('/api/admin/menu-drops', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch menu drops')
      }

      const data = await response.json()
      const menuDropsData = data.menuDrops.map((drop: any) => ({
        ...drop,
        startTime: new Date(drop.startTime),
        endTime: new Date(drop.endTime),
        createdAt: new Date(drop.createdAt),
        updatedAt: new Date(drop.updatedAt)
      }))
      
      setMenuDrops(menuDropsData)
      setError(null)
    } catch (error) {
      console.error('Error fetching menu drops:', error)
      setError('Failed to load menu drops')
      setMenuDrops(initialMenuDrops)
    } finally {
      setIsLoading(false)
    }
  }

  // Set up periodic data fetching
  useEffect(() => {
    fetchMenuDrops()
    
    // Refresh every 30 seconds
    const intervalId = setInterval(fetchMenuDrops, 30000)
    
    return () => clearInterval(intervalId)
  }, [user])

  // Filter menu drops based on search, status, category, and date
  const filteredMenuDrops = menuDrops.filter(drop => {
    const matchesSearch = 
      drop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drop.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || drop.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || drop.category === categoryFilter
    
    // Date filtering
    let matchesDate = true
    if (dateFilter !== 'all') {
      const dropDate = new Date(drop.createdAt)
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      switch (dateFilter) {
        case 'today':
          matchesDate = dropDate >= today
          break
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = dropDate >= weekAgo
          break
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDate = dropDate >= monthAgo
          break
      }
    }
    
    return matchesSearch && matchesStatus && matchesCategory && matchesDate
  })

  const handleCreateDrop = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!isFirebaseConfigured || !db) {
        throw new Error('Firebase not configured')
      }

      const menuDropsRef = collection(db, 'menuDrops')
      const now = new Date()
      const startTime = new Date(newDrop.startTime)
      const endTime = new Date(newDrop.endTime)
      
      // Determine status based on start/end times
      let status: 'active' | 'scheduled' | 'ended' = 'scheduled'
      if (now >= startTime && now <= endTime) {
        status = 'active'
      } else if (now > endTime) {
        status = 'ended'
      }

      await addDoc(menuDropsRef, {
        name: newDrop.name,
        description: newDrop.description,
        price: newDrop.price,
        totalQuantity: newDrop.quantity,
        soldQuantity: 0,
        revenue: 0,
        status,
        startTime: Timestamp.fromDate(startTime),
        endTime: Timestamp.fromDate(endTime),
        image: newDrop.image,
        category: 'special', // Default category
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      })

      toast.success('Menu drop created successfully!')
      setShowCreateForm(false)
      setNewDrop({
        name: '',
        description: '',
        price: 0,
        quantity: 0,
        startTime: '',
        endTime: '',
        image: ''
      })
    } catch (error) {
      console.error('Error creating menu drop:', error)
      toast.error('Failed to create menu drop')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteDrop = async (dropId: string) => {
    if (!confirm('Are you sure you want to delete this menu drop?')) {
      return
    }

    try {
      if (!isFirebaseConfigured || !db) {
        throw new Error('Firebase not configured')
      }

      const dropRef = doc(db, 'menuDrops', dropId)
      await deleteDoc(dropRef)
      toast.success('Menu drop deleted successfully!')
    } catch (error) {
      console.error('Error deleting menu drop:', error)
      toast.error('Failed to delete menu drop')
    }
  }

  const getProgressPercentage = (sold: number, total: number) => {
    return total > 0 ? (sold / total) * 100 : 0
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-black to-gray-900 min-h-screen p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Menu Drops Management</h2>
          <p className="text-gray-400">
            Create and manage limited-time menu offerings
          </p>
        </div>
        
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-[#B7985A] to-[#FFD700] text-black font-semibold hover:from-[#FFD700] hover:to-[#B7985A] transition-all duration-300"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Menu Drop
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search menu drops..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-[#B7985A]/30 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger className="w-[140px] bg-gray-800 border-[#B7985A]/30 text-white focus:border-[#FFD700]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-[#B7985A]/30">
            <SelectItem value="all" className="text-white hover:bg-gray-700">All Status</SelectItem>
            <SelectItem value="active" className="text-white hover:bg-gray-700">Active</SelectItem>
            <SelectItem value="scheduled" className="text-white hover:bg-gray-700">Scheduled</SelectItem>
            <SelectItem value="ended" className="text-white hover:bg-gray-700">Ended</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={categoryFilter} onValueChange={(value: any) => setCategoryFilter(value)}>
          <SelectTrigger className="w-[140px] bg-gray-800 border-[#B7985A]/30 text-white focus:border-[#FFD700]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-[#B7985A]/30">
            <SelectItem value="all" className="text-white hover:bg-gray-700">All Categories</SelectItem>
            <SelectItem value="special" className="text-white hover:bg-gray-700">Special</SelectItem>
            <SelectItem value="seasonal" className="text-white hover:bg-gray-700">Seasonal</SelectItem>
            <SelectItem value="limited" className="text-white hover:bg-gray-700">Limited</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
          <SelectTrigger className="w-[140px] bg-gray-800 border-[#B7985A]/30 text-white focus:border-[#FFD700]">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-[#B7985A]/30">
            <SelectItem value="all" className="text-white hover:bg-gray-700">All Time</SelectItem>
            <SelectItem value="today" className="text-white hover:bg-gray-700">Today</SelectItem>
            <SelectItem value="week" className="text-white hover:bg-gray-700">This Week</SelectItem>
            <SelectItem value="month" className="text-white hover:bg-gray-700">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-gray-900 to-black border-[#B7985A]/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Active Drops</CardTitle>
            <CheckCircle className="h-4 w-4 text-[#FFD700]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#FFD700]">
              {filteredMenuDrops.filter(drop => drop.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-gray-900 to-black border-[#B7985A]/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-[#FFD700]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#FFD700]">
              {filteredMenuDrops.filter(drop => drop.status === 'scheduled').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-gray-900 to-black border-[#B7985A]/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-[#FFD700]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#FFD700]">
              {formatCurrency(filteredMenuDrops.reduce((sum, drop) => sum + drop.revenue, 0))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-gray-900 to-black border-[#B7985A]/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Items Sold</CardTitle>
            <Package className="h-4 w-4 text-[#FFD700]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#FFD700]">
              {filteredMenuDrops.reduce((sum, drop) => sum + drop.soldQuantity, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Drops List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-white">Loading menu drops...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-red-400">{error}</div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredMenuDrops.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">No menu drops found</div>
            </div>
          ) : (
            filteredMenuDrops.map((drop) => {
          const StatusIcon = getStatusIcon(drop.status)
          const progressPercentage = getProgressPercentage(drop.soldQuantity, drop.totalQuantity)
          
          return (
            <Card key={drop.id} className="bg-gradient-to-br from-gray-900 to-black border-[#B7985A]/30 hover:border-[#FFD700]/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg text-white">{drop.name}</h3>
                    <Badge className={`${getStatusColor(drop.status)} bg-black/50`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {drop.status}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingDrop(drop)}
                      className="border-[#B7985A] text-[#FFD700] hover:bg-[#B7985A]/20 hover:text-[#FFD700]"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDrop(drop.id)}
                      className="border-red-600 text-red-400 hover:bg-red-900/20 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-400">Start Time</p>
                    <p className="font-medium text-white">{formatDateTime(drop.startTime)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400">End Time</p>
                    <p className="font-medium text-white">{formatDateTime(drop.endTime)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400">Sold / Total</p>
                    <p className="font-medium text-[#FFD700]">{drop.soldQuantity} / {drop.totalQuantity}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400">Revenue</p>
                    <p className="font-medium text-[#FFD700]">{formatCurrency(drop.revenue)}</p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white">{Math.round(progressPercentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-[#B7985A] to-[#FFD700] h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )}

      {/* Create Menu Drop Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 to-black border-[#B7985A]/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Create New Menu Drop</CardTitle>
                  <CardDescription className="text-gray-400">
                    Set up a limited-time menu offering
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateDrop} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Name</Label>
                    <Input
                      id="name"
                      value={newDrop.name}
                      onChange={(e) => setNewDrop({ ...newDrop, name: e.target.value })}
                      placeholder="e.g., Weekend BBQ Special"
                      className="bg-gray-800 border-[#B7985A]/30 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-white">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={newDrop.price}
                      onChange={(e) => setNewDrop({ ...newDrop, price: parseFloat(e.target.value) })}
                      placeholder="25.99"
                      className="bg-gray-800 border-[#B7985A]/30 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">Description</Label>
                  <Textarea
                    id="description"
                    value={newDrop.description}
                    onChange={(e) => setNewDrop({ ...newDrop, description: e.target.value })}
                    placeholder="Describe the menu drop..."
                    className="bg-gray-800 border-[#B7985A]/30 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
                    rows={3}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-white">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={newDrop.quantity}
                      onChange={(e) => setNewDrop({ ...newDrop, quantity: parseInt(e.target.value) })}
                      placeholder="50"
                      className="bg-gray-800 border-[#B7985A]/30 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="image" className="text-white">Image URL</Label>
                    <Input
                      id="image"
                      value={newDrop.image}
                      onChange={(e) => setNewDrop({ ...newDrop, image: e.target.value })}
                      placeholder="https://..."
                      className="bg-gray-800 border-[#B7985A]/30 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime" className="text-white">Start Time</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={newDrop.startTime}
                      onChange={(e) => setNewDrop({ ...newDrop, startTime: e.target.value })}
                      className="bg-gray-800 border-[#B7985A]/30 text-white focus:border-[#FFD700]"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endTime" className="text-white">End Time</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={newDrop.endTime}
                      onChange={(e) => setNewDrop({ ...newDrop, endTime: e.target.value })}
                      className="bg-gray-800 border-[#B7985A]/30 text-white focus:border-[#FFD700]"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-[#B7985A] to-[#FFD700] text-black font-semibold hover:from-[#FFD700] hover:to-[#B7985A] transition-all duration-300" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Menu Drop'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    className="border-[#B7985A] text-[#FFD700] hover:bg-[#B7985A]/20 hover:text-[#FFD700]"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}