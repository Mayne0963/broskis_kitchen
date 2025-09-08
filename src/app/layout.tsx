import type React from "react"
import type { Metadata } from "next"
import "./globals-simple.css"
import "./chat-animations.css"
import ConditionalNavbar from "../components/layout/ConditionalNavbar"
import Footer from "../components/layout/Footer"
import { Providers } from "../lib/context/Providers"
import { OrderProvider } from "../lib/context/OrderContext"
import MusicPlayer from "../components/layout/MusicPlayer"
import ErrorBoundary from "../components/common/ErrorBoundary"
import CookieConsent from "../components/gdpr/CookieConsent"
import { playfair, montserrat } from "./fonts"
import StructuredData, { OrganizationStructuredData } from "../components/seo/StructuredData"
import { SkipNavigation } from "../components/accessibility/AccessibilityEnhancer"
import ClientProviders from './providers'

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

// Safe component wrapper that prevents crashes
function SafeComponent({ children, fallback, name }: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
  name?: string;
}) {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error(`${name || 'Component'} error:`, error);
    return <>{fallback || null}</>;
  }
}

// Fallback content for critical errors
const AppFallback = () => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4 text-yellow-400">Broski's Kitchen</h1>
      <p className="text-xl mb-4">Luxury Street Gourmet</p>
      <p className="text-gray-400">Loading your culinary experience...</p>
    </div>
  </div>
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Ensure font variables are properly defined with fallbacks
  const fontClasses = `${playfair?.variable || ''} ${montserrat?.variable || ''} font-sans`;
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
        <SafeComponent name="StructuredData">
          <StructuredData type="website" />
        </SafeComponent>
        <SafeComponent name="OrganizationStructuredData">
          <OrganizationStructuredData />
        </SafeComponent>
      </head>
      <body className={`${fontClasses} bg-black text-white min-h-screen flex flex-col antialiased`}>
        <ErrorBoundary fallback={<AppFallback />}>
          <SafeComponent name="Providers" fallback={<AppFallback />}>
            <Providers>
              <SafeComponent name="OrderProvider" fallback={<AppFallback />}>
                <OrderProvider>
                  <SafeComponent name="ClientProviders" fallback={<AppFallback />}>
                    <ClientProviders>
                      <SafeComponent name="SkipNavigation">
                        <SkipNavigation />
                      </SafeComponent>
                      <SafeComponent name="ConditionalNavbar">
                        <ConditionalNavbar />
                      </SafeComponent>
                      <main id="main-content" className="flex-grow" tabIndex={-1}>
                        <SafeComponent name="MainContent" fallback={<AppFallback />}>
                          {children}
                        </SafeComponent>
                      </main>
                      <SafeComponent name="Footer">
                        <Footer />
                      </SafeComponent>
                      <SafeComponent name="MusicPlayer">
                        <MusicPlayer />
                      </SafeComponent>
                      <SafeComponent name="CookieConsent">
                        <CookieConsent />
                      </SafeComponent>
                    </ClientProviders>
                  </SafeComponent>
                </OrderProvider>
              </SafeComponent>
            </Providers>
          </SafeComponent>
        </ErrorBoundary>
      </body>
    </html>
  )
}
