"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/context/AuthContext"
import { useCart } from "@/lib/context/CartContext"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, User, ChevronDown, Menu, X } from "lucide-react"
import CartDropdown from "@/components/cart/CartDropdown"
import { cn } from "@/lib/utils"
import { NAV_ITEMS, type NavItem } from "@/config/nav"

export default function Navbar() {
  const pathname = usePathname()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const { data: session, status: sessionStatus } = useSession()
  const { items, itemCount } = useCart()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const userDropdownRef = useRef<HTMLDivElement>(null)

  // Optimize loading state - show UI immediately if we have any auth info
  const isLoading = authLoading && sessionStatus === "loading"
  const hasUser = user || session?.user
  const userRole = user?.role || (session?.user as any)?.role || 'customer'

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === "/" || !pathname) {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  const handleUserDropdownToggle = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen)
  }

  // Filter nav items for main navigation
  const mainNavItems = NAV_ITEMS.filter(item => 
    !item.requiresAuth && !item.requiresAdmin && !item.mobileOnly
  ).slice(0, 6) // Limit to first 6 items for main nav

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block text-xl">
              Broski&apos;s Kitchen
            </span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          <span className="sr-only">Toggle Menu</span>
        </button>

        {/* Mobile logo */}
        <div className="flex md:hidden">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-lg">Broski&apos;s Kitchen</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:flex-1">
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {mainNavItems.map((item: NavItem) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  isActive(item.href) ? "text-foreground" : "text-foreground/60"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right side actions */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          {/* Order To-Go Button */}
          <Button asChild variant="default" size="sm" className="hidden sm:flex">
            <Link href="/order">Order To-Go</Link>
          </Button>

          {/* Cart Dropdown - Use existing component */}
          <CartDropdown />

          {/* User Authentication */}
          {!isLoading && (
            <>
              {hasUser ? (
                <div className="relative" ref={userDropdownRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-2"
                    onClick={handleUserDropdownToggle}
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {user?.name || session?.user?.name || "Account"}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>

                  {/* User Dropdown Menu */}
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md border bg-popover p-1 shadow-md">
                      <Link
                        href="/dashboard"
                        className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/profile"
                        className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        href="/orders"
                        className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        Order History
                      </Link>
                      {userRole === 'admin' && (
                        <Link
                          href="/admin"
                          className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          Admin
                        </Link>
                      )}
                      <hr className="my-1" />
                      <Link
                        href="/auth/logout"
                        className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        Sign Out
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/auth/login">Login</Link>
                </Button>
              )}
            </>
          )}

          {/* Loading state - show minimal UI */}
          {isLoading && (
            <div className="flex items-center space-x-2">
              <div className="h-8 w-16 animate-pulse rounded bg-muted"></div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="border-t md:hidden">
          <div className="container py-4">
            <nav className="flex flex-col space-y-3">
              {NAV_ITEMS.map((item: NavItem) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-foreground/80",
                    isActive(item.href) ? "text-foreground" : "text-foreground/60"
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <hr className="my-2" />
              <Link
                href="/order"
                className="text-sm font-medium text-foreground/60 hover:text-foreground/80"
                onClick={() => setIsMenuOpen(false)}
              >
                Order To-Go
              </Link>
              {!isLoading && !hasUser && (
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-foreground/60 hover:text-foreground/80"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </nav>
  )
}