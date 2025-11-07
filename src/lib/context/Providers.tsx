"use client"

import { SessionProvider } from "next-auth/react"
import { UserProvider } from "./UserContext"
import { AuthProvider } from "./AuthContext"
import { AuthLoadingProvider } from "./AuthLoadingContext"
import { OrderProvider } from "./OrderContext"
import { CartProvider } from "./CartContext"
import { RewardsProvider } from "./RewardsContext"
import { DeliveryProvider } from "./DeliveryContext"
import { AgeVerificationProvider } from "./AgeVerificationContext"
import { ChatProvider } from "./ChatContext"
import { MediaPlayerProvider } from "./MediaPlayerContext"

interface ProvidersProps {
  children: React.ReactNode
}

// Combine core providers that are always needed
function CoreProviders({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <AuthProvider>
        <AuthLoadingProvider>
          <UserProvider>
            {children}
          </UserProvider>
        </AuthLoadingProvider>
      </AuthProvider>
    </SessionProvider>
  )
}

// Combine app-specific providers
function AppProviders({ children }: ProvidersProps) {
  return (
    <CartProvider>
      <OrderProvider>
        <DeliveryProvider>
          {children}
        </DeliveryProvider>
      </OrderProvider>
    </CartProvider>
  )
}

// Combine feature providers that may not always be needed
function FeatureProviders({ children }: ProvidersProps) {
  return (
    <RewardsProvider>
      <AgeVerificationProvider>
        <ChatProvider>
          <MediaPlayerProvider>
            {children}
          </MediaPlayerProvider>
        </ChatProvider>
      </AgeVerificationProvider>
    </RewardsProvider>
  )
}

export function Providers({ children }: ProvidersProps) {
  return (
    <CoreProviders>
      <AppProviders>
        <FeatureProviders>
          {children}
        </FeatureProviders>
      </AppProviders>
    </CoreProviders>
  )
}
