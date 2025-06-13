"use client";
import React from "react";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  User,
  ShoppingBag,
  Home,
  Utensils,
  Car,
  MapPin,
  Crown,
  HelpingHand,
} from "lucide-react";
import { useCart } from "../../lib/context/CartContext";
import { useFirebaseAuth } from "../../contexts/FirebaseAuthContext";
import Button from "../Button";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";
import { cn } from "../../lib/utils";
import Image from "next/image";

const mainNavItems = [
  { name: "Home", href: "/", icon: <Home className="mr-3 h-4 w-4" /> },
  {
    name: "Book Service",
    href: "/otw",
    icon: <Car className="mr-3 h-4 w-4" />,
  },
  { name: "Track", href: "/track", icon: <MapPin className="mr-3 h-4 w-4" /> },
  {
    name: "Partners",
    href: "/partners",
    icon: <HelpingHand className="mr-3 h-4 w-4" />,
  },
  {
    name: "Volunteers",
    href: "/volunteers",
    icon: <HelpingHand className="mr-3 h-4 w-4" />,
  },
  {
    name: "Restaurants",
    href: "/restaurants",
    icon: <Utensils className="mr-3 h-4 w-4" />,
  },
  {
    name: "Membership",
    href: "/tier",
    icon: <Crown className="mr-3 h-4 w-4" />,
  },
];

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setUserMenuOpen] = useState(false);
  useCart(); // Keep the context connected without destructuring
  const pathname = usePathname();
  const { user, logout } = useFirebaseAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [hideHeader, setHideHeader] = useState(false);
  const lastScrollY = useRef(0);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname, setMobileMenuOpen, setUserMenuOpen]);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [mobileMenuOpen]);

  // Close menus when clicking outside
  useOnClickOutside<HTMLDivElement>(menuRef, () => setMobileMenuOpen(false));
  useOnClickOutside<HTMLDivElement>(userMenuRef, () => setUserMenuOpen(false));

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastScrollY.current && window.scrollY > 50) {
        setHideHeader(true);
      } else {
        setHideHeader(false);
      }
      lastScrollY.current = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-black shadow-lg border-b border-otw-gold/10 transition-transform duration-300",
        hideHeader ? "-translate-y-full" : "translate-y-0"
      )}
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8"
        aria-label="Global"
      >
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">On The Way Delivery</span>
            <Image
              className="h-12 w-auto"
              src="/assets/logos/logo.png"
              alt="OTW Delivery"
              width={48}
              height={48}
              priority
            />
          </Link>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-white/70 hover:text-otw-gold"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
          {mainNavItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "text-sm font-semibold leading-6 transition-colors",
                pathname === item.href
                  ? "text-otw-gold"
                  : "text-white/70 hover:text-otw-gold",
              )}
            >
              {item.name}
            </Link>
          ))}
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
          <Link href="/cart">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-otw-gold"
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="sr-only">Shopping cart</span>
            </Button>
          </Link>
          <Link href="/locations" className={`nav-link ${pathname === "/locations" ? "nav-link-active" : ""}`}>
            Locations
          </Link>
          <Link href="/events" className={`nav-link ${pathname === "/events" ? "nav-link-active" : ""}`}>
            Events
          </Link>
          <Link href="/rewards" className={`nav-link ${pathname === "/rewards" ? "nav-link-active" : ""}`}>
            Rewards
          </Link>
          <Link href="/shop" className={`nav-link ${pathname === "/shop" ? "nav-link-active" : ""}`}>
            Shop
          </Link>
          <Link href="/contact" className={`nav-link ${pathname === "/contact" ? "nav-link-active" : ""}`}>
            Contact
          </Link>
          <a 
            href="https://otw-chi.vercel.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="nav-link bg-gradient-to-r from-[#D4AF37] to-[#880808] text-white px-4 py-2 rounded-md hover:opacity-90 transition-opacity duration-300 font-semibold"
          >
            OTW
          </a>

          <CartDropdown />

          {user ? (
            <>
              <Link href="/profile">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-otw-gold"
                >
                  <User className="h-5 w-5" />
                  <span className="sr-only">Profile</span>
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => logout()}
                className="text-white border-white/20 hover:bg-otw-gold hover:text-otw-black"
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/signin">
                <Button
                  variant="ghost"
                  className="text-white/70 hover:text-otw-gold"
                >
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-otw-gold text-otw-black hover:bg-otw-gold-600">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          "lg:hidden",
          mobileMenuOpen ? "fixed inset-0 z-50" : "hidden",
        )}
      >
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          aria-hidden="true"
        />
        <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-otw-black/95 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-otw-gold/10">
          <div className="flex items-center justify-between">
            <Link href="/" className="-m-1.5 p-1.5">
              <span className="sr-only">On The Way Delivery</span>
              <Image
                className="h-8 w-auto"
                src="/assets/logos/logo.png"
                alt="OTW Delivery"
                width={32}
                height={32}
              />
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-white/70 hover:text-otw-gold"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-otw-gold/10">
              <div className="space-y-2 py-6">
                {mainNavItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center -mx-3 rounded-lg px-3 py-2 text-base font-semibold leading-7 transition-colors",
                      pathname === item.href
                        ? "text-otw-gold bg-otw-gold/10"
                        : "text-white/70 hover:text-otw-gold hover:bg-otw-gold/5",
                    )}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="py-6">
                {user ? (
                  <>
                    <Link
                      href="/profile"
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-white/70 hover:text-otw-gold hover:bg-otw-gold/5"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => logout()}
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-white/70 hover:text-otw-gold hover:bg-otw-gold/5"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/signin"
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-white/70 hover:text-otw-gold hover:bg-otw-gold/5"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-white/70 hover:text-otw-gold hover:bg-otw-gold/5"
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

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
            <span className="badge badge-new mr-2">NEW</span> Infused Menu
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
            className="py-2 bg-gradient-to-r from-[#D4AF37] to-[#880808] text-white px-4 rounded-md hover:opacity-90 transition-opacity duration-300 font-semibold text-center"
            onClick={() => setMobileMenuOpen(false)}
          >
            OTW
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
                href="/profile"
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
                onClick={() => {
                  logout()
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
  )
}

export default Navbar
