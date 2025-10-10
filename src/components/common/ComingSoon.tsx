'use client';

import React, { useState } from 'react';

interface ComingSoonProps {
  title?: string
  message?: string
  estimatedDate?: string
  showEmailSignup?: boolean
  returnUrl?: string
  returnText?: string
  customIcon?: React.ReactNode
  showSocialLinks?: boolean
  backgroundVariant?: "default" | "kitchen" | "minimal"
}

export default function ComingSoon({
  title = "Coming Soon",
  message = "We're cooking up something amazing! This feature is currently in development and will be available soon.",
  estimatedDate,
  showEmailSignup = true,
  returnUrl = "/",
  returnText = "Return to Home",
  customIcon,
  showSocialLinks = true,
  backgroundVariant = "default"
}: ComingSoonProps) {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsSubmitted(true)
    setIsLoading(false)
    setEmail("")
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 border border-[#FFD700] rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 border border-[#FFD700] rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/4 w-16 h-16 border border-[#FFD700] rounded-full animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-1/3 w-20 h-20 border border-[#FFD700] rounded-full animate-pulse delay-500"></div>
      </div>

      {/* Floating Kitchen Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 text-6xl opacity-5 animate-float">🍳</div>
        <div className="absolute top-1/3 right-1/4 text-5xl opacity-5 animate-float delay-1000">🔥</div>
        <div className="absolute bottom-1/3 left-1/3 text-4xl opacity-5 animate-float delay-2000">👨‍🍳</div>
        <div className="absolute bottom-1/4 right-1/3 text-5xl opacity-5 animate-float delay-500">🥘</div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        {/* Logo/Icon */}
        <div className="mb-8">
          {customIcon || (
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-full flex items-center justify-center text-4xl animate-pulse">
              🍴
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent animate-fade-in">
          {title}
        </h1>

        {/* Subtitle */}
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold text-[#FFD700] mb-2">
            Broski's Kitchen
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto leading-relaxed">
            {message}
          </p>
        </div>

        {/* Estimated Date */}
        {estimatedDate && (
          <div className="mb-8 p-4 border border-[#FFD700] rounded-lg bg-[#FFD700]/10">
            <div className="flex items-center justify-center gap-2 text-[#FFD700]">
              <span>⏰</span>
              <span className="font-semibold">Expected: {estimatedDate}</span>
            </div>
          </div>
        )}

        {/* Email Signup */}
        {showEmailSignup && (
          <div className="mb-8 w-full max-w-md">
            {!isSubmitted ? (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Get notified when we launch
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent text-white placeholder-gray-400"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-semibold py-3 px-6 rounded-lg hover:from-[#FFA500] hover:to-[#FFD700] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Subscribing..." : "Notify Me"}
                </button>
              </form>
            ) : (
              <div className="p-4 bg-green-900/20 border border-green-500 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-green-400">
                  <span>✅</span>
                  <span>Thanks! We'll notify you when it's ready.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Social Links */}
        {showSocialLinks && (
          <div className="mb-8">
            <p className="text-gray-400 mb-4">Follow us for updates</p>
            <div className="flex gap-4 justify-center">
              <a
                href="#"
                className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#FFD700] hover:text-black transition-all duration-300"
                aria-label="Instagram"
              >
                📷
              </a>
              <a
                href="#"
                className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#FFD700] hover:text-black transition-all duration-300"
                aria-label="Twitter"
              >
                🐦
              </a>
              <a
                href="#"
                className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#FFD700] hover:text-black transition-all duration-300"
                aria-label="Facebook"
              >
                📘
              </a>
            </div>
          </div>
        )}

        {/* Return Button */}
        <div>
          <a
            href={returnUrl}
            className="inline-flex items-center gap-2 px-6 py-3 border border-[#FFD700] text-[#FFD700] rounded-lg hover:bg-[#FFD700] hover:text-black transition-all duration-300"
          >
            <span>←</span>
            {returnText}
          </a>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  )
}