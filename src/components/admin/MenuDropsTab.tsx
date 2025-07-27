'use client'

import { useState } from 'react'
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
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'

interface MenuDrop {
  id: string
  name: string
  status: 'active' | 'scheduled' | 'ended'
  startTime: Date
  endTime: Date
  totalQuantity: number
  soldQuantity: number
  revenue: number
}

interface MenuDropsTabProps {
  menuDrops: MenuDrop[]
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

export default function MenuDropsTab({ menuDrops }: MenuDropsTabProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingDrop, setEditingDrop] = useState<MenuDrop | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newDrop, setNewDrop] = useState<NewMenuDrop>({
    name: '',
    description: '',
    price: 0,
    quantity: 0,
    startTime: '',
    endTime: '',
    image: ''
  })

  const handleCreateDrop = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/menu-drops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newDrop)
      })

      if (response.ok) {
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
        // TODO: Refresh the menu drops list
      } else {
        throw new Error('Failed to create menu drop')
      }
    } catch (error) {
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
      // TODO: Replace with actual API call
      const response = await fetch(`/api/menu-drops/${dropId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Menu drop deleted successfully!')
        // TODO: Refresh the menu drops list
      } else {
        throw new Error('Failed to delete menu drop')
      }
    } catch (error) {
      toast.error('Failed to delete menu drop')
    }
  }

  const getProgressPercentage = (sold: number, total: number) => {
    return total > 0 ? (sold / total) * 100 : 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Menu Drops Management</h2>
          <p className="text-muted-foreground">
            Create and manage limited-time menu offerings
          </p>
        </div>
        
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Menu Drop
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Drops</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {menuDrops.filter(drop => drop.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {menuDrops.filter(drop => drop.status === 'scheduled').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(menuDrops.reduce((sum, drop) => sum + drop.revenue, 0))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {menuDrops.reduce((sum, drop) => sum + drop.soldQuantity, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Drops List */}
      <div className="grid gap-4">
        {menuDrops.map((drop) => {
          const StatusIcon = getStatusIcon(drop.status)
          const progressPercentage = getProgressPercentage(drop.soldQuantity, drop.totalQuantity)
          
          return (
            <Card key={drop.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{drop.name}</h3>
                    <Badge className={getStatusColor(drop.status)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {drop.status}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingDrop(drop)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDrop(drop.id)}
                      className="text-[var(--color-harvest-gold)] hover:text-[var(--color-harvest-gold)]"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Start Time</p>
                    <p className="font-medium">{formatDateTime(drop.startTime)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">End Time</p>
                    <p className="font-medium">{formatDateTime(drop.endTime)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Sold / Total</p>
                    <p className="font-medium">{drop.soldQuantity} / {drop.totalQuantity}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="font-medium text-green-600">{formatCurrency(drop.revenue)}</p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gold-foil h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Create Menu Drop Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Create New Menu Drop</CardTitle>
                  <CardDescription>
                    Set up a limited-time menu offering
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateDrop} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newDrop.name}
                      onChange={(e) => setNewDrop({ ...newDrop, name: e.target.value })}
                      placeholder="e.g., Weekend BBQ Special"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={newDrop.price}
                      onChange={(e) => setNewDrop({ ...newDrop, price: parseFloat(e.target.value) })}
                      placeholder="25.99"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newDrop.description}
                    onChange={(e) => setNewDrop({ ...newDrop, description: e.target.value })}
                    placeholder="Describe the menu drop..."
                    rows={3}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={newDrop.quantity}
                      onChange={(e) => setNewDrop({ ...newDrop, quantity: parseInt(e.target.value) })}
                      placeholder="50"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="image">Image URL</Label>
                    <Input
                      id="image"
                      value={newDrop.image}
                      onChange={(e) => setNewDrop({ ...newDrop, image: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={newDrop.startTime}
                      onChange={(e) => setNewDrop({ ...newDrop, startTime: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={newDrop.endTime}
                      onChange={(e) => setNewDrop({ ...newDrop, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Menu Drop'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
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