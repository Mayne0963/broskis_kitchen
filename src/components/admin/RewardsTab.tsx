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
  Gift, 
  Star, 
  TrendingUp, 
  Users,
  X,
  Calendar,
  Target,
  Search,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/context/AuthContext'

interface RewardOffer {
  id: string
  title: string
  description: string
  pointsCost: number
  type: 'food' | 'discount' | 'service' | 'bonus'
  category: string
  validUntil: Date
  isActive: boolean
  maxRedemptions: number
  currentRedemptions: number
  terms: string
  createdAt: Date
  updatedAt: Date
}

interface RewardsData {
  totalPointsIssued: number
  totalPointsRedeemed: number
  activeOffers: number
  totalRedemptions: number
  topRedemptions: Array<{
    offer: string
    count: number
    points: number
  }>
}

interface RewardsTabProps {
  rewardsData?: RewardsData
  initialOffers?: RewardOffer[]
}

interface NewOffer {
  title: string
  description: string
  pointsCost: number
  type: 'food' | 'discount' | 'service' | 'bonus'
  category: string
  validDays: number
  maxRedemptions: number
  terms: string
}

const defaultRewardsData: RewardsData = {
  totalPointsIssued: 0,
  totalPointsRedeemed: 0,
  activeOffers: 0,
  totalRedemptions: 0,
  topRedemptions: []
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'food':
      return 'bg-orange-100 text-orange-800'
    case 'discount':
      return 'bg-gold-foil/20 text-gold-foil'
    case 'service':
      return 'bg-harvest-gold/20 text-harvest-gold'
    case 'bonus':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'food':
      return Gift
    case 'discount':
      return TrendingUp
    case 'service':
      return Star
    case 'bonus':
      return Target
    default:
      return Gift
  }
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export default function RewardsTab({ rewardsData = defaultRewardsData, initialOffers = [] }: RewardsTabProps) {
  const [offers, setOffers] = useState<RewardOffer[]>(initialOffers)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingOffer, setEditingOffer] = useState<RewardOffer | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'food' | 'discount' | 'service' | 'bonus'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [newOffer, setNewOffer] = useState<NewOffer>({
    title: '',
    description: '',
    pointsCost: 0,
    type: 'food',
    category: '',
    validDays: 30,
    maxRedemptions: 100,
    terms: ''
  })

  const { user } = useAuth()

  // Fetch offers from API endpoint
  const fetchOffers = async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const token = await user.getIdToken()
      const response = await fetch('/api/admin/offers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch offers')
      }

      const data = await response.json()
      const offersData = data.offers.map((offer: any) => ({
        ...offer,
        validUntil: new Date(offer.endsAt || offer.validUntil),
        createdAt: new Date(offer.createdAt),
        updatedAt: new Date(offer.updatedAt || offer.createdAt)
      }))
      
      setOffers(offersData)
      setError(null)
    } catch (error) {
      console.error('Error fetching offers:', error)
      setError('Failed to load offers')
      setOffers(initialOffers)
    } finally {
      setIsLoading(false)
    }
  }

  // Set up periodic data fetching
  useEffect(() => {
    fetchOffers()
    
    // Refresh every 30 seconds
    const intervalId = setInterval(fetchOffers, 30000)
    
    return () => clearInterval(intervalId)
  }, [user])

  // Filter offers based on search, status, type, and date
  const filteredOffers = offers.filter(offer => {
    const matchesSearch = 
      offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && offer.isActive) ||
      (statusFilter === 'inactive' && !offer.isActive)
    
    const matchesType = typeFilter === 'all' || offer.type === typeFilter
    
    // Date filtering
    let matchesDate = true
    if (dateFilter !== 'all') {
      const offerDate = new Date(offer.createdAt)
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      switch (dateFilter) {
        case 'today':
          matchesDate = offerDate >= today
          break
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = offerDate >= weekAgo
          break
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDate = offerDate >= monthAgo
          break
      }
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesDate
  })

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!isFirebaseConfigured || !db) {
        throw new Error('Firebase not configured')
      }

      const offersRef = collection(db, 'rewardOffers')
      const now = new Date()
      const validUntil = new Date(now.getTime() + newOffer.validDays * 24 * 60 * 60 * 1000)

      await addDoc(offersRef, {
        title: newOffer.title,
        description: newOffer.description,
        pointsCost: newOffer.pointsCost,
        type: newOffer.type,
        category: newOffer.category,
        validUntil: Timestamp.fromDate(validUntil),
        isActive: true,
        maxRedemptions: newOffer.maxRedemptions,
        currentRedemptions: 0,
        terms: newOffer.terms,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      })

      toast.success('Reward offer created successfully!')
      setShowCreateForm(false)
      setNewOffer({
        title: '',
        description: '',
        pointsCost: 0,
        type: 'food',
        category: '',
        validDays: 30,
        maxRedemptions: 100,
        terms: ''
      })
    } catch (error) {
      console.error('Error creating reward offer:', error)
      toast.error('Failed to create reward offer')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleOffer = async (offerId: string) => {
    try {
      if (!isFirebaseConfigured || !db) {
        throw new Error('Firebase not configured')
      }

      const offer = offers.find(o => o.id === offerId)
      if (!offer) return

      const offerRef = doc(db, 'rewardOffers', offerId)
      await updateDoc(offerRef, {
        isActive: !offer.isActive,
        updatedAt: Timestamp.fromDate(new Date())
      })

      toast.success('Offer status updated successfully!')
    } catch (error) {
      console.error('Error updating offer status:', error)
      toast.error('Failed to update offer status')
    }
  }

  const handleDeleteOffer = async (offerId: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) {
      return
    }

    try {
      if (!isFirebaseConfigured || !db) {
        throw new Error('Firebase not configured')
      }

      const offerRef = doc(db, 'rewardOffers', offerId)
      await deleteDoc(offerRef)
      toast.success('Offer deleted successfully!')
    } catch (error) {
      console.error('Error deleting offer:', error)
      toast.error('Failed to delete offer')
    }
  }

  const getRedemptionRate = (current: number, max: number) => {
    return max > 0 ? (current / max) * 100 : 0
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-black to-gray-900 min-h-screen p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Rewards Management</h2>
          <p className="text-gray-400">
            Manage loyalty program and reward offers
          </p>
        </div>
        
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-[#B7985A] to-[#FFD700] text-black font-semibold hover:from-[#FFD700] hover:to-[#B7985A] transition-all duration-300"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Offer
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search reward offers..."
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
            <SelectItem value="inactive" className="text-white hover:bg-gray-700">Inactive</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
          <SelectTrigger className="w-[140px] bg-gray-800 border-[#B7985A]/30 text-white focus:border-[#FFD700]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-[#B7985A]/30">
            <SelectItem value="all" className="text-white hover:bg-gray-700">All Types</SelectItem>
            <SelectItem value="food" className="text-white hover:bg-gray-700">Food</SelectItem>
            <SelectItem value="discount" className="text-white hover:bg-gray-700">Discount</SelectItem>
            <SelectItem value="service" className="text-white hover:bg-gray-700">Service</SelectItem>
            <SelectItem value="bonus" className="text-white hover:bg-gray-700">Bonus</SelectItem>
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
            <CardTitle className="text-sm font-medium text-white">Points Issued</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#FFD700]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#FFD700]">
              {rewardsData.totalPointsIssued.toLocaleString()}
            </div>
            <p className="text-xs text-gray-400">
              Total points awarded
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-gray-900 to-black border-[#B7985A]/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Points Redeemed</CardTitle>
            <Gift className="h-4 w-4 text-[#FFD700]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#FFD700]">
              {rewardsData.totalPointsRedeemed.toLocaleString()}
            </div>
            <p className="text-xs text-gray-400">
              {Math.round((rewardsData.totalPointsRedeemed / rewardsData.totalPointsIssued) * 100)}% redemption rate
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-gray-900 to-black border-[#B7985A]/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Active Offers</CardTitle>
            <Star className="h-4 w-4 text-[#FFD700]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#FFD700]">
              {filteredOffers.filter(offer => offer.isActive).length}
            </div>
            <p className="text-xs text-gray-400">
              Currently available
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-gray-900 to-black border-[#B7985A]/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Redemptions</CardTitle>
            <Users className="h-4 w-4 text-[#FFD700]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#FFD700]">
              {rewardsData.totalRedemptions}
            </div>
            <p className="text-xs text-gray-400">
              All time redemptions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Redemptions */}
      <Card className="bg-gradient-to-br from-gray-900 to-black border-[#B7985A]/30">
        <CardHeader>
          <CardTitle className="text-white">Top Performing Offers</CardTitle>
          <CardDescription className="text-gray-400">
            Most popular reward redemptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rewardsData.topRedemptions.map((redemption, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#B7985A] to-[#FFD700] flex items-center justify-center">
                    <span className="text-sm font-medium text-black">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">{redemption.offer}</p>
                    <p className="text-sm text-gray-400">
                      {redemption.points.toLocaleString()} points each
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-[#FFD700]">{redemption.count} redemptions</p>
                  <p className="text-sm text-gray-400">
                    {(redemption.count * redemption.points).toLocaleString()} total points
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Offers List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-white">Loading reward offers...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-red-400">{error}</div>
        </div>
      ) : (
        <div className="grid gap-4">
          <h3 className="text-lg font-semibold text-white">All Offers</h3>
          {filteredOffers.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">No reward offers found</div>
            </div>
          ) : (
            filteredOffers.map((offer) => {
              const TypeIcon = getTypeIcon(offer.type)
              const redemptionRate = getRedemptionRate(offer.currentRedemptions, offer.maxRedemptions)
              
              return (
                <Card key={offer.id} className="bg-gradient-to-br from-gray-900 to-black border-[#B7985A]/30 hover:border-[#FFD700]/50 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <TypeIcon className="h-5 w-5 text-[#FFD700]" />
                        <div>
                          <h4 className="font-semibold text-white">{offer.title}</h4>
                          <p className="text-sm text-gray-400">{offer.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={`${getTypeColor(offer.type)} bg-black/50`}>
                          {offer.type}
                        </Badge>
                        <Badge variant={offer.isActive ? 'default' : 'secondary'} className={offer.isActive ? 'bg-[#B7985A] text-black' : 'bg-gray-700 text-gray-300'}>
                          {offer.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-400">Points Cost</p>
                        <p className="font-medium text-[#FFD700]">{offer.pointsCost} points</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-400">Redemptions</p>
                        <p className="font-medium text-white">{offer.currentRedemptions} / {offer.maxRedemptions}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-400">Valid Until</p>
                        <p className="font-medium text-white">{formatDate(offer.validUntil)}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-400">Category</p>
                        <p className="font-medium capitalize text-white">{offer.category}</p>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Redemption Progress</span>
                        <span className="text-white">{Math.round(redemptionRate)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[#B7985A] to-[#FFD700] h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${redemptionRate}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleOffer(offer.id)}
                        className="border-[#B7985A] text-[#FFD700] hover:bg-[#B7985A]/20 hover:text-[#FFD700]"
                      >
                        {offer.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingOffer(offer)}
                        className="border-[#B7985A] text-[#FFD700] hover:bg-[#B7985A]/20 hover:text-[#FFD700]"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteOffer(offer.id)}
                        className="border-red-600 text-red-400 hover:bg-red-900/20 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Create Offer Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 to-black border-[#B7985A]/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Create New Reward Offer</CardTitle>
                  <CardDescription className="text-gray-400">
                    Set up a new reward for your loyalty program
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
              <form onSubmit={handleCreateOffer} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-white">Title</Label>
                    <Input
                      id="title"
                      value={newOffer.title}
                      onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
                      placeholder="e.g., Free Appetizer"
                      className="bg-gray-800 border-[#B7985A]/30 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pointsCost" className="text-white">Points Cost</Label>
                    <Input
                      id="pointsCost"
                      type="number"
                      value={newOffer.pointsCost}
                      onChange={(e) => setNewOffer({ ...newOffer, pointsCost: parseInt(e.target.value) })}
                      placeholder="500"
                      className="bg-gray-800 border-[#B7985A]/30 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">Description</Label>
                  <Textarea
                    id="description"
                    value={newOffer.description}
                    onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
                    placeholder="Describe the reward offer..."
                    className="bg-gray-800 border-[#B7985A]/30 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
                    rows={3}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-white">Type</Label>
                    <Select value={newOffer.type} onValueChange={(value: any) => setNewOffer({ ...newOffer, type: value })}>
                      <SelectTrigger className="bg-gray-800 border-[#B7985A]/30 text-white focus:border-[#FFD700]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-[#B7985A]/30">
                        <SelectItem value="food" className="text-white hover:bg-gray-700">Food</SelectItem>
                        <SelectItem value="discount" className="text-white hover:bg-gray-700">Discount</SelectItem>
                        <SelectItem value="service" className="text-white hover:bg-gray-700">Service</SelectItem>
                        <SelectItem value="bonus" className="text-white hover:bg-gray-700">Bonus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-white">Category</Label>
                    <Input
                      id="category"
                      value={newOffer.category}
                      onChange={(e) => setNewOffer({ ...newOffer, category: e.target.value })}
                      placeholder="e.g., appetizer, delivery"
                      className="bg-gray-800 border-[#B7985A]/30 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="validDays" className="text-white">Valid for (days)</Label>
                    <Input
                      id="validDays"
                      type="number"
                      value={newOffer.validDays}
                      onChange={(e) => setNewOffer({ ...newOffer, validDays: parseInt(e.target.value) })}
                      placeholder="30"
                      className="bg-gray-800 border-[#B7985A]/30 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxRedemptions" className="text-white">Max Redemptions</Label>
                    <Input
                      id="maxRedemptions"
                      type="number"
                      value={newOffer.maxRedemptions}
                      onChange={(e) => setNewOffer({ ...newOffer, maxRedemptions: parseInt(e.target.value) })}
                      placeholder="100"
                      className="bg-gray-800 border-[#B7985A]/30 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="terms" className="text-white">Terms & Conditions</Label>
                  <Textarea
                    id="terms"
                    value={newOffer.terms}
                    onChange={(e) => setNewOffer({ ...newOffer, terms: e.target.value })}
                    placeholder="Enter terms and conditions..."
                    className="bg-gray-800 border-[#B7985A]/30 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
                    rows={3}
                    required
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-[#B7985A] to-[#FFD700] text-black font-semibold hover:from-[#FFD700] hover:to-[#B7985A] transition-all duration-300" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Offer'}
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