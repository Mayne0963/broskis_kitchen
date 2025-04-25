"use client"

import type React from "react"

import { createContext, useState, useContext, type ReactNode } from "react"
import type { DeliveryContextType, DeliveryAddress } from "@/types"

// Create the context with a default undefined value
const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined)

// Provider component
export const DeliveryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [deliveryAddress, setDeliveryAddressState] = useState<DeliveryAddress | null>(null)
  const [isDelivery, setIsDeliveryState] = useState<boolean>(false)
  const [estimatedTime, setEstimatedTimeState] = useState<string | null>(null)

  // Set delivery address and automatically set isDelivery to true
  const setDeliveryAddress = (address: DeliveryAddress) => {
    setDeliveryAddressState(address)
    setIsDeliveryState(true)
  }

  // Set delivery mode and reset estimated time when changed
  const setIsDelivery = (value: boolean) => {
    setIsDeliveryState(value)
    setEstimatedTimeState(null)
  }

  // Set estimated delivery/pickup time
  const setEstimatedTime = (time: string) => {
    setEstimatedTimeState(time)
  }

  // Clear all delivery information
  const clearDeliveryInfo = () => {
    setDeliveryAddressState(null)
    setEstimatedTimeState(null)
  }

  return (
    <DeliveryContext.Provider
      value={{
        deliveryAddress,
        isDelivery,
        estimatedTime,
        setDeliveryAddress,
        setIsDelivery,
        setEstimatedTime,
        clearDeliveryInfo,
      }}
    >
      {children}
    </DeliveryContext.Provider>
  )
}

// Custom hook to use the delivery context
export const useDelivery = (): DeliveryContextType => {
  const context = useContext(DeliveryContext)

  if (context === undefined) {
    throw new Error("useDelivery must be used within a DeliveryProvider")
  }

  return context
}
