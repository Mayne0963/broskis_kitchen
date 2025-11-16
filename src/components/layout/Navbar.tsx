"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { FaBars, FaTimes, FaUser, FaShoppingBag } from "react-icons/fa"
import { Button } from "@/components/ui/button"
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

const NAV = [
  { href: "/menu", label: "Menu" },
  { href: "/events", label: "Events" },
  { href: "/music", label: "Music" },
  { href: "/coming-soon", label: "Rewards" },
  { href: "/catering", label: "Catering" },
  { href: "/contact", label: "Contact" },
]

const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const { itemCount } = useCart()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { claims, loading } = useAuthClaims()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const lastScrollYRef = useRef(0)
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

  // Handle scroll behavior - optimized to prevent re-renders
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Set scrolled state
      setIsScrolled(currentScrollY > 10)
      
      // Hide/show navbar based on scroll direction
      if (currentScrollY > lastScrollYRef.current && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      
      lastScrollYRef.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, []) // Remove lastScrollY dependency to prevent re-renders

  return (
    <>
      <header className="sticky top-0 z-50 bg-black/70 backdrop-blur border-b border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* LEFT: logo */}
            <div className="min-w-[140px] flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <Image 
                  src="/images/broskis-gold-logo.png"
                  alt="Broski's Kitchen" 
                  width={36}
                  height={36} 
                  priority 
                />
                <span className="text-2xl font-bold graffiti-text hover:text-white transition-colors duration-300">Broski&apos;s Kitchen</span>
              </Link>
            </div>

            {/* CENTER: main nav — perfectly centered */}
            <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex">
              <ul className="flex items-center gap-6">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link 
                      href={item.href} 
                      className={`nav-link ${pathname === item.href ? "nav-link-active" : ""}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* RIGHT: actions (OTW + Login) */}
            <div className="min-w-[140px] flex items-center gap-2 justify-end">
              {/* OTW button with larger image */}
              <Button asChild variant="primary">
                <Link href="https://otw-chi.vercel.app" className="broski-otw-gold-button">
                  <Image 
                    src="/images/otw-logo.png"
                    alt="OTW" 
                    width={28}
                    height={28} 
                  />
                  <span className="text-sm font-extrabold tracking-wide">OTW</span>
                </Link>
              </Button>

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
                    href="/account/profile"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    Profile
                  </AccessibleMenuItem>
                  <AccessibleMenuItem 
                    href="/account/orders"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    Order History
                  </AccessibleMenuItem>
                  {!loading && claims?.admin && (
                     <AccessibleMenuItem
                       href="/admin"
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
                <Button asChild variant="outline" className="border-zinc-600 hover:bg-zinc-800">
                  <Link href="/auth/login">Login</Link>
                </Button>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              data-testid="mobile-menu-toggle"
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden inline-flex items-center justify-center rounded-lg px-3 py-2 ring-1 ring-white/20 bg-zinc-900/60 text-white"
            >
              <FaBars size={24} />
            </button>
          </div>
        </div>

        <MobileMenu 
          open={mobileMenuOpen} 
          onOpenChange={setMobileMenuOpen}
        />
      </header>
      <EmailVerificationBanner className="fixed top-16 left-0 right-0 z-40 mx-4" />
    </>
  )
}

export default Navbar
