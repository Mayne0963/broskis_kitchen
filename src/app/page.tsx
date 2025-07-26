"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaUtensils, FaMapMarkerAlt, FaCalendarAlt, FaGift, FaFire, FaBars, FaTimes, FaUser, FaShoppingBag, FaPlay, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { usePathname } from "next/navigation";
import CartDropdown from "../components/cart/CartDropdown";
import { useCart } from "../lib/context/CartContext";
import { useAuth } from "../lib/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useHeroContent } from "../hooks/useHeroContent";
// Note: Using direct path in Image src instead of import for Next.js compatibility


function Page() {
  const [showSaucePopup, setShowSaucePopup] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { itemCount } = useCart();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { heroContent, loading } = useHeroContent();

  useEffect(() => {
    // Show popup after 3 seconds
    const showTimer = setTimeout(() => {
      setShowSaucePopup(true);
    }, 3000);

    // Hide popup after 8 seconds (3s delay + 5s visible)
    const hideTimer = setTimeout(() => {
      setShowSaucePopup(false);
    }, 11000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section - Fullscreen */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
        {/* OTW Delivery Button - Top Right Corner */}
        <div className="absolute top-6 right-6 z-20">
          <a 
            href="https://otw-chi.vercel.app" 
            target="_blank"
            rel="noopener noreferrer"
            className="broski-otw-gold-button"
          >
            <Image 
              src="/images/otw-logo.svg" 
              alt="OTW Logo" 
              width={36} 
              height={18} 
              className="filter brightness-110"
            />
            <span className="text-base font-extrabold tracking-wide">OTW DELIVERY</span>
          </a>
        </div>
        
        {/* Hero Content - Central Vertical Layout */}
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-6 max-w-6xl mx-auto flex flex-col items-center justify-start pt-8 min-h-screen w-full">
          {/* Centered Broski's Gold Logo at Top */}
          <motion.div 
            className="mb-8 flex justify-center"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <Image
              src="/images/broskis-gold-logo.png"
              alt="Broski's Kitchen Official Gold Logo"
              width={280}
              height={140}
              className="mx-auto drop-shadow-xl max-w-[280px] h-auto"
              priority
              loading="eager"
              sizes="(max-width: 768px) 250px, 280px"
              style={{ display: 'block' }}
            />
          </motion.div>

          {/* Tagline/Header Stack */}
          <motion.div 
            className="mb-8 space-y-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          >
            {/* HOME OF THE AWARD-WINNING - Gold, Serif, ALL CAPS */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-yellow-400 uppercase tracking-wide leading-tight" style={{ fontFamily: 'var(--font-playfair), serif', color: '#FFD700' }}>
              HOME OF THE AWARD-WINNING
            </h1>
             
            {/* BOOSIE WINGS - Larger, Gold, Bold Serif, ALL CAPS */}
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-yellow-400 uppercase tracking-tight leading-none" style={{ fontFamily: 'var(--font-playfair), serif', color: '#FFD700' }}>
              BOOSIE WINGS
            </h2>
             
            {/* CAUSE IT'S BADAZZ - Red, All Caps, smaller */}
            <motion.p 
              className="text-xl md:text-2xl lg:text-3xl font-bold text-red-600 uppercase tracking-wide"
              style={{ color: '#C1272D', fontWeight: 700 }}
              animate={{ 
                textShadow: [
                  "0 0 5px #C1272D, 0 0 10px #C1272D, 0 0 15px #C1272D",
                  "0 0 10px #C1272D, 0 0 20px #C1272D, 0 0 30px #C1272D",
                  "0 0 5px #C1272D, 0 0 10px #C1272D, 0 0 15px #C1272D"
                ]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            >
              CAUSE IT&apos;S BADAZZ
            </motion.p>
          </motion.div>

          {/* Order Now Button - Red Background, White Text */}
          <motion.div 
            className="mb-16 flex justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.9, ease: "easeOut" }}
          >
            <Link 
              href="/menu" 
              className="inline-block bg-[#C1272D] hover:bg-[#A01F26] text-white font-bold py-[14px] px-[24px] rounded-md transition-all duration-300 transform hover:scale-105 uppercase tracking-wide"
              style={{ fontFamily: 'sans-serif' }}
              aria-label="Order Now Button for Boosie Wings"
            >
              ORDER NOW
            </Link>
          </motion.div>

          {/* Wings Centerpiece - Boosie Sweet Heat Sauce Image */}
          <motion.div 
            className="mb-4 w-full overflow-hidden flex justify-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
          >
            <div className="relative w-full max-w-6xl">
              <Image
                src="/images/boosie-wings.png"
                alt="Boosie Wings Image"
                width={2400}
                height={900}
                className="w-full h-auto object-cover drop-shadow-lg rounded-lg"
                priority
                loading="eager"
                sizes="100vw"
                style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Navigation Bar - Below Hero Section */}
      <nav className="bg-black border-b-2 border-[#FFD700] py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center space-x-8 overflow-x-auto">
            <Link href="/menu" className="text-white hover:text-[#FFD700] hover:border-b-2 hover:border-[#FFD700] transition-all duration-300 font-medium whitespace-nowrap px-2 py-1">
              Menu
            </Link>
            <span className="text-[#FFD700]">|</span>
            <Link href="/locations" className="text-white hover:text-[#FFD700] hover:border-b-2 hover:border-[#FFD700] transition-all duration-300 font-medium whitespace-nowrap px-2 py-1">
              Locations
            </Link>
            <span className="text-[#FFD700]">|</span>
            <Link href="/events" className="text-white hover:text-[#FFD700] hover:border-b-2 hover:border-[#FFD700] transition-all duration-300 font-medium whitespace-nowrap px-2 py-1">
              Events
            </Link>
            <span className="text-[#FFD700]">|</span>
            <Link href="/rewards" className="text-white hover:text-[#FFD700] hover:border-b-2 hover:border-[#FFD700] transition-all duration-300 font-medium whitespace-nowrap px-2 py-1">
              Rewards
            </Link>
            <span className="text-[#FFD700]">|</span>
            <Link href="/shop" className="text-white hover:text-[#FFD700] hover:border-b-2 hover:border-[#FFD700] transition-all duration-300 font-medium whitespace-nowrap px-2 py-1">
              Shop
            </Link>
            <span className="text-[#FFD700]">|</span>
            <Link href="/contact" className="text-white hover:text-[#FFD700] hover:border-b-2 hover:border-[#FFD700] transition-all duration-300 font-medium whitespace-nowrap px-2 py-1">
              Contact
            </Link>
          </div>
        </div>
      </nav>

      {/* Welcome Block - Below Hero */}
      <section className="py-20 bg-black relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            {/* Header: WELCOME TO BROSKI'S KITCHEN - Gold, Serif, ALL CAPS, centered */}
            <motion.h2 
             className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-[#FFD700] uppercase text-center mb-8"
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8 }}
             viewport={{ once: true }}
           >
             WELCOME TO BROSKI&apos;S KITCHEN
           </motion.h2>
            
            {/* Subtext: White text with max width readability */}
            <motion.p 
              className="text-xl text-white max-w-2xl mx-auto leading-relaxed mb-8" 
              style={{ maxWidth: '65ch' }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              viewport={{ once: true }}
            >
              Luxury Street Gourmet – where culinary culture meets legacy flavor. From our Boosie Wings to Infused Broski Dust Fries, every plate is served with soul and sauce.
            </motion.p>
            
            {/* CTA Button: Explore Our Menu - Crimson red with white text */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              viewport={{ once: true }}
            >
              <Link 
                href="/menu" 
                className="inline-block bg-[#B22222] hover:bg-[#8B1818] text-white font-bold py-4 px-12 text-xl rounded-lg shadow-2xl transform hover:scale-105 hover:shadow-[0_0_30px_rgba(178,34,34,0.6)] transition-all duration-300 border-2 border-[#B22222] hover:border-[#DC143C]"
                aria-label="Explore Our Menu Button"
              >
                Explore Our Menu
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#0A0A0A] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/5 via-transparent to-black/10 opacity-50"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="heading-lg mb-12 text-center">
            Experience <span className="graffiti-text elegant-glow">Broski&apos;s</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="feature-card animate-fade-in group">
              <div className="bg-[#FFD700] bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-opacity-40 transition-all duration-300 group-hover:scale-110">
                <FaUtensils className="text-[#FFD700] text-2xl group-hover:text-3xl transition-all duration-300" />
              </div>
              <h3 className="text-xl md:text-2xl font-semibold mb-2 text-white group-hover:text-[#FFD700] transition-colors duration-300">Gourmet Menu</h3>
              <p className="text-[#FFD700] group-hover:text-white transition-colors duration-300">Explore our luxury street food with both regular and infused options.</p>
            </div>
            <div className="feature-card animate-fade-in animate-delay-100 group">
              <div className="bg-[#FFD700] bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-opacity-40 transition-all duration-300 group-hover:scale-110">
                <FaMapMarkerAlt className="text-[#FFD700] text-2xl group-hover:text-3xl transition-all duration-300" />
              </div>
              <h3 className="text-xl md:text-2xl font-semibold mb-2 text-white group-hover:text-[#FFD700] transition-colors duration-300">Multiple Locations</h3>
              <p className="text-[#FFD700] group-hover:text-white transition-colors duration-300">Visit us at our convenient locations throughout the city.</p>
            </div>
            <div className="feature-card animate-fade-in animate-delay-200 group">
              <div className="bg-[#FFD700] bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-opacity-40 transition-all duration-300 group-hover:scale-110">
                <FaCalendarAlt className="text-[#FFD700] text-2xl group-hover:text-3xl transition-all duration-300" />
              </div>
              <h3 className="text-xl md:text-2xl font-semibold mb-2 text-white group-hover:text-[#FFD700] transition-colors duration-300">Special Events</h3>
              <p className="text-[#FFD700] group-hover:text-white transition-colors duration-300">Join our exclusive tasting events and culinary experiences.</p>
            </div>
            <div className="feature-card animate-fade-in animate-delay-300 group">
              <div className="bg-[#FFD700] bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-opacity-40 transition-all duration-300 group-hover:scale-110">
                <FaGift className="text-[#FFD700] text-2xl group-hover:text-3xl transition-all duration-300" />
              </div>
              <h3 className="text-xl md:text-2xl font-semibold mb-2 text-white group-hover:text-[#FFD700] transition-colors duration-300">Rewards Program</h3>
              <p className="text-[#FFD700] group-hover:text-white transition-colors duration-300">Earn points with every purchase and unlock exclusive perks.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Specialty Section */}
      <section className="py-20 bg-[#0A0A0A] overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-t from-[#FFD700]/5 via-transparent to-transparent opacity-70"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-white">
            <span className="text-[#FFD700]">Specialty</span>
            <div className="w-24 h-1 bg-gradient-to-r from-[#FFD700] to-[#FFD700]/30 mx-auto mt-4 rounded-full"></div>
          </h2>
          <div className="infinite-scroll-container">
            <div className="infinite-scroll-track">
              {/* First set of items */}
              <div className="specialty-card scroll-item">
                <div className="relative h-48 mb-4">
                  <Image src="/images/1000009121.png" alt="Boosie Sweet Heat Sauce" fill className="object-cover rounded-lg" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Boosie Sweet Heat Sauce</h3>
                <p className="text-[#FFD700] mb-4">Smooth, saucy, and slightly savage. Our signature sweet heat sauce that brings the perfect balance of flavor and fire.</p>
                <div className="flex justify-between items-center">
                  <span className="text-[#FFD700] font-bold text-xl">$12</span>
                  <Link href="/menu" className="bg-[#FFD700] hover:bg-[#E6C200] text-black font-bold py-2 px-4 rounded transition-colors duration-300">
                    View Details
                  </Link>
                </div>
              </div>
              <div className="specialty-card scroll-item">
                <div className="relative h-48 mb-4">
                  <Image src="/images/1000009265.png" alt="Lotus Cheesecake" fill className="object-cover rounded-lg" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Lotus Cheesecake</h3>
                <p className="text-[#FFD700] mb-4">Decadent golden brown cheesecake infused with Lotus cookie crumbles, crafted with premium ingredients.</p>
                <div className="flex justify-between items-center">
                  <span className="text-[#FFD700] font-bold text-xl">$12</span>
                  <Link href="/menu" className="bg-[#FFD700] hover:bg-[#E6C200] text-black font-bold py-2 px-4 rounded transition-colors duration-300">
                    View Details
                  </Link>
                </div>
              </div>
              <div className="specialty-card scroll-item">
                <div className="relative h-48 mb-4">
                  <Image src="/images/1000008496.webp" alt="Chocolate Cupcake" fill className="object-cover rounded-lg" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Chocolate Cupcake</h3>
                <p className="text-[#FFD700] mb-4">Rich chocolate cupcake with dark chocolate drizzle, made with premium cocoa and artisanal craftsmanship.</p>
                <div className="flex justify-between items-center">
                  <span className="text-[#FFD700] font-bold text-xl">$6</span>
                  <Link href="/menu" className="bg-[#FFD700] hover:bg-[#E6C200] text-black font-bold py-2 px-4 rounded transition-colors duration-300">
                    View Details
                  </Link>
                </div>
              </div>
              <div className="specialty-card scroll-item">
                <div className="relative h-48 mb-4">
                  <Image src="/images/1000008447.webp" alt="Broski's Badazz Seasoning" fill className="object-cover rounded-lg" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Broski's Badazz Seasoning</h3>
                <p className="text-[#FFD700] mb-4">Our signature blend of premium spices and herbs, the secret behind Broski's legendary flavor profile.</p>
                <div className="flex justify-between items-center">
                  <span className="text-[#FFD700] font-bold text-xl">$15</span>
                  <Link href="/menu" className="bg-[#FFD700] hover:bg-[#E6C200] text-black font-bold py-2 px-4 rounded transition-colors duration-300">
                    View Details
                  </Link>
                </div>
              </div>
              {/* Duplicate set for seamless loop */}
              <div className="specialty-card scroll-item">
                <div className="relative h-48 mb-4">
                  <Image src="/images/1000009121.png" alt="Boosie Sweet Heat Sauce" fill className="object-cover rounded-lg" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Boosie Sweet Heat Sauce</h3>
                <p className="text-gray-300 mb-4">Smooth, saucy, and slightly savage. Our signature sweet heat sauce that brings the perfect balance of flavor and fire.</p>
                <div className="flex justify-between items-center">
                  <span className="text-yellow-600 font-bold text-xl">$12</span>
                  <Link href="/menu" className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-2 px-4 rounded transition-colors duration-300">
                    View Details
                  </Link>
                </div>
              </div>
              <div className="specialty-card scroll-item">
                <div className="relative h-48 mb-4">
                  <Image src="/images/1000009265.png" alt="Lotus Cheesecake" fill className="object-cover rounded-lg" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Lotus Cheesecake</h3>
                <p className="text-gray-300 mb-4">Decadent golden brown cheesecake infused with Lotus cookie crumbles, crafted with premium ingredients.</p>
                <div className="flex justify-between items-center">
                  <span className="text-yellow-600 font-bold text-xl">$12</span>
                  <Link href="/menu" className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-2 px-4 rounded transition-colors duration-300">
                    View Details
                  </Link>
                </div>
              </div>
              <div className="specialty-card scroll-item">
                <div className="relative h-48 mb-4">
                  <Image src="/images/1000008496.webp" alt="Chocolate Cupcake" fill className="object-cover rounded-lg" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Chocolate Cupcake</h3>
                <p className="text-gray-300 mb-4">Rich chocolate cupcake with dark chocolate drizzle, made with premium cocoa and artisanal craftsmanship.</p>
                <div className="flex justify-between items-center">
                  <span className="text-yellow-600 font-bold text-xl">$6</span>
                  <Link href="/menu" className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-2 px-4 rounded transition-colors duration-300">
                    View Details
                  </Link>
                </div>
              </div>
              <div className="specialty-card scroll-item">
                <div className="relative h-48 mb-4">
                  <Image src="/images/1000008447.webp" alt="Broski's Badazz Seasoning" fill className="object-cover rounded-lg" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Broski's Badazz Seasoning</h3>
                <p className="text-gray-300 mb-4">Our signature blend of premium spices and herbs, the secret behind Broski's legendary flavor profile.</p>
                <div className="flex justify-between items-center">
                  <span className="text-yellow-600 font-bold text-xl">$15</span>
                  <Link href="/menu" className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-2 px-4 rounded transition-colors duration-300">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0A0A0A] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/10 via-transparent to-red-900/5 opacity-40"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-600/5 rounded-full blur-3xl"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white animate-fade-in">
            Ready to Experience <span className="text-yellow-600">Broski&apos;s</span>?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto animate-fade-in animate-delay-200">
            Join thousands of satisfied customers who have discovered the perfect blend of luxury and street culture.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in animate-delay-400">
            <Link href="/menu" className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-4 px-10 rounded-lg transform hover:scale-105 transition-all duration-300">
              Order Now
            </Link>
            <Link href="/rewards" className="border-2 border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-black font-bold py-4 px-10 rounded-lg transform hover:scale-105 transition-all duration-300">
              Join Rewards
            </Link>
          </div>
        </div>
      </section>

      {/* Close the main div */}
    </div>
  );
}

export default Page;
