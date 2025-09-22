"use client"

import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { lockBodyScroll, unlockBodyScroll } from '@/lib/dom/lockBodyScroll'

interface MobileMenuProps {
  open: boolean
  onOpenChange: (value: boolean) => void
  items: { href: string; label: string }[]
}

export default function MobileMenu({ open, onOpenChange, items }: MobileMenuProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

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

  // Focus management - focus close button when menu opens
  useEffect(() => {
    if (open && closeButtonRef.current) {
      closeButtonRef.current.focus()
    }
  }, [open])

  // ESC key handler for accessibility
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [open, onOpenChange])

  const handleLinkClick = () => {
    onOpenChange(false)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking the backdrop itself, not child elements
    if (e.target === e.currentTarget) {
      onOpenChange(false)
    }
  }

  if (!open) return null

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[100] transition-opacity duration-300',
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      )}
    >
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/60"
        onClick={() => onOpenChange(false)}
        aria-label="Close menu"
      />
      
      {/* Panel */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 w-full max-w-sm',
          'bg-black text-white shadow-2xl ring-1 ring-white/10',
          'transform transition-transform duration-300 ease-in-out',
          'h-100dvh max-h-100dvh overflow-hidden flex flex-col',
          'safe-area-inset-right',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pt-safe border-b border-white/10 shrink-0">
          <h2 className="text-xl font-bold text-gold-foil">Menu</h2>
          <button
            ref={closeButtonRef}
            onClick={() => onOpenChange(false)}
            className="p-3 hover:bg-white/10 rounded-xl transition-all duration-200 min-h-[48px] min-w-[48px] flex items-center justify-center active:scale-95"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="mobile-scroll overflow-y-auto flex-1 p-4 pb-safe">
          <div className="space-y-2">
            {items.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="block py-4 px-6 text-white hover:bg-white/10 rounded-xl transition-all duration-200 text-lg font-medium min-h-[48px] flex items-center active:scale-[0.98] active:bg-white/20"
                onClick={handleLinkClick}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>,
    document.body
  )
}