import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import "./chat-animations.css"
import NavBar from "../components/layout/Navbar"
import Footer from "../components/layout/Footer"
import { Providers } from "../lib/context/Providers"
import MusicPlayer from "../components/layout/MusicPlayer"
import ErrorBoundary from "../components/common/ErrorBoundary"
import ChunkErrorHandler from "../components/common/ChunkErrorHandler"
import ResourceErrorBoundary from "../components/common/ResourceErrorBoundary"
import ProductionErrorBoundary from "../components/common/ProductionErrorBoundary"
import ErrorMonitor from "../components/common/ErrorMonitor"
import PerformanceMonitor from "../components/common/PerformanceMonitor"
import CookieConsent from "../components/gdpr/CookieConsent"
import SEOAudit from "../components/seo/SEOAudit"
import SchemaGenerator from "../components/seo/SchemaGenerator"
import { NetworkStatus } from "../components/common/EnhancedLoadingStates"
import ServiceWorkerCleanup from "../components/common/ServiceWorkerCleanup"
import { getServerSession } from "next-auth"
import { authOptions } from "./api/auth/[...nextauth]/route"
import Link from "next/link"
import { isAdmin } from "../lib/roles"

import { playfair, montserrat } from "./fonts"
import StructuredData, { OrganizationStructuredData } from "../components/seo/StructuredData"
import { SkipNavigation } from "../components/accessibility/AccessibilityEnhancer"
import AccessibilityAudit from "../components/accessibility/AccessibilityAudit"
import PWAManager from "../components/pwa/PWAManager"

export const metadata: Metadata = {
  title: {
    default: "Broski's Kitchen - Luxury Street Gourmet",
    template: "%s | Broski's Kitchen"
  },
  description: "Experience luxury street gourmet with Broski's Kitchen - where flavor meets culture. Order online for delivery, catering, and exclusive dining experiences.",
  keywords: ["luxury street food", "gourmet food", "food delivery", "catering", "restaurant", "street gourmet", "food truck", "online ordering"],
  authors: [{ name: "Broski's Kitchen" }],
  creator: "Broski's Kitchen",
  publisher: "Broski's Kitchen",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://broskiskitchen.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Broski's Kitchen - Luxury Street Gourmet",
    description: "Experience luxury street gourmet with Broski's Kitchen - where flavor meets culture. Order online for delivery, catering, and exclusive dining experiences.",
    url: '/',
    siteName: "Broski's Kitchen",
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: "Broski's Kitchen - Luxury Street Gourmet",
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Broski's Kitchen - Luxury Street Gourmet",
    description: "Experience luxury street gourmet with Broski's Kitchen - where flavor meets culture.",
    images: ['/images/twitter-image.jpg'],
    creator: '@broskiskitchen',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Ensure font variables are properly defined with fallbacks
  const fontClasses = `${playfair?.variable || ''} ${montserrat?.variable || ''} font-sans`;
  
  // Server-side session check for admin button
  const session = await getServerSession(authOptions);
  const showAdmin = isAdmin((session?.user as any)?.role);
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#FFD700" />
        <meta name="color-scheme" content="dark light" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Broski's Kitchen" />
        <meta name="application-name" content="Broski's Kitchen" />
        <meta name="msapplication-TileColor" content="#FFD700" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <StructuredData type="website" />
        <OrganizationStructuredData />
      </head>
      <body className={`${fontClasses} bg-black text-white min-h-screen flex flex-col antialiased`}>
        <ServiceWorkerCleanup />
        <ProductionErrorBoundary>
          <ErrorBoundary>
            <ResourceErrorBoundary>
              <ChunkErrorHandler />
              <Providers>
                <SkipNavigation />
                <NavBar />
                {/* Server-rendered Admin button for zero flicker */}
                {showAdmin && (
                  <div className="fixed top-2 right-4 z-[70]">
                    <Link
                      href="/admin/catering"
                      className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium bg-red-600 text-white border border-red-700 hover:bg-red-700 transition-colors duration-200 shadow-lg"
                    >
                      Admin Catering
                    </Link>
                  </div>
                )}
                <main id="main-content" className="flex-grow" tabIndex={-1}>{children}</main>
                <Footer />
                <MusicPlayer />

                <CookieConsent />
                <SEOAudit />
                <SchemaGenerator />
                <NetworkStatus />
                <ErrorMonitor />
                <PerformanceMonitor />
                <AccessibilityAudit />
                <PWAManager />
              </Providers>
            </ResourceErrorBoundary>
          </ErrorBoundary>
        </ProductionErrorBoundary>
      </body>
    </html>
  )
}