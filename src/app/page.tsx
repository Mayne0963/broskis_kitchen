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
        {/* Hero Content - Central Vertical Layout */}
        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto flex flex-col items-center justify-center min-h-screen">
          {/* Centered Broski's Gold Logo at Top */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <Image
              src="/images/Untitled design-5.png"
              alt="Broski's Kitchen Official Gold Logo"
              width={400}
              height={200}
              className="mx-auto drop-shadow-2xl"
              priority
              loading="eager"
              sizes="(max-width: 768px) 300px, 400px"
            />
          </motion.div>

          {/* Tagline/Header Stack */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          >
            {/* HOME OF THE AWARD-WINNING - Gold, Serif, ALL CAPS */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold mb-2 text-[#FFD700] uppercase tracking-wide leading-tight">
              HOME OF THE AWARD-WINNING
            </h1>
             
            {/* BOOSIE WINGS - Larger, Gold, Bold Serif, ALL CAPS */}
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold mb-4 text-[#FFD700] uppercase tracking-tight leading-none">
              BOOSIE WINGS
            </h2>
             
            {/* CAUSE IT'S BADAZZ - Red, All Caps, smaller */}
            <motion.p 
              className="text-xl md:text-2xl lg:text-3xl font-bold text-[#B22222] uppercase tracking-wide"
              animate={{ 
                textShadow: [
                  "0 0 5px #B22222, 0 0 10px #B22222, 0 0 15px #B22222",
                  "0 0 10px #B22222, 0 0 20px #B22222, 0 0 30px #B22222",
                  "0 0 5px #B22222, 0 0 10px #B22222, 0 0 15px #B22222"
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

          {/* Order Now Button - Rounded Rectangle, Crimson Red */}
          <motion.div 
            className="mb-16"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.9, ease: "easeOut" }}
          >
            <Link 
              href="/menu" 
              className="inline-block bg-[#B22222] hover:bg-[#8B1818] text-white font-bold py-4 px-12 text-xl rounded-lg shadow-2xl transform hover:scale-105 hover:shadow-[0_0_30px_rgba(178,34,34,0.6)] transition-all duration-300 border-2 border-[#B22222] hover:border-[#DC143C]"
              aria-label="Order Now Button for Boosie Wings"
            >
              Order Now
            </Link>
          </motion.div>

          {/* Wings Centerpiece - Ultra-realistic wings spread across width */}
          <motion.div 
            className="mb-12 w-full overflow-hidden"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
          >
            <div className="relative w-full flex justify-center">
              <Image
                src="/images/ChatGPT Image Jul 25, 2025 at 08_30_15 PM.png"
                alt="Ultra-realistic Boosie Wings spread across black surface"
                width={2400}
                height={900}
                className="w-full h-auto object-cover shadow-2xl transform"
                priority
                loading="eager"
                sizes="100vw"
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
      <section className="py-20 bg-deep-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-foil/5 via-transparent to-burgundy/10 opacity-50"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="heading-lg mb-12 text-center">
            Experience <span className="graffiti-text elegant-glow">Broski&apos;s</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="feature-card animate-fade-in group">
              <div className="bg-gold-foil bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-opacity-40 transition-all duration-300 group-hover:scale-110">
                <FaUtensils className="text-gold-foil text-2xl group-hover:text-3xl transition-all duration-300" />
              </div>
              <h3 className="heading-sm mb-2 text-soft-white group-hover:text-gold-foil transition-colors duration-300">Gourmet Menu</h3>
              <p className="text-soft-gray group-hover:text-soft-white transition-colors duration-300">Explore our luxury street food with both regular and infused options.</p>
            </div>
            <div className="feature-card animate-fade-in animate-delay-100 group">
              <div className="bg-gold-foil bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-opacity-40 transition-all duration-300 group-hover:scale-110">
                <FaMapMarkerAlt className="text-gold-foil text-2xl group-hover:text-3xl transition-all duration-300" />
              </div>
              <h3 className="heading-sm mb-2 text-soft-white group-hover:text-gold-foil transition-colors duration-300">Multiple Locations</h3>
              <p className="text-soft-gray group-hover:text-soft-white transition-colors duration-300">Visit us at our convenient locations throughout the city.</p>
            </div>
            <div className="feature-card animate-fade-in animate-delay-200 group">
              <div className="bg-gold-foil bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-opacity-40 transition-all duration-300 group-hover:scale-110">
                <FaCalendarAlt className="text-gold-foil text-2xl group-hover:text-3xl transition-all duration-300" />
              </div>
              <h3 className="heading-sm mb-2 text-soft-white group-hover:text-gold-foil transition-colors duration-300">Special Events</h3>
              <p className="text-soft-gray group-hover:text-soft-white transition-colors duration-300">Join our exclusive tasting events and culinary experiences.</p>
            </div>
            <div className="feature-card animate-fade-in animate-delay-300 group">
              <div className="bg-gold-foil bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-opacity-40 transition-all duration-300 group-hover:scale-110">
                <FaGift className="text-gold-foil text-2xl group-hover:text-3xl transition-all duration-300" />
              </div>
              <h3 className="heading-sm mb-2 text-soft-white group-hover:text-gold-foil transition-colors duration-300">Rewards Program</h3>
              <p className="text-soft-gray group-hover:text-soft-white transition-colors duration-300">Earn points with every purchase and unlock exclusive perks.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Specialty Section */}
      <section className="py-20 bg-charcoal-black overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-t from-gold-foil/5 via-transparent to-transparent opacity-70"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="heading-lg mb-12 text-center text-soft-white">
            <span className="graffiti-text elegant-glow">Specialty</span>
            <div className="w-24 h-1 bg-gradient-to-r from-gold-foil to-gold-foil/30 mx-auto mt-4 rounded-full"></div>
          </h2>
          <div className="infinite-scroll-container">
            <div className="infinite-scroll-track">
              {/* First set of items */}
              <div className="specialty-card scroll-item">
                <div className="relative h-48 mb-4">
                  <Image src="/images/1000009121.png" alt="Boosie Sweet Heat Sauce" fill className="object-cover rounded-lg" />
                </div>
                <h3 className="specialty-title mb-2">Boosie Sweet Heat Sauce</h3>
                <p className="text-soft-gray mb-4">Smooth, saucy, and slightly savage. Our signature sweet heat sauce that brings the perfect balance of flavor and fire.</p>
                <div className="flex justify-between items-center">
                  <span className="text-gold-foil font-bold text-xl">$12</span>
                  <Link href="/menu" className="specialty-btn">
                    View Details
                  </Link>
                </div>
              </div>
              <div className="specialty-card scroll-item">
                <div className="relative h-48 mb-4">
                  <Image src="/images/1000009265.png" alt="Lotus Cheesecake" fill className="object-cover rounded-lg" />
                </div>
                <h3 className="specialty-title mb-2">Lotus Cheesecake</h3>
                <p className="text-soft-gray mb-4">Decadent golden brown cheesecake infused with Lotus cookie crumbles, crafted with premium ingredients.</p>
                <div className="flex justify-between items-center">
                  <span className="text-gold-foil font-bold text-xl">$12</span>
                  <Link href="/menu" className="specialty-btn">
                    View Details
                  </Link>
                </div>
              </div>
              <div className="specialty-card scroll-item">
                <div className="relative h-48 mb-4">
                  <Image src="/images/1000008496.webp" alt="Chocolate Cupcake" fill className="object-cover rounded-lg" />
                </div>
                <h3 className="specialty-title mb-2">Chocolate Cupcake</h3>
                <p className="text-soft-gray mb-4">Rich chocolate cupcake with dark chocolate drizzle, made with premium cocoa and artisanal craftsmanship.</p>
                <div className="flex justify-between items-center">
                  <span className="text-gold-foil font-bold text-xl">$6</span>
                  <Link href="/menu" className="specialty-btn">
                    View Details
                  </Link>
                </div>
              </div>
              <div className="specialty-card scroll-item">
                <div className="relative h-48 mb-4">
                  <Image src="/images/1000008447.webp" alt="Broski's Badazz Seasoning" fill className="object-cover rounded-lg" />
                </div>
                <h3 className="specialty-title mb-2">Broski's Badazz Seasoning</h3>
                <p className="text-soft-gray mb-4">Our signature blend of premium spices and herbs, the secret behind Broski's legendary flavor profile.</p>
                <div className="flex justify-between items-center">
                  <span className="text-gold-foil font-bold text-xl">$15</span>
                  <Link href="/menu" className="specialty-btn">
                    View Details
                  </Link>
                </div>
              </div>
              {/* Duplicate set for seamless loop */}
              <div className="specialty-card scroll-item">
                <div className="relative h-48 mb-4">
                  <Image src="/images/1000009121.png" alt="Boosie Sweet Heat Sauce" fill className="object-cover rounded-lg" />
                </div>
                <h3 className="specialty-title mb-2">Boosie Sweet Heat Sauce</h3>
                <p className="text-soft-gray mb-4">Smooth, saucy, and slightly savage. Our signature sweet heat sauce that brings the perfect balance of flavor and fire.</p>
                <div className="flex justify-between items-center">
                  <span className="text-gold-foil font-bold text-xl">$12</span>
                  <Link href="/menu" className="specialty-btn">
                    View Details
                  </Link>
                </div>
              </div>
              <div className="specialty-card scroll-item">
                <div className="relative h-48 mb-4">
                  <Image src="/images/1000009265.png" alt="Lotus Cheesecake" fill className="object-cover rounded-lg" />
                </div>
                <h3 className="specialty-title mb-2">Lotus Cheesecake</h3>
                <p className="text-soft-gray mb-4">Decadent golden brown cheesecake infused with Lotus cookie crumbles, crafted with premium ingredients.</p>
                <div className="flex justify-between items-center">
                  <span className="text-gold-foil font-bold text-xl">$12</span>
                  <Link href="/menu" className="specialty-btn">
                    View Details
                  </Link>
                </div>
              </div>
              <div className="specialty-card scroll-item">
                <div className="relative h-48 mb-4">
                  <Image src="/images/1000008496.webp" alt="Chocolate Cupcake" fill className="object-cover rounded-lg" />
                </div>
                <h3 className="specialty-title mb-2">Chocolate Cupcake</h3>
                <p className="text-soft-gray mb-4">Rich chocolate cupcake with dark chocolate drizzle, made with premium cocoa and artisanal craftsmanship.</p>
                <div className="flex justify-between items-center">
                  <span className="text-gold-foil font-bold text-xl">$6</span>
                  <Link href="/menu" className="specialty-btn">
                    View Details
                  </Link>
                </div>
              </div>
              <div className="specialty-card scroll-item">
                <div className="relative h-48 mb-4">
                  <Image src="/images/1000008447.webp" alt="Broski's Badazz Seasoning" fill className="object-cover rounded-lg" />
                </div>
                <h3 className="specialty-title mb-2">Broski's Badazz Seasoning</h3>
                <p className="text-soft-gray mb-4">Our signature blend of premium spices and herbs, the secret behind Broski's legendary flavor profile.</p>
                <div className="flex justify-between items-center">
                  <span className="text-gold-foil font-bold text-xl">$15</span>
                  <Link href="/menu" className="specialty-btn">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-deep-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-foil/10 via-transparent to-burgundy/5 opacity-40"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold-foil/5 rounded-full blur-3xl"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="heading-lg mb-6 text-soft-white animate-fade-in">
            Ready to Experience <span className="graffiti-text elegant-glow">Broski&apos;s</span>?
          </h2>
          <p className="text-xl text-soft-gray mb-8 max-w-2xl mx-auto animate-fade-in animate-delay-200">
            Join thousands of satisfied customers who have discovered the perfect blend of luxury and street culture.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in animate-delay-400">
            <Link href="/menu" className="btn-primary btn-pulse transform hover:scale-105 transition-transform duration-300">
              Order Now
            </Link>
            <Link href="/rewards" className="btn-outline transform hover:scale-105 transition-transform duration-300">
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
