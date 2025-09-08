import type React from "react"
import type { Metadata } from "next"
// import "./globals-simple.css"
// import "./chat-animations.css"
// import ConditionalNavbar from "../components/layout/ConditionalNavbar"
// import Footer from "../components/layout/Footer"
// import { Providers } from "../lib/context/Providers"
// import { OrderProvider } from "../lib/context/OrderContext"
// import MusicPlayer from "../components/layout/MusicPlayer"
// import ErrorBoundary from "../components/common/ErrorBoundary"
// import CookieConsent from "../components/gdpr/CookieConsent"
// import { playfair, montserrat } from "./fonts"
// import StructuredData, { OrganizationStructuredData } from "../components/seo/StructuredData"
// import { SkipNavigation } from "../components/accessibility/AccessibilityEnhancer"
// import ClientProviders from './providers'

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
  metadataBase: new URL(process.env.SITE_URL || 'https://broskiskitchen.com'),
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#FFD700" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#000000', color: '#ffffff' }}>
        {children}
      </body>
    </html>
  )
}
