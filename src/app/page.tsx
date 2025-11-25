"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaUtensils, FaMapMarkerAlt, FaCalendarAlt, FaGift, FaFire, FaBars, FaTimes, FaUser, FaShoppingBag, FaPlay, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useHeroContent } from "../hooks/useHeroContent";
import dynamic from "next/dynamic";
// Dynamically import MobileEnhancer and TouchButton to avoid SSR issues
const MobileEnhancer = dynamic(() => import("../components/responsive/MobileEnhancer"), { ssr: false });
const TouchButton = dynamic(() => import("../components/responsive/MobileEnhancer").then(m => m.TouchButton), { ssr: false, loading: () => null });
import { ComponentLoader } from "../components/ui/LoadingSpinner";


function Page() {
  const [showSaucePopup, setShowSaucePopup] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Local client-only responsive detection to avoid importing shared hook on SSR
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const update = () => {
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const small = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
      const hasTouch = typeof window !== 'undefined' && ('ontouchstart' in window || (navigator as any)?.maxTouchPoints > 0);
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || (small && hasTouch));
    };
    update();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', update);
      window.addEventListener('orientationchange', update);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', update);
        window.removeEventListener('orientationchange', update);
      }
    };
  }, []);

  return (
    <MobileEnhancer enableSwipeGestures={true} enableTouchOptimizations={true}>
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
              src="/otw-logo.png" 
              alt="OTW Logo" 
              width={36} 
              height={18} 
              className="filter brightness-110"
              priority
              quality={95}
            />
            <span className="text-base font-extrabold tracking-wide">OTW DELIVERY</span>
          </a>
        </div>
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-6 max-w-6xl mx-auto flex flex-col items-center justify-start pt-8 w-full">
          {/* Content after hero */}
          <motion.div 
            className="mb-8 flex justify-center"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <Image
              src="/images/broskis-gold-logo.png"
              alt="Broski's Kitchen Official Gold Logo"
              width={400}
              height={200}
              className="mx-auto drop-shadow-2xl max-w-full h-auto"
              priority
              sizes="(max-width: 768px) 300px, 400px"
              style={{ display: 'block' }}
              quality={90}
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
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-[var(--color-harvest-gold)] uppercase tracking-wide leading-tight" style={{ fontFamily: 'var(--font-playfair), serif', color: '#FFD700' }}>
              HOME OF THE AWARD-WINNING
            </h1>
             
            {/* BOOSIE WINGS - Larger, Gold, Bold Serif, ALL CAPS */}
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-[var(--color-harvest-gold)] uppercase tracking-tight leading-none" style={{ fontFamily: 'var(--font-playfair), serif', color: '#FFD700' }}>
              BOOSIE WINGS
            </h2>
             
            {/* CAUSE IT'S BADAZZ - Red, All Caps, smaller */}
            <motion.p 
              className="text-xl md:text-2xl lg:text-3xl font-bold text-[var(--color-burgundy)] uppercase tracking-wide"
              style={{ color: '#B22222' }}
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
            className="mb-16 flex justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.9, ease: "easeOut" }}
          >
            <Link href="/menu" aria-label="Order Now Button for Boosie Wings">
              <TouchButton 
                size={isMobile ? 'lg' : 'md'}
                variant="primary"
                className="broski-otw-gold-button text-xl"
                hapticFeedback={true}
              >
                Order Now
              </TouchButton>
            </Link>
          </motion.div>

          {/* Wings Centerpiece - Ultra-realistic wings spread across width */}
          <motion.div 
            className="mb-4 w-full overflow-hidden flex justify-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
          >
            <div className="relative w-full max-w-6xl">
              <Image
                src="/images/HomePageHeroImage.png"
                alt="Ultra-realistic Boosie Wings spread across black surface"
                width={2400}
                height={900}
                className="w-full h-auto object-cover shadow-2xl rounded-lg"
                priority
                sizes="100vw"
                style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
                quality={85}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Lunch Drop Movement Section - Added without modifying existing sections */}
      <section className="lunchdrop-movement">
        <div className="lunchdrop-inner">
          <p className="lunchdrop-kicker">THE PEOPLE&apos;S RESTAURANT</p>
          <h2 className="lunchdrop-title">
            Lunch Drop ain&apos;t just delivery.<br />
            It&apos;s a movement.
          </h2>

          <p className="lunchdrop-text">
            Lunch ain&apos;t supposed to feel like punishment. Clock out, rush, swallow
            something quick, and run back like you borrowed time? Nah. We flipped the script.
          </p>

          <p className="lunchdrop-text">
            Welcome to <span className="lunchdrop-highlight">Lunch Drop</span> — the first
            workplace-powered food movement where the people choose the vibe and the winners
            get fed like royalty.
          </p>

          <p className="lunchdrop-text">
            This ain&apos;t delivery. This is <span className="lunchdrop-highlight">community</span>.
          </p>

          <div className="lunchdrop-columns">
            <div className="lunchdrop-card">
              <h3 className="lunchdrop-card-title">Where Workplaces Turn Into Teams</h3>
              <p className="lunchdrop-card-text">
                Each shift becomes a squad. Each squad becomes a tribe. Every plate you order
                pushes your crew closer to locking in tomorrow&apos;s Broski&apos;s Lunch Drop
                with free OTW delivery.
              </p>
              <p className="lunchdrop-card-text">
                Y&apos;all ain&apos;t just ordering food. You&apos;re building momentum.
              </p>
            </div>

            <div className="lunchdrop-card">
              <h3 className="lunchdrop-card-title">The Race Makes It Fun</h3>
              <p className="lunchdrop-card-text">
                First workplace on each shift to hit the magic number of plates wins the Drop.
                No meetings. No memos. No permission. The people decide who eats like champions.
              </p>
              <p className="lunchdrop-card-text">
                1st, 2nd, or 3rd shift — everybody has a lane.
              </p>
            </div>

            <div className="lunchdrop-card">
              <h3 className="lunchdrop-card-title">Why We Do This</h3>
              <p className="lunchdrop-card-text">
                Because people working hard deserve something real. Because lunch shouldn&apos;t
                be stress. Because Fort Wayne deserves a win. Because you deserve flavor with
                purpose.
              </p>
              <p className="lunchdrop-card-text">
                This is food with unity, competition, and pride.
              </p>
            </div>
          </div>

          <div className="lunchdrop-cta-row">
            <a href="/order-race" className="btn-primary">🔥 Join the Race</a>
            <a href="/lunch-drop" className="btn-ghost">🍽️ Learn About Lunch Drop</a>
            <a href="/enter-workplace" className="btn-outline">🏆 Enter Your Workplace</a>
          </div>

          <div className="lunchdrop-tagline-row">
            <p className="lunchdrop-tagline">This ain&apos;t takeout — this a takeover.</p>
            <p className="lunchdrop-tagline">Earn it today. Eat it tomorrow.</p>
          </div>
        </div>
      </section>

      {/* Broski's Lunch Drop Section - Added under hero section */}
      <section className="lunchdrop-section">
        <div className="lunchdrop-inner">
          <h2 className="lunchdrop-title">BROSKI'S LUNCH DROP™</h2>

          <p className="lunchdrop-desc">
            First workplace on your shift to hit <b>22 plates</b> wins tomorrow's Broski lunch delivered by OTW.
          </p>

          <p className="lunchdrop-sub">
            1st · 2nd · 3rd Shift · Day-Before Pre-Orders Only · Free OTW Delivery
          </p>

          <div className="lunchdrop-buttons">
            <a href="/order-race" className="btn-race">VIEW ORDER RACE</a>
            <a href="/enter-workplace" className="btn-signup">ENTER YOUR WORKPLACE</a>
            <a href="/order" className="btn-order">PLACE LUNCH ORDER</a>
          </div>
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
                className="inline-block bg-[#FFD700] hover:bg-[#E6C200] text-black font-bold py-4 px-12 text-xl rounded-lg shadow-2xl transform hover:scale-105 hover:shadow-[0_0_30px_rgba(255,215,0,0.6)] transition-all duration-300 border-2 border-[#FFD700] hover:border-[#E6C200]"
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
                  <Image src="/images/1000009121.png" alt="Boosie Sweet Heat Sauce" fill className="object-cover rounded-lg" quality={85} />
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
                  <Image src="/images/menu-items/BoosieGoldWings.png" alt="Boosie Gold Wings" fill className="object-cover rounded-lg" quality={85} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Boosie Gold Wings</h3>
                <p className="text-[#FFD700] mb-4">Crispy fried wings coated in our signature honey-gold sauce with a sprinkle of sesame seeds.</p>
                <div className="flex justify-between items-center">
                  <span className="text-[#FFD700] font-bold text-xl">$12</span>
                  <Link href="/menu" className="bg-[#FFD700] hover:bg-[#E6C200] text-black font-bold py-2 px-4 rounded transition-colors duration-300">
                    View Details
                  </Link>
                </div>
              </div>
              <div className="specialty-card scroll-item">
                <div className="relative h-48 mb-4">
                  <Image src="/images/menu-items/SexyyRedWings.png" alt="Sexyy Red Wings" fill className="object-cover rounded-lg" quality={85} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Boosie Red Wings</h3>
                <p className="text-[#FFD700] mb-4">Crispy wings drenched in our fiery house-made red hot sauce.</p>
                <div className="flex justify-between items-center">
                  <span className="text-[#FFD700] font-bold text-xl">$12</span>
                  <Link href="/menu" className="bg-[#FFD700] hover:bg-[#E6C200] text-black font-bold py-2 px-4 rounded transition-colors duration-300">
                    View Details
                  </Link>
                </div>
              </div>
              <div className="specialty-card scroll-item">
                <div className="relative h-48 mb-4">
                  <Image src="/images/1000009265.png" alt="Lotus Cheesecake" fill className="object-cover rounded-lg" quality={85} />
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
                  <Image src="/images/1000008496.webp" alt="Chocolate Cupcake" fill className="object-cover rounded-lg" quality={85} />
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
                  <Image src="/images/1000008447.webp" alt="Broski's Badazz Seasoning" fill className="object-cover rounded-lg" quality={85} />
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
                  <Image src="/images/1000009121.png" alt="Boosie Sweet Heat Sauce" fill className="object-cover rounded-lg" quality={85} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Boosie Sweet Heat Sauce</h3>
                <p className="text-gray-300 mb-4">Smooth, saucy, and slightly savage. Our signature sweet heat sauce that brings the perfect balance of flavor and fire.</p>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-harvest-gold)] font-bold text-xl">$12</span>
                  <Link href="/menu" className="bg-[var(--color-harvest-gold)] hover:bg-[var(--color-gold-rich)] text-black font-bold py-2 px-4 rounded transition-colors duration-300">
                    View Details
                  </Link>
                </div>
              </div>
              <div className="specialty-card scroll-item">
                <div className="relative h-48 mb-4">
                  <Image src="/images/menu-items/BoosieGoldWings.png" alt="Boosie Gold Wings" fill className="object-cover rounded-lg" quality={85} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Boosie Gold Wings</h3>
                <p className="text-gray-300 mb-4">Crispy fried wings coated in our signature honey-gold sauce with a sprinkle of sesame seeds.</p>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-harvest-gold)] font-bold text-xl">$12</span>
                  <Link href="/menu" className="bg-[var(--color-harvest-gold)] hover:bg-[var(--color-gold-rich)] text-black font-bold py-2 px-4 rounded transition-colors duration-300">
                    View Details
                  </Link>
                </div>
              </div>
              <div className="specialty-card scroll-item">
                <div className="relative h-48 mb-4">
                  <Image src="/images/menu-items/SexyyRedWings.png" alt="Sexyy Red Wings" fill className="object-cover rounded-lg" quality={85} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Boosie Red Wings</h3>
                <p className="text-gray-300 mb-4">Crispy wings drenched in our fiery house-made red hot sauce.</p>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-harvest-gold)] font-bold text-xl">$12</span>
                  <Link href="/menu" className="bg-[var(--color-harvest-gold)] hover:bg-[var(--color-gold-rich)] text-black font-bold py-2 px-4 rounded transition-colors duration-300">
                    View Details
                  </Link>
                </div>
              </div>
              <div className="specialty-card scroll-item">
                <div className="relative h-48 mb-4">
                  <Image src="/images/1000009265.png" alt="Lotus Cheesecake" fill className="object-cover rounded-lg" quality={85} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Lotus Cheesecake</h3>
                <p className="text-gray-300 mb-4">Decadent golden brown cheesecake infused with Lotus cookie crumbles, crafted with premium ingredients.</p>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-harvest-gold)] font-bold text-xl">$12</span>
                  <Link href="/menu" className="bg-[var(--color-harvest-gold)] hover:bg-[var(--color-gold-rich)] text-black font-bold py-2 px-4 rounded transition-colors duration-300">
                    View Details
                  </Link>
                </div>
              </div>
              <div className="specialty-card scroll-item">
                <div className="relative h-48 mb-4">
                  <Image src="/Images/1000008496.webp" alt="Chocolate Cupcake" fill className="object-cover rounded-lg" quality={85} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Chocolate Cupcake</h3>
                <p className="text-gray-300 mb-4">Rich chocolate cupcake with dark chocolate drizzle, made with premium cocoa and artisanal craftsmanship.</p>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-harvest-gold)] font-bold text-xl">$6</span>
                  <Link href="/menu" className="bg-[var(--color-harvest-gold)] hover:bg-[var(--color-gold-rich)] text-black font-bold py-2 px-4 rounded transition-colors duration-300">
                    View Details
                  </Link>
                </div>
              </div>
              <div className="specialty-card scroll-item">
                <div className="relative h-48 mb-4">
                  <Image src="/images/1000008447.webp" alt="Broski's Badazz Seasoning" fill className="object-cover rounded-lg" quality={85} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Broski's Badazz Seasoning</h3>
                <p className="text-gray-300 mb-4">Our signature blend of premium spices and herbs, the secret behind Broski's legendary flavor profile.</p>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-harvest-gold)] font-bold text-xl">$15</span>
                  <Link href="/menu" className="bg-[var(--color-harvest-gold)] hover:bg-[var(--color-gold-rich)] text-black font-bold py-2 px-4 rounded transition-colors duration-300">
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
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-harvest-gold)]/10 via-transparent to-[var(--color-harvest-gold)]/5 opacity-40"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[var(--color-harvest-gold)]/5 rounded-full blur-3xl"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white animate-fade-in">
            Ready to Experience <span className="text-[var(--color-harvest-gold)]">Broski&apos;s</span>?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto animate-fade-in animate-delay-200">
            Join thousands of satisfied customers who have discovered the perfect blend of luxury and street culture.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in animate-delay-400">
            <Link href="/menu" className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 px-10 rounded-lg transform hover:scale-105 transition-all duration-300">
              Order Now
            </Link>
            <Link href="/rewards" className="border-2 border-[var(--color-harvest-gold)] text-[var(--color-harvest-gold)] hover:bg-[var(--color-harvest-gold)] hover:text-black font-bold py-4 px-10 rounded-lg transform hover:scale-105 transition-all duration-300">
              Join Rewards
            </Link>
          </div>
        </div>
      </section>

      {/* Close the main div */}
    </div>
    </MobileEnhancer>
  );
}

export default Page;
