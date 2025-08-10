'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// Hook for managing focus on route changes
export function useFocusManagement() {
  const router = useRouter()
  const skipLinkRef = useRef<HTMLAnchorElement>(null)
  
  useEffect(() => {
    const handleRouteChange = () => {
      // Focus the main content area after route change
      const mainContent = document.getElementById('main-content')
      if (mainContent) {
        mainContent.focus()
        mainContent.scrollIntoView({ behavior: 'smooth' })
      }
    }
    
    // Listen for route changes
    const originalPush = router.push
    router.push = (...args) => {
      const result = originalPush.apply(router, args)
      setTimeout(handleRouteChange, 100)
      return result
    }
    
    return () => {
      router.push = originalPush
    }
  }, [router])
}

// Skip to main content component
export function SkipToMainContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-amber-400 text-black px-4 py-2 rounded z-50 font-medium"
      aria-label="Skip to main content"
    >
      Skip to main content
    </a>
  )
}

// Accessible button component with proper ARIA support
interface AccessibleButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  ariaLabel?: string
  ariaDescribedBy?: string
  className?: string
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'danger'
}

export function AccessibleButton({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  className = '',
  type = 'button',
  variant = 'primary'
}: AccessibleButtonProps) {
  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black'
  
  const variantClasses = {
    primary: 'bg-amber-400 text-black hover:bg-amber-500 focus:ring-amber-400 disabled:bg-gray-600 disabled:text-gray-400',
    secondary: 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-gray-500 disabled:bg-gray-800 disabled:text-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-gray-600 disabled:text-gray-400'
  }
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

// Accessible form input with proper labeling
interface AccessibleInputProps {
  id: string
  label: string
  type?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  helpText?: string
  className?: string
}

export function AccessibleInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  helpText,
  className = ''
}: AccessibleInputProps) {
  const errorId = error ? `${id}-error` : undefined
  const helpId = helpText ? `${id}-help` : undefined
  const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined
  
  return (
    <div className={`space-y-2 ${className}`}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-white"
      >
        {label}
        {required && (
          <span className="text-red-400 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-describedby={describedBy}
        aria-invalid={error ? 'true' : 'false'}
        className={`
          w-full px-3 py-2 bg-gray-800 border rounded-md text-white
          focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent
          disabled:bg-gray-900 disabled:text-gray-500
          ${error ? 'border-red-500' : 'border-gray-600'}
        `}
      />
      
      {helpText && (
        <p id={helpId} className="text-sm text-gray-400">
          {helpText}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// Accessible modal with focus trap
interface AccessibleModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  
  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement
      
      // Focus the modal
      if (modalRef.current) {
        modalRef.current.focus()
      }
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
      
      // Handle escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }
      
      document.addEventListener('keydown', handleEscape)
      
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = 'unset'
        
        // Restore focus to previously focused element
        if (previousFocusRef.current) {
          previousFocusRef.current.focus()
        }
      }
    }
  }, [isOpen, onClose])
  
  if (!isOpen) return null
  
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-75"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`
          relative bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 p-6
          focus:outline-none focus:ring-2 focus:ring-amber-400
          ${className}
        `}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="modal-title" className="text-xl font-bold text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 rounded"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="text-white">
          {children}
        </div>
      </div>
    </div>
  )
}

// Live region for announcing dynamic content changes
interface LiveRegionProps {
  message: string
  politeness?: 'polite' | 'assertive'
  atomic?: boolean
}

export function LiveRegion({ message, politeness = 'polite', atomic = true }: LiveRegionProps) {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
    >
      {message}
    </div>
  )
}

// High contrast mode detector
export function useHighContrastMode() {
  const [isHighContrast, setIsHighContrast] = useState(false)
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    setIsHighContrast(mediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])
  
  return isHighContrast
}

// Reduced motion detector
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])
  
  return prefersReducedMotion
}
