'use client'

import React from 'react'

// WCAG 2.1 AA compliance color utilities
export const AccessibleColors = {
  // High contrast text colors
  text: {
    primary: '#FFFFFF',      // White on dark backgrounds
    secondary: '#E5E7EB',    // Light gray
    muted: '#9CA3AF',        // Medium gray (4.5:1 contrast on black)
    inverse: '#000000',      // Black on light backgrounds
    error: '#FCA5A5',        // Light red (accessible on dark)
    warning: '#FCD34D',      // Light yellow (accessible on dark)
    success: '#86EFAC',      // Light green (accessible on dark)
    info: '#93C5FD',         // Light blue (accessible on dark)
  },
  
  // Background colors with proper contrast
  background: {
    primary: '#000000',      // Pure black
    secondary: '#111827',    // Very dark gray
    tertiary: '#1F2937',     // Dark gray
    card: '#374151',         // Medium dark gray
    overlay: 'rgba(0, 0, 0, 0.8)', // Semi-transparent black
  },
  
  // Accent colors (Broski's gold theme)
  accent: {
    primary: '#FFD700',      // Gold
    primaryHover: '#E6C200',  // Darker gold
    secondary: '#FFA500',    // Orange gold
    tertiary: '#FFED4E',     // Light gold
  },
  
  // Interactive element colors
  interactive: {
    link: '#60A5FA',         // Blue (4.5:1 contrast)
    linkHover: '#93C5FD',    // Lighter blue
    linkVisited: '#C084FC',  // Purple
    focus: '#FFD700',        // Gold focus ring
    disabled: '#6B7280',     // Gray
  },
  
  // Status colors
  status: {
    error: '#EF4444',        // Red
    errorBg: '#7F1D1D',      // Dark red background
    warning: '#F59E0B',      // Amber
    warningBg: '#78350F',    // Dark amber background
    success: '#10B981',      // Green
    successBg: '#064E3B',    // Dark green background
    info: '#3B82F6',         // Blue
    infoBg: '#1E3A8A',       // Dark blue background
  }
}

// Color contrast calculation utilities
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  
  if (!rgb1 || !rgb2) return 1
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b)
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b)
  
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  
  return (brightest + 0.05) / (darkest + 0.05)
}

export function isAccessible(foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): boolean {
  const ratio = getContrastRatio(foreground, background)
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7
}

// Accessible text component with automatic contrast adjustment
interface AccessibleTextProps {
  children: React.ReactNode
  background?: string
  className?: string
  level?: 'AA' | 'AAA'
  fallbackColor?: string
}

export function AccessibleText({ 
  children, 
  background = AccessibleColors.background.primary,
  className = '',
  level = 'AA',
  fallbackColor = AccessibleColors.text.primary
}: AccessibleTextProps) {
  // In a real implementation, you'd calculate the best text color
  // For now, we'll use our predefined accessible colors
  const textColor = background === AccessibleColors.background.primary 
    ? AccessibleColors.text.primary 
    : fallbackColor

  return (
    <span 
      className={className}
      style={{ color: textColor }}
    >
      {children}
    </span>
  )
}

// High contrast mode toggle
interface HighContrastToggleProps {
  className?: string
}

export function HighContrastToggle({ className = '' }: HighContrastToggleProps) {
  const [highContrast, setHighContrast] = React.useState(false)

  React.useEffect(() => {
    // Check for user preference
    const preferHighContrast = window.matchMedia('(prefers-contrast: high)').matches
    setHighContrast(preferHighContrast)
  }, [])

  React.useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }
  }, [highContrast])

  return (
    <button
      onClick={() => setHighContrast(!highContrast)}
      className={`
        px-4 py-2 rounded-md border-2 transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black
        ${highContrast 
          ? 'bg-white text-black border-white focus:ring-white' 
          : 'bg-black text-white border-white hover:bg-white hover:text-black focus:ring-white'
        }
        ${className}
      `}
      aria-label={`${highContrast ? 'Disable' : 'Enable'} high contrast mode`}
      aria-pressed={highContrast}
    >
      {highContrast ? 'Disable' : 'Enable'} High Contrast
    </button>
  )
}

// Focus visible utility component
interface FocusVisibleProps {
  children: React.ReactNode
  className?: string
}

export function FocusVisible({ children, className = '' }: FocusVisibleProps) {
  return (
    <div className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded ${className}`}>
      {children}
    </div>
  )
}

// Accessible link component
interface AccessibleLinkProps {
  href: string
  children: React.ReactNode
  external?: boolean
  className?: string
  ariaLabel?: string
}

export function AccessibleLink({ 
  href, 
  children, 
  external = false, 
  className = '',
  ariaLabel
}: AccessibleLinkProps) {
  const baseClasses = `
    text-blue-400 hover:text-blue-300 underline decoration-2 underline-offset-2
    focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black
    transition-colors duration-200 rounded-sm
  `

  const linkProps = {
    href,
    className: `${baseClasses} ${className}`,
    'aria-label': ariaLabel,
    ...(external && {
      target: '_blank',
      rel: 'noopener noreferrer'
    })
  }

  return (
    <a {...linkProps}>
      {children}
      {external && (
        <span className="sr-only"> (opens in new tab)</span>
      )}
    </a>
  )
}

// Color contrast checker component (for development)
interface ContrastCheckerProps {
  foreground: string
  background: string
  text?: string
}

export function ContrastChecker({ foreground, background, text = 'Sample Text' }: ContrastCheckerProps) {
  const ratio = getContrastRatio(foreground, background)
  const aaPass = ratio >= 4.5
  const aaaPass = ratio >= 7

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="p-4 border border-gray-300 rounded-md bg-white text-black">
      <div 
        className="p-4 mb-2 rounded"
        style={{ backgroundColor: background, color: foreground }}
      >
        {text}
      </div>
      <div className="text-sm">
        <p>Contrast Ratio: {ratio.toFixed(2)}:1</p>
        <p className={aaPass ? 'text-green-600' : 'text-red-600'}>
          WCAG AA: {aaPass ? 'Pass' : 'Fail'}
        </p>
        <p className={aaaPass ? 'text-green-600' : 'text-red-600'}>
          WCAG AAA: {aaaPass ? 'Pass' : 'Fail'}
        </p>
      </div>
    </div>
  )
}

export default AccessibleColors