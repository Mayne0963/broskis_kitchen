"use client"

import { useState } from 'react'
import { MapPin, Home, Building, Plus, Clock, Truck } from 'lucide-react'

interface Address {
  id: string
  type: string
  street: string
  city: string
  state: string
  zipCode: string
  isDefault: boolean
}

interface CheckoutData {
  deliveryType: 'delivery' | 'pickup'
  selectedAddress?: Address
  newAddress?: Partial<Address>
  deliveryTime: 'asap' | 'scheduled'
  scheduledTime?: Date
  specialInstructions: string
}

interface DeliveryStepProps {
  addresses: Address[]
  checkoutData: CheckoutData
  onUpdate: (updates: Partial<CheckoutData>) => void
}

export default function DeliveryStep({ addresses, checkoutData, onUpdate }: DeliveryStepProps) {
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    type: 'home',
    street: '',
    city: '',
    state: '',
    zipCode: ''
  })
  
  const handleDeliveryTypeChange = (type: 'delivery' | 'pickup') => {
    onUpdate({ deliveryType: type })
  }
  
  const handleAddressSelect = (address: Address) => {
    onUpdate({ selectedAddress: address, newAddress: undefined })
    setShowNewAddressForm(false)
  }
  
  const handleNewAddressChange = (field: string, value: string) => {
    const updated = { ...newAddress, [field]: value }
    setNewAddress(updated)
    onUpdate({ newAddress: updated, selectedAddress: undefined })
  }
  
  const handleTimeChange = (timeType: 'asap' | 'scheduled', scheduledTime?: Date) => {
    onUpdate({ deliveryTime: timeType, scheduledTime })
  }
  
  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home':
        return <Home className="w-5 h-5" />
      case 'work':
        return <Building className="w-5 h-5" />
      default:
        return <MapPin className="w-5 h-5" />
    }
  }
  
  const formatAddress = (address: Address | Partial<Address>) => {
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`
  }
  
  const isNewAddressValid = () => {
    return newAddress.street && newAddress.city && newAddress.state && newAddress.zipCode
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Delivery Information</h2>
        <p className="text-gray-400">Choose how you'd like to receive your order</p>
      </div>
      
      {/* Delivery Type Selection */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Delivery Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleDeliveryTypeChange('delivery')}
            className={`
              p-6 rounded-lg border-2 transition-all text-left
              ${
                checkoutData.deliveryType === 'delivery'
                  ? 'border-[var(--color-harvest-gold)] bg-[var(--color-harvest-gold)]/10'
                  : 'border-gray-600 hover:border-gray-500'
              }
            `}
          >
            <div className="flex items-center mb-3">
              <Truck className={`w-6 h-6 mr-3 ${
                checkoutData.deliveryType === 'delivery' ? 'text-[var(--color-harvest-gold)]' : 'text-gray-400'
              }`} />
              <span className="text-lg font-semibold text-white">Delivery</span>
            </div>
            <p className="text-gray-400 text-sm mb-2">Get it delivered to your door</p>
            <div className="text-sm">
              <span className="text-[var(--color-harvest-gold)] font-medium">30-40 min</span>
              <span className="text-gray-400 ml-2">• $3.99 fee</span>
            </div>
          </button>
          
          <button
            onClick={() => handleDeliveryTypeChange('pickup')}
            className={`
              p-6 rounded-lg border-2 transition-all text-left
              ${
                checkoutData.deliveryType === 'pickup'
                  ? 'border-[var(--color-harvest-gold)] bg-[var(--color-harvest-gold)]/10'
                  : 'border-gray-600 hover:border-gray-500'
              }
            `}
          >
            <div className="flex items-center mb-3">
              <MapPin className={`w-6 h-6 mr-3 ${
                checkoutData.deliveryType === 'pickup' ? 'text-[var(--color-harvest-gold)]' : 'text-gray-400'
              }`} />
              <span className="text-lg font-semibold text-white">Pickup</span>
            </div>
            <p className="text-gray-400 text-sm mb-2">Pick up from our location</p>
            <div className="text-sm">
              <span className="text-[var(--color-harvest-gold)] font-medium">15-25 min</span>
              <span className="text-gray-400 ml-2">• No delivery fee</span>
            </div>
          </button>
        </div>
      </div>
      
      {/* Address Selection (only for delivery) */}
      {checkoutData.deliveryType === 'delivery' && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Delivery Address</h3>
          
          {/* Existing Addresses */}
          {addresses.length > 0 && (
            <div className="space-y-3 mb-4">
              {addresses.map((address) => (
                <button
                  key={address.id}
                  onClick={() => handleAddressSelect(address)}
                  className={`
                    w-full p-4 rounded-lg border-2 transition-all text-left
                    ${
                      checkoutData.selectedAddress?.id === address.id
                        ? 'border-[var(--color-harvest-gold)] bg-[var(--color-harvest-gold)]/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }
                  `}
                >
                  <div className="flex items-start">
                    <div className={`p-2 rounded-lg mr-3 ${
                      checkoutData.selectedAddress?.id === address.id
                        ? 'bg-[var(--color-harvest-gold)] text-black'
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {getAddressIcon(address.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <span className="text-white font-medium capitalize">{address.type}</span>
                        {address.isDefault && (
                          <span className="ml-2 px-2 py-1 bg-[var(--color-harvest-gold)] text-black text-xs font-medium rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">{formatAddress(address)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {/* Add New Address */}
          <button
            onClick={() => setShowNewAddressForm(!showNewAddressForm)}
            className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg hover:border-[var(--color-harvest-gold)] transition-colors text-center"
          >
            <Plus className="w-6 h-6 mx-auto mb-2 text-gray-400" />
            <span className="text-gray-400">Add New Address</span>
          </button>
          
          {/* New Address Form */}
          {showNewAddressForm && (
            <div className="mt-4 p-6 bg-black/30 rounded-lg border border-gray-600">
              <h4 className="text-white font-semibold mb-4">New Address</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Address Type</label>
                  <select
                    value={newAddress.type || 'home'}
                    onChange={(e) => handleNewAddressChange('type', e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--color-dark-charcoal)] border border-gray-600 rounded-lg text-white focus:border-[var(--color-harvest-gold)] focus:outline-none"
                  >
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Street Address</label>
                  <input
                    type="text"
                    value={newAddress.street || ''}
                    onChange={(e) => handleNewAddressChange('street', e.target.value)}
                    placeholder="123 Main Street"
                    className="w-full px-3 py-2 bg-[var(--color-dark-charcoal)] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-[var(--color-harvest-gold)] focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                  <input
                    type="text"
                    value={newAddress.city || ''}
                    onChange={(e) => handleNewAddressChange('city', e.target.value)}
                    placeholder="San Francisco"
                    className="w-full px-3 py-2 bg-[var(--color-dark-charcoal)] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-[var(--color-harvest-gold)] focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
                  <input
                    type="text"
                    value={newAddress.state || ''}
                    onChange={(e) => handleNewAddressChange('state', e.target.value)}
                    placeholder="CA"
                    className="w-full px-3 py-2 bg-[var(--color-dark-charcoal)] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-[var(--color-harvest-gold)] focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ZIP Code</label>
                  <input
                    type="text"
                    value={newAddress.zipCode || ''}
                    onChange={(e) => handleNewAddressChange('zipCode', e.target.value)}
                    placeholder="94102"
                    className="w-full px-3 py-2 bg-[var(--color-dark-charcoal)] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-[var(--color-harvest-gold)] focus:outline-none"
                  />
                </div>
              </div>
              
              {isNewAddressValid() && (
                <div className="mt-4 p-3 bg-gold-foil/20 border border-gold-foil/30 rounded-lg">
                  <p className="text-green-300 text-sm font-medium">✓ Address looks good!</p>
                  <p className="text-green-200/80 text-sm mt-1">{formatAddress(newAddress)}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Delivery Time */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Delivery Time</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleTimeChange('asap')}
            className={`
              p-4 rounded-lg border-2 transition-all text-left
              ${
                checkoutData.deliveryTime === 'asap'
                  ? 'border-[var(--color-harvest-gold)] bg-[var(--color-harvest-gold)]/10'
                  : 'border-gray-600 hover:border-gray-500'
              }
            `}
          >
            <div className="flex items-center mb-2">
              <Clock className={`w-5 h-5 mr-2 ${
                checkoutData.deliveryTime === 'asap' ? 'text-[var(--color-harvest-gold)]' : 'text-gray-400'
              }`} />
              <span className="text-white font-medium">ASAP</span>
            </div>
            <p className="text-gray-400 text-sm">
              {checkoutData.deliveryType === 'delivery' ? '30-40 minutes' : '15-25 minutes'}
            </p>
          </button>
          
          <button
            onClick={() => handleTimeChange('scheduled')}
            className={`
              p-4 rounded-lg border-2 transition-all text-left
              ${
                checkoutData.deliveryTime === 'scheduled'
                  ? 'border-[var(--color-harvest-gold)] bg-[var(--color-harvest-gold)]/10'
                  : 'border-gray-600 hover:border-gray-500'
              }
            `}
          >
            <div className="flex items-center mb-2">
              <Clock className={`w-5 h-5 mr-2 ${
                checkoutData.deliveryTime === 'scheduled' ? 'text-[var(--color-harvest-gold)]' : 'text-gray-400'
              }`} />
              <span className="text-white font-medium">Schedule</span>
            </div>
            <p className="text-gray-400 text-sm">Choose a specific time</p>
          </button>
        </div>
        
        {checkoutData.deliveryTime === 'scheduled' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Time</label>
            <input
              type="datetime-local"
              min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)}
              onChange={(e) => handleTimeChange('scheduled', new Date(e.target.value))}
              className="px-3 py-2 bg-[var(--color-dark-charcoal)] border border-gray-600 rounded-lg text-white focus:border-[var(--color-harvest-gold)] focus:outline-none"
            />
          </div>
        )}
      </div>
      
      {/* Special Instructions */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Special Instructions</h3>
        <textarea
          value={checkoutData.specialInstructions}
          onChange={(e) => onUpdate({ specialInstructions: e.target.value })}
          placeholder="Any special delivery instructions? (e.g., gate code, apartment number, etc.)"
          rows={3}
          className="w-full px-3 py-2 bg-[var(--color-dark-charcoal)] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-[var(--color-harvest-gold)] focus:outline-none resize-none"
        />
      </div>
    </div>
  )
}