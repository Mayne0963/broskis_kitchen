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

interface ProvidersProps {
  children: ReactNode
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <UserProvider>
    <AuthProvider>
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
    </AuthProvider>
    </UserProvider>
  )
}
