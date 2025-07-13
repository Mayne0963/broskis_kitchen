import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "./chat-animations.css"
import Navbar from "../components/layout/Navbar"
import Footer from "../components/layout/Footer"
import { Providers } from "../lib/context/Providers"
import { OrderProvider } from "../lib/context/OrderContext"
import MusicPlayer from "../components/layout/MusicPlayer"
import ChatBot from "../components/chat/ChatBot"
import ErrorBoundary from "../components/common/ErrorBoundary"
import ChunkErrorHandler from "../components/common/ChunkErrorHandler"
import { Toaster } from "react-hot-toast"

const inter = Inter({ subsets: ["latin"] })

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
      <body className={`${inter.className} bg-black text-white min-h-screen flex flex-col`}>
        <ErrorBoundary>
           <ChunkErrorHandler />
           <Providers>
             <OrderProvider>
               <Navbar />
               <main className="flex-grow pt-20">{children}</main>
               <Footer />
               <MusicPlayer />
               <ChatBot />
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
             </OrderProvider>
           </Providers>
         </ErrorBoundary>
      </body>
    </html>
  )
}
