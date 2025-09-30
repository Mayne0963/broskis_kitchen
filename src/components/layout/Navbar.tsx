"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { FaBars, FaTimes, FaUser, FaShoppingBag } from "react-icons/fa"
import CartDropdown from "../../components/cart/CartDropdown"
import { useCart } from "../../lib/context/CartContext"
import { useAuth } from "../../lib/context/AuthContext"
import { useAuthClaims } from "../../hooks/useAuthClaims"
import { EmailVerificationBanner } from "../auth/EmailVerificationBanner"
import { 
  AccessibleDropdown, 
  AccessibleMenuItem, 
  AccessibleButton 
} from "../accessibility/AccessibilityEnhancer"
import MobileMenu from "../navbar/MobileMenu"
import { NAV_ITEMS, visibleNav } from "../../config/nav"

const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const { itemCount } = useCart()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { claims, loading } = useAuthClaims()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])



  // Handle scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Set scrolled state
      setIsScrolled(currentScrollY > 10)
      
      // Hide/show navbar based on scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <>
      <nav 
        id="navigation"
        role="navigation"
        aria-label="Main navigation"
        className={`fixed top-0 w-full bg-black text-white h-20 z-[60] shadow-lg border-b border-[#FFD700] transition-transform duration-300 ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
      <div className="container mx-auto flex justify-between items-center h-full px-4">
        <Link href="/" className="text-2xl font-bold graffiti-text hover:text-white transition-colors duration-300">
          Broski&apos;s Kitchen
        </Link>

        <button
           type="button"
           data-testid="mobile-menu-toggle"
           aria-label="Open menu"
           onClick={() => setMobileMenuOpen(true)}
           className="md:hidden inline-flex items-center justify-center rounded-lg px-3 py-2 ring-1 ring-white/20 bg-zinc-900/60 text-white"
         >
           <FaBars size={24} />
         </button>

        <div className="hidden md:flex items-center space-x-6">
          {visibleNav(NAV_ITEMS, { isMobile: false, isAuthed: !!user, isAdmin: !!claims?.admin }).map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              className={`nav-link ${pathname === item.href ? "nav-link-active" : ""}`}
              {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {item.label}
            </Link>
          ))}
          <a 
            href="https://otw-chi.vercel.app" 
            className="broski-otw-gold-button"
          >
            <Image 
              src="/images/otw-logo.svg" 
              alt="OTW Logo" 
              width={24} 
              height={12} 
              className="filter brightness-110"
            />
            <span className="text-sm font-extrabold tracking-wide">OTW</span>
          </a>

          <CartDropdown />

          {user ? (
            <AccessibleDropdown
              trigger={
                <div className="btn-outline flex items-center gap-2">
                  <FaUser /> {user.name.split(" ")[0]}
                </div>
              }
              isOpen={userDropdownOpen}
              onToggle={() => setUserDropdownOpen(!userDropdownOpen)}
              onClose={() => setUserDropdownOpen(false)}
              label={`User menu for ${user.name.split(" ")[0]}`}
            >
              <AccessibleMenuItem 
                href="/dashboard"
                onClick={() => setUserDropdownOpen(false)}
              >
                Dashboard
              </AccessibleMenuItem>
              <AccessibleMenuItem 
                href="/profile"
                onClick={() => setUserDropdownOpen(false)}
              >
                Profile
              </AccessibleMenuItem>
              <AccessibleMenuItem 
                href="/orders"
                onClick={() => setUserDropdownOpen(false)}
              >
                Order History
              </AccessibleMenuItem>
              {!loading && claims?.admin && (
                <AccessibleMenuItem
                  href="/admin"
                  prefetch={false}
                  onClick={() => setUserDropdownOpen(false)}
                  className="text-red-600 font-medium"
                >
                  Admin
                </AccessibleMenuItem>
              )}
              <AccessibleMenuItem
                onClick={async () => {
                  await logout()
                  setUserDropdownOpen(false)
                }}
              >
                Logout
              </AccessibleMenuItem>
            </AccessibleDropdown>
          ) : (
            <Link href="/auth/login" className="btn-outline flex items-center gap-2">
              <FaUser /> Login
            </Link>
          )}
        </div>
      </div>

      <MobileMenu 
        open={mobileMenuOpen} 
        onOpenChange={setMobileMenuOpen}
      />
      </nav>
      <EmailVerificationBanner className="fixed top-20 left-0 right-0 z-40 mx-4" />
    </>
  )
}

export default Navbar
