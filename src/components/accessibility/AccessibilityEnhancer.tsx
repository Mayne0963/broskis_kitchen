'use client'

import React, { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

// Enhanced Skip Navigation Component
export function SkipNavigation() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="absolute top-4 left-4 bg-amber-400 text-black px-4 py-2 rounded-md z-[9999] font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        tabIndex={1}
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="absolute top-4 left-40 bg-amber-400 text-black px-4 py-2 rounded-md z-[9999] font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        tabIndex={2}
      >
        Skip to navigation
      </a>
    </div>
  )
}

// Enhanced Focus Management Hook
export function useFocusManagement() {
  const router = useRouter()
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const handleRouteChange = () => {
      // Focus on main content after route change
      const mainContent = document.getElementById('main-content')
      if (mainContent) {
        mainContent.focus()
      }
    }

    // Listen for route changes
    const handleFocus = () => {
      setTimeout(handleRouteChange, 100)
    }

    window.addEventListener('popstate', handleFocus)
    return () => window.removeEventListener('popstate', handleFocus)
  }, [router])

  const saveFocus = () => {
    previousFocusRef.current = document.activeElement as HTMLElement
  }

  const restoreFocus = () => {
    if (previousFocusRef.current) {
      previousFocusRef.current.focus()
    }
  }

  return { saveFocus, restoreFocus }
}

// Enhanced Dropdown with ARIA support
interface AccessibleDropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  label: string
  className?: string
}

export function AccessibleDropdown({
  trigger,
  children,
  isOpen,
  onToggle,
  onClose,
  label,
  className = ''
}: AccessibleDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuId = `dropdown-menu-${Math.random().toString(36).substr(2, 9)}`

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
        triggerRef.current?.focus()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onToggle()
    } else if (event.key === 'ArrowDown' && !isOpen) {
      event.preventDefault()
      onToggle()
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        ref={triggerRef}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={isOpen ? menuId : undefined}
        aria-label={label}
        className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-black rounded"
      >
        {trigger}
      </button>
      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-48 bg-black rounded-md shadow-lg py-1 z-50 border border-[#FFD700] focus:outline-none"
          tabIndex={-1}
        >
          {children}
        </div>
      )}
    </div>
  )
}

// Enhanced Menu Item
interface AccessibleMenuItemProps {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  className?: string
  disabled?: boolean
}

export function AccessibleMenuItem({
  children,
  onClick,
  href,
  className = '',
  disabled = false
}: AccessibleMenuItemProps) {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && !disabled) {
      event.preventDefault()
      onClick?.()
    }
  }

  const baseClasses = `block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#333333] focus:bg-[#333333] focus:outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`

  if (href) {
    return (
      <a
        href={href}
        role="menuitem"
        className={baseClasses}
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onKeyDown={handleKeyDown}
      >
        {children}
      </a>
    )
  }

  return (
    <button
      role="menuitem"
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      className={baseClasses}
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

// Enhanced Mobile Menu with ARIA support
interface AccessibleMobileMenuProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function AccessibleMobileMenu({
  isOpen,
  onClose,
  children,
  className = ''
}: AccessibleMobileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const firstFocusableRef = useRef<HTMLElement | null>(null)
  const lastFocusableRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Focus first focusable element when menu opens
      const focusableElements = menuRef.current?.querySelectorAll(
        'a[href], button, [tabindex]:not([tabindex="-1"])'
      )
      if (focusableElements && focusableElements.length > 0) {
        firstFocusableRef.current = focusableElements[0] as HTMLElement
        lastFocusableRef.current = focusableElements[focusableElements.length - 1] as HTMLElement
        firstFocusableRef.current?.focus()
      }

      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
    } else if (event.key === 'Tab') {
      // Trap focus within menu
      if (event.shiftKey) {
        if (document.activeElement === firstFocusableRef.current) {
          event.preventDefault()
          lastFocusableRef.current?.focus()
        }
      } else {
        if (document.activeElement === lastFocusableRef.current) {
          event.preventDefault()
          firstFocusableRef.current?.focus()
        }
      }
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={menuRef}
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation menu"
      className={`md:hidden mobile-menu bg-black border-t border-[#FFD700] ${className}`}
      onKeyDown={handleKeyDown}
    >
      <div className="container mx-auto flex flex-col space-y-3 px-4 py-4">
        {children}
      </div>
    </div>
  )
}

// Enhanced Button with better accessibility
interface AccessibleButtonProps {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  ariaLabel?: string
  ariaDescribedBy?: string
  ariaExpanded?: boolean
  className?: string
  variant?: 'primary' | 'secondary' | 'outline'
}

export function AccessibleButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  className = '',
  variant = 'primary'
}: AccessibleButtonProps) {
  const baseClasses = 'px-4 py-2 rounded font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-black'
  
  const variantClasses = {
    primary: 'bg-amber-400 text-black hover:bg-amber-500 disabled:bg-gray-600 disabled:text-gray-400',
    secondary: 'bg-gray-700 text-white hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500',
    outline: 'border-2 border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-black disabled:border-gray-600 disabled:text-gray-500'
  }

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-expanded={ariaExpanded}
      className={`${baseClasses} ${variantClasses[variant]} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {children}
    </button>
  )
}

// Live Region for Announcements
interface LiveRegionProps {
  message: string
  priority?: 'polite' | 'assertive'
  className?: string
}

export function LiveRegion({ message, priority = 'polite', className = '' }: LiveRegionProps) {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className={`sr-only ${className}`}
    >
      {message}
    </div>
  )
}

// Enhanced Form Field with proper labeling
interface AccessibleFormFieldProps {
  id: string
  label: string
  children: React.ReactNode
  error?: string
  helpText?: string
  required?: boolean
  className?: string
}

export function AccessibleFormField({
  id,
  label,
  children,
  error,
  helpText,
  required = false,
  className = ''
}: AccessibleFormFieldProps) {
  const errorId = error ? `${id}-error` : undefined
  const helpId = helpText ? `${id}-help` : undefined

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
      {React.cloneElement(children as React.ReactElement, {
        id,
        'aria-describedby': [errorId, helpId].filter(Boolean).join(' ') || undefined,
        'aria-invalid': error ? 'true' : undefined,
        required
      })}
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