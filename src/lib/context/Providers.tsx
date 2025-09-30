"use client"

import type React from "react"
import type { ReactNode } from "react"
import { CartProvider } from "./CartContext"
import { AuthProvider } from "./AuthContext"
import { RewardsProvider } from "./RewardsContext"
import { DeliveryProvider } from "./DeliveryContext"
import { AgeVerificationProvider } from "./AgeVerificationContext"
import { ChatProvider } from "./ChatContext"
import { MediaPlayerProvider } from "./MediaPlayerContext"
import { UserProvider } from "./UserContext"
import { OrderProvider } from "./OrderContext"

interface ProvidersProps {
  children: ReactNode
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <UserProvider>
    <AuthProvider>
    <OrderProvider autoLoad={false}>
    <CartProvider>
    <RewardsProvider>
    <DeliveryProvider>
    <AgeVerificationProvider>
    <ChatProvider>
    <MediaPlayerProvider>
      {children}
    </MediaPlayerProvider>
    </ChatProvider>
    </AgeVerificationProvider>
    </DeliveryProvider>
    </RewardsProvider>
    </CartProvider>
    </OrderProvider>
    </AuthProvider>
    </UserProvider>
  )
}
