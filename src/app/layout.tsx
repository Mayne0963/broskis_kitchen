import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import "./chat-animations.css"
import ConditionalNavbar from "../components/layout/ConditionalNavbar"
import Footer from "../components/layout/Footer"
import { Providers } from "../lib/context/Providers"
import { OrderProvider } from "../lib/context/OrderContext"
import MusicPlayer from "../components/layout/MusicPlayer"
import ErrorBoundary from "../components/common/ErrorBoundary"
import ChunkErrorHandler from "../components/common/ChunkErrorHandler"
import CookieConsent from "../components/gdpr/CookieConsent"
import { Toaster } from "react-hot-toast"
import { playfair, montserrat } from "./fonts"

export const metadata: Metadata = {
  title: "Broski's Kitchen - Luxury Street Gourmet",
  description: "Experience luxury street gourmet with Broski's Kitchen - where flavor meets culture.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${montserrat.variable} bg-black text-white min-h-screen flex flex-col`}>
        <ErrorBoundary>
          <ChunkErrorHandler />
          <Providers>
            <OrderProvider>
              <ConditionalNavbar />
              <main className="flex-grow">{children}</main>
              <Footer />
              <MusicPlayer />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#1f2937',
                    color: '#fff',
                  },
                }}
              />
              <CookieConsent />
            </OrderProvider>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
