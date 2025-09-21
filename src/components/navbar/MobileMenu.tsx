"use client"

import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { X } from 'lucide-react'

interface MobileMenuProps {
  open: boolean
  onOpenChange: (value: boolean) => void
  items: { href: string; label: string }[]
}

export default function MobileMenu({ open, onOpenChange, items }: MobileMenuProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
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
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-menu-title"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10" onClick={(e) => e.stopPropagation()}>
        <div id="mobile-menu-title" className="text-xl font-bold text-white">
          Broski's Kitchen
        </div>
        <button
          ref={closeButtonRef}
          onClick={() => onOpenChange(false)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Close menu"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Scrollable Navigation Links */}
      <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }} onClick={(e) => e.stopPropagation()}>
        <nav className="py-4">
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              onClick={handleLinkClick}
              className="block px-6 py-4 text-lg font-medium active:opacity-80 hover:bg-white/5 transition-colors focus:outline-none focus:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>,
    document.body
  )
}