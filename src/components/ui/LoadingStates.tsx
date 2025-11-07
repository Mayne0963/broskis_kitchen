"use client"

import { useEffect, useState } from 'react'
import { Loader2, ChefHat, Utensils, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  color?: 'blue' | 'gold' | 'white' | 'red'
  speed?: 'slow' | 'normal' | 'fast'
}

interface LoadingStateProps {
  message?: string
  subMessage?: string
  progress?: number
  showProgress?: boolean
  variant?: 'default' | 'minimal' | 'branded'
  className?: string
}

interface BrandedLoadingProps {
  title?: string
  subtitle?: string
  showTips?: boolean
  tips?: string[]
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16'
}

const colorMap = {
  blue: 'text-blue-500',
  gold: 'text-yellow-500',
  white: 'text-white',
  red: 'text-red-500'
}

const speedMap = {
  slow: 'animate-spin-slow',
  normal: 'animate-spin',
  fast: 'animate-spin-fast'
}

// Custom animation styles
const customStyles = `
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes spin-fast {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .animate-spin-slow {
    animation: spin-slow 2s linear infinite;
  }
  
  .animate-spin-fast {
    animation: spin-fast 0.5s linear infinite;
  }
  
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in-up {
    animation: fade-in-up 0.6s ease-out;
  }
  
  @keyframes pulse-glow {
    0%, 100% {
      opacity: 1;
      filter: drop-shadow(0 0 10px currentColor);
    }
    50% {
      opacity: 0.7;
      filter: drop-shadow(0 0 20px currentColor);
    }
  }
  
  .animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }
`

export function LoadingSpinner({ 
  size = 'md', 
  className, 
  color = 'blue',
  speed = 'normal' 
}: LoadingSpinnerProps) {
  return (
    <>
      <style>{customStyles}</style>
      <Loader2 
        className={cn(
          sizeMap[size],
          colorMap[color],
          speedMap[speed],
          'animate-pulse-glow',
          className
        )} 
      />
    </>
  )
}

export function LoadingState({ 
  message = 'Loading...',
  subMessage,
  progress,
  showProgress = false,
  variant = 'default',
  className
}: LoadingStateProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)

  useEffect(() => {
    if (showProgress && progress !== undefined) {
      const timer = setTimeout(() => {
        setAnimatedProgress(progress)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [progress, showProgress])

  const content = (
    <div className={cn('text-center space-y-4', className)}>
      <div className="flex justify-center">
        <LoadingSpinner size="lg" color="gold" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-white">{message}</h3>
        {subMessage && (
          <p className="text-gray-400 text-sm">{subMessage}</p>
        )}
      </div>

      {showProgress && (
        <div className="w-64 mx-auto">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${animatedProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">{animatedProgress}%</p>
        </div>
      )}
    </div>
  )

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <LoadingSpinner size="sm" color="white" />
        <span className="text-white">{message}</span>
      </div>
    )
  }

  return content
}

export function BrandedLoading({ 
  title = "Broski's Kitchen",
  subtitle = "Preparing your experience...",
  showTips = true,
  tips = [
    "Our chefs are crafting the perfect menu...",
    "Setting the ambiance for your visit...",
    "Preparing fresh ingredients...",
    "Almost ready to serve..."
  ]
}: BrandedLoadingProps) {
  const [currentTip, setCurrentTip] = useState(0)

  useEffect(() => {
    if (!showTips || tips.length === 0) return

    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % tips.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [showTips, tips.length])

  return (
    <>
      <style>{customStyles}</style>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-yellow-900/20">
        <div className="text-center space-y-8 max-w-md mx-auto px-6">
          {/* Logo/Icon Animation */}
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="relative flex justify-center">
              <div className="bg-yellow-500/10 p-6 rounded-full border border-yellow-500/20">
                <ChefHat className="h-16 w-16 text-yellow-500 animate-pulse-glow" />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-4 animate-fade-in-up">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white tracking-wide">{title}</h1>
              <p className="text-gray-300">{subtitle}</p>
            </div>

            {/* Loading Spinner */}
            <div className="flex justify-center py-4">
              <div className="relative">
                <Utensils className="h-8 w-8 text-yellow-500 animate-spin" />
                <Sparkles className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="w-48 mx-auto">
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full animate-pulse" 
                     style={{ width: '100%' }} />
              </div>
            </div>

            {/* Tips */}
            {showTips && tips.length > 0 && (
              <div className="h-12 flex items-center justify-center">
                <p className="text-sm text-gray-400 italic transition-all duration-500">
                  {tips[currentTip]}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// Specialized loading components for different contexts
export function MenuLoading() {
  return (
    <LoadingState 
      message="Loading Menu"
      subMessage="Our chefs are preparing today's selections..."
      showProgress
      progress={75}
    />
  )
}

export function OrderLoading() {
  return (
    <BrandedLoading 
      title="Processing Order"
      subtitle="Preparing your culinary experience..."
      tips={[
        "Confirming your selections...",
        "Calculating delivery time...",
        "Preparing your order...",
        "Almost ready!"
      ]}
    />
  )
}

export function CartLoading() {
  return (
    <LoadingState 
      message="Updating Cart"
      subMessage="Adjusting your order..."
      variant="minimal"
    />
  )
}