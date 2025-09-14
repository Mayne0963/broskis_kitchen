import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Broski\'s Kitchen',
  description: 'Delicious food delivery service',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}