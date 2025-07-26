"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { FaBars, FaTimes, FaUser, FaShoppingBag } from "react-icons/fa"
import CartDropdown from "../../components/cart/CartDropdown"
import { useCart } from "../../lib/context/CartContext"
import { useAuth } from "../../lib/context/AuthContext"
import { EmailVerificationBanner } from "../auth/EmailVerificationBanner"

const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const { itemCount } = useCart()
  const pathname = usePathname()
  const { user, logout } = useAuth()
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
      <nav className={`fixed top-0 w-full bg-black text-white h-20 z-50 shadow-lg border-b border-[#333333] transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
      <div className="container mx-auto flex justify-between items-center h-full px-4">
        <Link href="/" className="text-2xl font-bold graffiti-text hover:text-white transition-colors duration-300">
          Broski&apos;s Kitchen
        </Link>

        <button
          className="md:hidden text-white focus:outline-none hover:text-gold-foil transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>

        <div className="hidden md:flex items-center space-x-6">
          <Link href="/menu" className={`nav-link ${pathname === "/menu" ? "nav-link-active" : ""}`}>
            Menu
          </Link>
          <Link href="/infused-menu" className={`nav-link ${pathname === "/infused-menu" ? "nav-link-active" : ""}`}>
            Infused Menu - Coming Soon
          </Link>
          <Link href="/locations" className={`nav-link ${pathname === "/locations" ? "nav-link-active" : ""}`}>
            Locations
          </Link>
          <Link href="/rewards" className={`nav-link ${pathname === "/rewards" ? "nav-link-active" : ""}`}>
            Rewards
          </Link>
          <Link href="/shop" className={`nav-link ${pathname === "/shop" ? "nav-link-active" : ""}`}>
            Shop
          </Link>
          <Link href="/catering" className={`nav-link ${pathname === "/catering" ? "nav-link-active" : ""}`}>
            Catering
          </Link>
          <Link href="/contact" className={`nav-link ${pathname === "/contact" ? "nav-link-active" : ""}`}>
            Contact
          </Link>
          <a 
            href="https://otw-chi.vercel.app" 
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 border-2 border-red-500 hover:border-red-400"
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
            <div className="relative" ref={dropdownRef}>
              <button 
                className="btn-outline flex items-center gap-2"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                <FaUser /> {user.name.split(" ")[0]}
              </button>
              <div className={`absolute right-0 mt-2 w-48 bg-[#1A1A1A] rounded-md shadow-lg py-1 z-50 border border-[#333333] ${userDropdownOpen ? 'block' : 'hidden'}`}>
                <Link 
                  href="/dashboard" 
                  className="block px-4 py-2 text-sm text-white hover:bg-[#333333]"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/profile" 
                  className="block px-4 py-2 text-sm text-white hover:bg-[#333333]"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  Profile
                </Link>
                <Link 
                  href="/orders" 
                  className="block px-4 py-2 text-sm text-white hover:bg-[#333333]"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  Order History
                </Link>
                <button
                  onClick={async () => {
                    await logout()
                    setUserDropdownOpen(false)
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#333333]"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Link href="/auth/login" className="btn-outline flex items-center gap-2">
              <FaUser /> Login
            </Link>
          )}
        </div>
      </div>

      <div
        className={`md:hidden mobile-menu ${mobileMenuOpen ? "open" : ""} bg-[#111111] border-t border-[#333333] mt-4`}
      >
        <div className="container mx-auto flex flex-col space-y-3 px-4 py-4">
          <Link
            href="/menu"
            className={`py-2 hover:text-gold-foil transition-colors duration-300 flex items-center ${pathname === "/menu" ? "text-gold-foil font-bold" : ""}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Menu
          </Link>
          <Link
              href="/infused-menu"
              className={`py-2 hover:text-gold-foil transition-colors duration-300 flex items-center ${pathname === "/infused-menu" ? "text-gold-foil font-bold" : ""}`}
            onClick={() => setMobileMenuOpen(false)}
            >
              Infused Menu
            </Link>
          <Link
            href="/locations"
            className={`py-2 hover:text-gold-foil transition-colors duration-300 flex items-center ${pathname === "/locations" ? "text-gold-foil font-bold" : ""}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Locations
          </Link>
          <Link
              href="/events"
              className={`py-2 hover:text-gold-foil transition-colors duration-300 flex items-center ${pathname === "/events" ? "text-gold-foil font-bold" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Events
            </Link>
            <Link
              href="/music"
              className={`py-2 hover:text-gold-foil transition-colors duration-300 flex items-center ${pathname === "/music" ? "text-gold-foil font-bold" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Music
            </Link>
            <Link
              href="/rewards"
            className={`py-2 hover:text-gold-foil transition-colors duration-300 flex items-center ${pathname === "/rewards" ? "text-gold-foil font-bold" : ""}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Rewards
          </Link>
          <Link
            href="/shop"
            className={`py-2 hover:text-gold-foil transition-colors duration-300 flex items-center ${pathname === "/shop" ? "text-gold-foil font-bold" : ""}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Shop
          </Link>
          <Link
            href="/catering"
            className={`py-2 hover:text-gold-foil transition-colors duration-300 flex items-center ${pathname === "/catering" ? "text-gold-foil font-bold" : ""}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Catering
          </Link>
          <Link
            href="/contact"
            className={`py-2 hover:text-gold-foil transition-colors duration-300 flex items-center ${pathname === "/contact" ? "text-gold-foil font-bold" : ""}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Contact
          </Link>
          <a
            href="https://otw-chi.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 border-2 border-red-500 hover:border-red-400 flex items-center gap-3 my-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Image 
              src="/images/otw-logo.svg" 
              alt="OTW Logo" 
              width={28} 
              height={14} 
              className="filter brightness-110"
            />
            <span className="text-base font-extrabold tracking-wide">ON THE WAY</span>
          </a>
          <Link
            href="/cart"
            className="py-2 flex items-center hover:text-gold-foil transition-colors duration-300"
            onClick={() => setMobileMenuOpen(false)}
          >
            <FaShoppingBag className="mr-2" /> Cart {itemCount > 0 && `(${itemCount})`}
          </Link>

          {user ? (
            <div className="pt-4 border-t border-[#333333] mt-2 space-y-2">
              <Link
                href="/sign-in"
                className="block py-2 hover:text-gold-foil transition-colors duration-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FaUser className="inline mr-2" /> {user.name}
              </Link>
              <Link
                href="/orders"
                className="block py-2 hover:text-gold-foil transition-colors duration-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                Order History
              </Link>
              <button
                onClick={async () => {
                  await logout()
                  setMobileMenuOpen(false)
                }}
                className="w-full text-left py-2 hover:text-gold-foil transition-colors duration-300"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-[#333333] mt-2">
              <Link
                href="/auth/login"
                className="btn-primary w-full flex items-center justify-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FaUser /> Login
              </Link>
            </div>
          )}
        </div>
      </div>
      </nav>
      <EmailVerificationBanner className="fixed top-20 left-0 right-0 z-40 mx-4" />
    </>
  )
}

export default Navbar
