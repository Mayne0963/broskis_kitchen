'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Truck, Phone, MapPin, Clock, User } from 'lucide-react'
import { Order } from '@/types/order'
import { getOTWOrderStatus } from '@/lib/services/otw-integration'

interface OTWTrackerProps {
  order: Order
}

interface TrackingInfo {
  status: string
  estimatedDelivery: string
  driver?: {
    name: string
    phone: string
    vehicle: string
    location?: { lat: number; lng: number }
  }
  lastUpdate: string
}

export default function OTWTracker({ order }: OTWTrackerProps) {
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTrackingInfo = useCallback(async () => {
    if (!order.otwOrderId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await getOTWOrderStatus(order.otwOrderId)
      if (result.success && result.data) {
        setTrackingInfo({
          status: result.data.status,
          estimatedDelivery: result.data.estimated_delivery,
          driver: result.data.driver,
          lastUpdate: result.data.last_update
        })
      } else {
        setError(result.error || 'Failed to fetch tracking info')
      }
    } catch (err) {
      setError('Unable to connect to tracking service')
      console.error('Error fetching OTW tracking:', err)
    } finally {
      setLoading(false)
    }
  }, [order.otwOrderId])

  useEffect(() => {
    // Only fetch if this is a delivery order with OTW order ID
    if (order.orderType === 'delivery' && order.otwOrderId) {
      fetchTrackingInfo()
      
      // Auto-refresh tracking info every 30 seconds for active deliveries
      const interval = setInterval(() => {
        if (order.status === 'out_for_delivery' || order.status === 'preparing') {
          fetchTrackingInfo()
        }
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [order.otwOrderId, order.status, order.orderType, fetchTrackingInfo])

  // Only show for delivery orders with OTW order ID
  if (order.orderType !== 'delivery' || !order.otwOrderId) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'accepted':
        return 'bg-gold-foil/20 text-gold-foil'
      case 'preparing':
      case 'driver_assigned':
        return 'bg-[var(--color-harvest-gold)]/20 text-[var(--color-harvest-gold)]'
      case 'out_for_delivery':
      case 'driver_pickup':
        return 'bg-orange-100 text-orange-800'
      case 'delivered':
        return 'bg-harvest-gold/20 text-harvest-gold'
      case 'cancelled':
        return 'bg-gold-foil/20 text-gold-foil'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (timeString: string) => {
    try {
      return new Date(timeString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return timeString
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Truck className="h-5 w-5 text-blue-600" />
          OTW Delivery Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Loading tracking info...</span>
          </div>
        )}

        {error && (
          <div className="bg-gold-foil/10 border border-gold-foil/30 rounded-lg p-3">
            <p className="text-[var(--color-harvest-gold)] text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchTrackingInfo}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        )}

        {trackingInfo && (
          <>
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <Badge className={getStatusColor(trackingInfo.status)}>
                {trackingInfo.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>

            {/* Estimated Delivery */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Estimated Delivery:
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {formatTime(trackingInfo.estimatedDelivery)}
              </span>
            </div>

            {/* Driver Information */}
            {trackingInfo.driver && (
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <h4 className="font-medium text-gray-900 flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Driver Information
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{trackingInfo.driver.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vehicle:</span>
                    <span className="font-medium">{trackingInfo.driver.vehicle}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Contact:</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 px-2"
                      onClick={() => window.open(`tel:${trackingInfo.driver?.phone}`)}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      {trackingInfo.driver.phone}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Live Location (if available) */}
            {trackingInfo.driver?.location && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  const { lat, lng } = trackingInfo.driver!.location!
                  window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank')
                }}
              >
                <MapPin className="h-4 w-4 mr-2" />
                View Driver Location
              </Button>
            )}

            {/* Last Update */}
            <div className="text-xs text-gray-500 text-center pt-2 border-t">
              Last updated: {formatTime(trackingInfo.lastUpdate)}
            </div>

            {/* Refresh Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchTrackingInfo}
              className="w-full"
              disabled={loading}
            >
              Refresh Tracking
            </Button>
          </>
        )}

        {/* OTW Order ID */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          OTW Order ID: {order.otwOrderId}
        </div>
      </CardContent>
    </Card>
  )
}