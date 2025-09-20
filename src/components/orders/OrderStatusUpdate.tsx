'use client'

import React, { useState } from 'react'
import { OrderStatus, Order } from '@/types/order'
import { safeFetch } from '@/lib/utils/safeFetch'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  getNextStatusesForRole,
  validateStatusUpdate,
  STATUS_INFO,
  getStatusColorClass
} from '@/lib/utils/orderStatusValidation'
import {
  Clock,
  CheckCircle,
  ChefHat,
  Package,
  Truck,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react'

interface OrderStatusUpdateProps {
  order: Order
  userRole: string
  onStatusUpdate?: (orderId: string, newStatus: OrderStatus) => void
  disabled?: boolean
  showHistory?: boolean
  className?: string
}

const iconMap = {
  Clock,
  CheckCircle,
  ChefHat,
  Package,
  Truck,
  MapPin,
  CheckCircle2,
  XCircle
}

export default function OrderStatusUpdate({
  order,
  userRole,
  onStatusUpdate,
  disabled = false,
  showHistory = false,
  className = ''
}: OrderStatusUpdateProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('')
  const [reason, setReason] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const currentStatus = order.status
  const orderType = order.orderType
  const nextStatuses = getNextStatusesForRole(currentStatus, orderType, userRole)

  const handleStatusUpdate = async () => {
    if (!selectedStatus) {
      toast.error('Please select a status')
      return
    }

    // Validate the status update
    const validation = validateStatusUpdate({
      currentStatus,
      newStatus: selectedStatus,
      orderType,
      userRole
    })

    if (!validation.valid) {
      toast.error(validation.error || 'Invalid status update')
      return
    }

    setIsUpdating(true)

    try {
      const response = await safeFetch(`/api/orders/${order.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: selectedStatus,
          reason: reason.trim() || undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update order status')
      }

      const data = await response.json()
      
      toast.success(`Order status updated to ${STATUS_INFO[selectedStatus].label}`)
      
      // Call the callback if provided
      if (onStatusUpdate) {
        onStatusUpdate(order.id, selectedStatus)
      }

      // Reset form
      setSelectedStatus('')
      setReason('')
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update order status')
    } finally {
      setIsUpdating(false)
    }
  }

  const getCurrentStatusInfo = () => {
    const info = STATUS_INFO[currentStatus]
    const IconComponent = iconMap[info.icon as keyof typeof iconMap]
    
    return {
      ...info,
      IconComponent
    }
  }

  const statusInfo = getCurrentStatusInfo()
  const IconComponent = statusInfo.IconComponent

  if (nextStatuses.length === 0 && !showHistory) {
    return (
      <div className="flex items-center gap-2">
        <Badge className={getStatusColorClass(currentStatus)}>
          <IconComponent className="w-3 h-3 mr-1" />
          {statusInfo.label}
        </Badge>
        {currentStatus === 'completed' && (
          <span className="text-sm text-green-600">✓ Final status</span>
        )}
        {currentStatus === 'cancelled' && (
          <span className="text-sm text-red-600">✗ Cancelled</span>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Badge className={getStatusColorClass(currentStatus)}>
          <IconComponent className="w-3 h-3 mr-1" />
          {statusInfo.label}
        </Badge>
        
        {nextStatuses.length > 0 && !disabled && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Update Status
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Update Order Status</DialogTitle>
                <DialogDescription>
                  Update the status for order #{order.id}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Status</Label>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColorClass(currentStatus)}>
                      <IconComponent className="w-3 h-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {statusInfo.description}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">New Status</Label>
                  <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as OrderStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      {nextStatuses.map((status) => {
                        const info = STATUS_INFO[status]
                        const StatusIcon = iconMap[info.icon as keyof typeof iconMap]
                        return (
                          <SelectItem key={status} value={status}>
                            <div className="flex items-center gap-2">
                              <StatusIcon className="w-4 h-4" />
                              <span>{info.label}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason (Optional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Add a reason for this status change..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                  />
                </div>

                {selectedStatus && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900">
                          Status will change to: {STATUS_INFO[selectedStatus].label}
                        </p>
                        <p className="text-blue-700">
                          {STATUS_INFO[selectedStatus].description}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStatusUpdate}
                  disabled={!selectedStatus || isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Update Status'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {showHistory && order.statusHistory && order.statusHistory.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Status History</h4>
          <div className="space-y-2">
            {order.statusHistory.map((entry: any, index: number) => {
              const entryInfo = STATUS_INFO[entry.status as OrderStatus]
              const EntryIcon = iconMap[entryInfo.icon as keyof typeof iconMap]
              
              return (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <EntryIcon className="w-3 h-3" />
                    <Badge variant="outline" className="text-xs">
                      {entryInfo.label}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                  {entry.reason && (
                    <span className="text-muted-foreground italic">
                      - {entry.reason}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}