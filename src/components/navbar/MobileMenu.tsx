'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { FaTimes } from 'react-icons/fa'
import { lockBodyScroll, unlockBodyScroll } from '../../lib/dom/lockBodyScroll'
import { useAuth } from '../../lib/context/AuthContext'
import { useAuthClaims } from '../../hooks/useAuthClaims'
import { useCart } from '../../lib/context/CartContext'
import type { NavItem } from '../../config/nav'

interface MobileMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: NavItem[]
}

export default function MobileMenu({ open, onOpenChange, items }: MobileMenuProps) {
  const { user } = useAuth()
  const { claims } = useAuthClaims()
  const { itemCount } = useCart()
  
  const isAuthed = !!user
  const isAdmin = !!claims?.admin
  const cartCount = itemCount
  
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerElementRef = useRef<HTMLElement | null>(null)
  
  const closeMenu = () => {
    onOpenChange(false)
    // Return focus to the trigger element (hamburger button)
    if (triggerElementRef.current) {
      triggerElementRef.current.focus()
    }
  }

  // Body scroll lock
  useEffect(() => {
    if (open) {
      lockBodyScroll()
    } else {
      unlockBodyScroll()
    }
    return () => {
      unlockBodyScroll()
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
  }, [open])



  if (!open) return null

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] transition-opacity duration-300 ${
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/60"
        onClick={closeMenu}
        aria-label="Close menu overlay"
        tabIndex={-1}
      />
      
      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        data-testid="mobile-menu"
        className={`fixed inset-y-0 right-0 z-[100] w-full sm:w-[420px] bg-black text-white h-100dvh max-h-100dvh flex flex-col pb-[max(env(safe-area-inset-bottom),16px)] shadow-2xl ring-1 ring-white/10 transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">Menu</h2>
          <button
            ref={closeButtonRef}
            data-mobile-menu-close
            onClick={closeMenu}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
            aria-label="Close menu"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="mobile-scroll overflow-y-auto flex-1 min-h-0">
          <ul className="divide-y divide-white/10">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  onClick={closeMenu}
                  data-testid="mobile-menu-link"
                  className="block px-6 py-5 text-lg font-medium text-white hover:text-[#FFD700] transition-colors duration-200"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* CTA Section */}
        <div className="p-4 border-t border-white/10 space-y-3 flex-shrink-0">
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
                  href="/admin/dashboard" 
                  onClick={closeMenu} 
                  data-testid="mobile-menu-cta"
                  className="btn btn-warning w-full"
                >
                  Admin
                </Link>
              )}
              <form action="/api/auth/signout" method="post">
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
            className="btn w-full justify-between"
          >
            <span>Cart</span>
            <span className="rounded-full px-2 py-0.5 text-sm bg-white/10">
              {cartCount ?? 0}
            </span>
          </Link>
        </div>
      </div>
    </div>,
    document.body
  )
}