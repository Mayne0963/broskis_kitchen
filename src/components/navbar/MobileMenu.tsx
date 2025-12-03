'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaTimes } from 'react-icons/fa'
import { lockBodyScroll, unlockBodyScroll } from '../../lib/dom/lockBodyScroll'
import { useAuth } from '../../lib/context/AuthContext'
import { useAuthClaims } from '../../hooks/useAuthClaims'
import { useCart } from '../../lib/context/CartContext'
import { MAIN_LINKS } from '../nav/links'

interface MobileMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function MobileMenu({ open, onOpenChange }: MobileMenuProps) {
  const { user } = useAuth()
  const { claims } = useAuthClaims()
  const { itemCount } = useCart()
  const pathname = usePathname()
  
  const isAuthed = !!user
  const isAdmin = !!claims?.admin
  const cartCount = itemCount
  
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerElementRef = useRef<HTMLElement | null>(null)
  
  const closeMenu = useCallback(() => {
    onOpenChange(false)
    // Return focus to the trigger element (hamburger button)
    if (triggerElementRef.current) {
      triggerElementRef.current.focus()
    }
  }, [onOpenChange])

  // Body scroll lock and 100vh fix for iOS
  useEffect(() => {
    if (open) {
      // Fix 100vh iOS bug
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
      
      // Lock body scroll
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
    } else {
      // Restore scroll
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
    
    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [open])

  // Store reference to trigger element and manage focus
  useEffect(() => {
    if (open) {
      // Store the currently focused element (hamburger button)
      triggerElementRef.current = document.activeElement as HTMLElement
      
      // Focus the close button when menu opens
      setTimeout(() => {
        if (closeButtonRef.current) {
          closeButtonRef.current.focus()
        }
      }, 100)
    }
  }, [open])

  // Focus trap and ESC key handler
  useEffect(() => {
    if (!open || !panelRef.current) return

    const panel = panelRef.current
    const focusableElements = panel.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu()
        return
      }

      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement?.focus()
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement?.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, closeMenu])



  if (!open) return null

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] transition-opacity duration-300 ${
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeMenu}
        aria-hidden="true"
        data-testid="mobile-menu-backdrop"
      />
      
      {/* Panel */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-menu-title"
        id="mobile-menu-panel"
        data-testid="mobile-menu"
        className="bk-drawer fixed inset-0 z-[100] w-full sm:w-[420px] sm:inset-y-0 sm:right-0 sm:left-auto bg-black text-white shadow-2xl ring-1 ring-white/10 transform transition-transform duration-300 ease-in-out"
        style={{
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          height: 'calc(var(--vh, 1vh) * 100)'
        }}
      >
        {/* Header */}
        <header className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
          <h2 id="mobile-menu-title" className="text-lg font-semibold text-white">Menu</h2>
          <button
            ref={closeButtonRef}
            data-mobile-menu-close
            onClick={closeMenu}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </header>
        
        {/* Navigation */}
        <nav 
          className="bk-scroll overflow-y-auto flex-1 min-h-0 -webkit-overflow-scrolling-touch"
          aria-labelledby="mobile-menu-title"
        >
          <ul className="divide-y divide-white/10" role="list">
            {MAIN_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={closeMenu}
                  data-testid="mobile-menu-link"
                  className={`block px-4 py-4 text-lg font-medium transition-colors duration-200 min-h-[44px] flex items-center ${
                    pathname === link.href 
                      ? 'text-[#FFD700] bg-white/5' 
                      : 'text-white hover:text-[#FFD700] hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* CTA Section */}
        <footer className="bk-footer flex-shrink-0 sticky bottom-0 bg-gradient-to-t from-black via-black/95 to-transparent border-t border-white/8 p-4 space-y-3">
          {isAuthed ? (
            <>
              <Link 
                href="/account" 
                onClick={closeMenu} 
                data-testid="mobile-menu-cta"
                className="btn btn-primary w-full"
              >
                My Account
              </Link>
              <Link 
                href="/account/orders" 
                onClick={closeMenu} 
                data-testid="mobile-menu-cta"
                className="btn btn-outline w-full"
              >
                Order History
              </Link>
              {isAdmin && (
                <Link 
                  href="/admin" 
                  prefetch={false}
                  onClick={closeMenu} 
                  data-testid="mobile-menu-cta"
                  className="btn btn-warning w-full"
                >
                  Admin
                </Link>
              )}
              <form action="/api/auth/logout" method="post">
                <button 
                  data-testid="mobile-menu-cta"
                  className="btn btn-ghost w-full"
                >
                  Logout
                </button>
              </form>
            </>
          ) : (
            <Link 
              href="/auth/login" 
              onClick={closeMenu} 
              data-testid="mobile-menu-cta"
              className="btn btn-primary w-full"
            >
              Sign In / Join
            </Link>
          )}
          <Link 
            href="/cart" 
            onClick={closeMenu} 
            data-testid="mobile-menu-cta"
            className="btn w-full justify-between min-h-[44px] flex items-center"
          >
            <span>Cart</span>
            <span className="rounded-full px-2 py-0.5 text-sm bg-white/10 min-w-[24px] text-center">
              {cartCount ?? 0}
            </span>
          </Link>
        </footer>
      </aside>
    </div>,
    document.body
  )
}
