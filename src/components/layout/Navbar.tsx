"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { FaBars, FaUser } from "react-icons/fa"
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
import { MAIN_LINKS } from "../nav/links"
import { cancelCheckoutProgress } from "@/lib/utils/orderPersistence"

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
  const navLinks = useMemo(
    () =>
      MAIN_LINKS.filter(link =>
        ["/menu", "/events", "/music", "/rewards", "/catering", "/contact"].includes(link.href)
      ),
    []
  )

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

  const headerClassName = `
    fixed top-0 left-0 right-0 z-[80] w-full border-b border-zinc-800 pointer-events-auto transition-all duration-300
    ${isScrolled ? "bg-black/80 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.45)]" : "bg-black/60 backdrop-blur-sm"}
    ${isVisible ? "translate-y-0" : "-translate-y-full"}
  `

  return (
    <>
      <header
        id="navigation"
        className={headerClassName}
        data-scrolled={isScrolled}
        data-visible={isVisible}
      >
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
                <span className="text-2xl font-bold leading-tight navbar-gold-text">
                  Broski&apos;s Kitchen
                </span>
              </Link>
            </div>

            {/* CENTER: main nav — perfectly centered */}
            <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex">
              <ul className="flex items-center gap-6">
                {navLinks.map((item) => (
                  <li key={item.href}>
                    <Link 
                      href={item.href} 
                      onClick={() => {
                      cancelCheckoutProgress()
                    }}
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
              {/* Lunch Drop button (renamed from OTW) */}
              <Link href="/lunch-drop" className="btn-primary" onClick={cancelCheckoutProgress}>
                <span className="text-sm font-extrabold tracking-wide text-red-600">Lunch Drop</span>
              </Link>

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
                    onClick={() => {
                      cancelCheckoutProgress()
                      setUserDropdownOpen(false)
                    }}
                  >
                    Dashboard
                  </AccessibleMenuItem>
                  <AccessibleMenuItem 
                    href="/account/profile"
                    onClick={() => {
                      cancelCheckoutProgress()
                      setUserDropdownOpen(false)
                    }}
                  >
                    Profile
                  </AccessibleMenuItem>
                  <AccessibleMenuItem 
                    href="/account/orders"
                    onClick={() => {
                      cancelCheckoutProgress()
                      setUserDropdownOpen(false)
                    }}
                  >
                    Order History
                  </AccessibleMenuItem>
                  {!loading && claims?.admin && (
                     <AccessibleMenuItem
                       href="/admin"
                       onClick={() => {
                         cancelCheckoutProgress()
                         setUserDropdownOpen(false)
                       }}
                       className="text-red-600 font-medium"
                     >
                       Admin
                     </AccessibleMenuItem>
                   )}
                  <AccessibleMenuItem
                    onClick={async () => {
                      cancelCheckoutProgress()
                      await logout()
                      setUserDropdownOpen(false)
                    }}
                  >
                    Logout
                  </AccessibleMenuItem>
                </AccessibleDropdown>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={cancelCheckoutProgress}
                  className="btn-outline border border-zinc-600 hover:bg-zinc-800"
                >
                  Login
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              data-testid="mobile-menu-toggle"
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu-panel"
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
