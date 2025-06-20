import type React from "react"

import Link from "next/link"
import Image from "next/image"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Branding */}
      <div className="hidden md:flex md:w-1/2 bg-black relative">
        <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent z-10"></div>
        <Image src="/images/auth-background.jpg" alt="Broski's Kitchen" fill className="object-cover opacity-60" />
        <div className="relative z-20 flex flex-col justify-center items-center w-full p-12">
          <Link href="/" className="mb-8">
            <h1 className="text-4xl font-bold graffiti-text">Broski&apos;s Kitchen</h1>
          </Link>
          <div className="max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">Luxury Street Gourmet</h2>
            <p className="text-gray-300">
              Join our community of food enthusiasts and experience the perfect blend of luxury and street food culture.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#1A1A1A]">
        <div className="md:hidden text-center mb-10">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold graffiti-text">Broski&apos;s Kitchen</h1>
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-white">{title}</h2>
            <p className="mt-2 text-sm text-gray-400">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
