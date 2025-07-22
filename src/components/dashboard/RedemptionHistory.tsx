"use client"

import { Clock, CheckCircle, XCircle, Star } from 'lucide-react'

interface Redemption {
  id: string
  offerTitle: string
  pointsUsed: number
  redeemedAt: Date
  status: 'used' | 'expired' | 'active'
}

interface RedemptionHistoryProps {
  redemptions: Redemption[]
}

export default function RedemptionHistory({ redemptions }: RedemptionHistoryProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'used':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'expired':
        return <XCircle className="w-5 h-5 text-red-400" />
      case 'active':
        return <Clock className="w-5 h-5 text-[var(--color-harvest-gold)]" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'used':
        return 'Used'
      case 'expired':
        return 'Expired'
      case 'active':
        return 'Active'
      default:
        return 'Unknown'
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'used':
        return 'text-green-400 bg-green-400/20'
      case 'expired':
        return 'text-red-400 bg-red-400/20'
      case 'active':
        return 'text-[var(--color-harvest-gold)] bg-[var(--color-harvest-gold)]/20'
      default:
        return 'text-gray-400 bg-gray-400/20'
    }
  }
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }
  
  const sortedRedemptions = [...redemptions].sort(
    (a, b) => b.redeemedAt.getTime() - a.redeemedAt.getTime()
  )
  
  if (redemptions.length === 0) {
    return (
      <div className="bg-[var(--color-dark-charcoal)] rounded-lg p-8 border border-[var(--color-harvest-gold)]/20">
        <div className="text-center">
          <Clock className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Redemption History</h3>
          <p className="text-gray-500">
            Start redeeming rewards to see your history here!
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-[var(--color-dark-charcoal)] rounded-lg border border-[var(--color-harvest-gold)]/20">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-white">Recent Redemptions</h4>
          <span className="text-sm text-gray-400">
            {redemptions.length} total redemption{redemptions.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      
      {/* Redemptions List */}
      <div className="divide-y divide-gray-700">
        {sortedRedemptions.map((redemption) => (
          <div key={redemption.id} className="p-6 hover:bg-black/20 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h5 className="text-lg font-semibold text-white mr-3">
                    {redemption.offerTitle}
                  </h5>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(redemption.status)}`}>
                    {getStatusIcon(redemption.status)}
                    <span className="ml-1">{getStatusText(redemption.status)}</span>
                  </div>
                </div>
                
                <div className="flex items-center text-sm text-gray-400 mb-2">
                  <Star className="w-4 h-4 mr-1 text-[var(--color-harvest-gold)]" />
                  <span className="font-medium">{redemption.pointsUsed.toLocaleString()}</span>
                  <span className="ml-1">points used</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>Redeemed on {formatDate(redemption.redeemedAt)}</span>
                </div>
              </div>
              
              {/* Action based on status */}
              <div className="ml-4">
                {redemption.status === 'active' && (
                  <button className="px-4 py-2 bg-[var(--color-harvest-gold)] text-black text-sm font-semibold rounded-lg hover:bg-[var(--color-harvest-gold)]/90 transition-colors">
                    Use Now
                  </button>
                )}
                
                {redemption.status === 'used' && (
                  <div className="text-green-400 text-sm font-medium">
                    ✓ Completed
                  </div>
                )}
                
                {redemption.status === 'expired' && (
                  <div className="text-red-400 text-sm font-medium">
                    ✗ Expired
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer */}
      {redemptions.length > 5 && (
        <div className="p-4 border-t border-gray-700 text-center">
          <button className="text-[var(--color-harvest-gold)] hover:text-[var(--color-harvest-gold)]/80 text-sm font-medium transition-colors">
            View All Redemptions
          </button>
        </div>
      )}
    </div>
  )
}