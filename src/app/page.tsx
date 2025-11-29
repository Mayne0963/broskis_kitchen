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
      {/* Hero Section - Combined */}
      <section className="hero hero-combined">
        {/* OTW Delivery Button - Top Right Corner (preserved) */}
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
        <div className="hero-overlay"></div>
        <div className="hero-content-stack">
          <div className="hero-inner">
            <div className="hero-crest">
              <img
                src="/images/broskis-gold-logo.png"
                alt="Broski's Kitchen crest"
                className="hero-crest-img"
              />
            </div>

            <p className="hero-kicker">THE PEOPLE'S RESTAURANT</p>

            <h1 className="hero-title">WELCOME TO BROSKI'S KITCHEN</h1>

            <p className="hero-brandline">
              Luxury Street Gourmet – where culinary culture meets legacy flavor.
              From our Boosie Wings to Infused Broski Dust Fries, every plate is
              served with soul and sauce.
            </p>

            <p className="hero-subtitle">HOME OF THE AWARD-WINNING BROSKI WINGS</p>

            <p className="hero-tagline">CAUSE IT'S BADAZZ</p>

            <div className="hero-cta-row">
              <a href="/menu" className="btn-primary">Order Now</a>
              <a href="/menu" className="btn-outline">Explore Our Menu</a>
              <a href="/lunch-drop" className="btn-primary">Lunch Drop</a>
            </div>
          </div>

          <div className="lunchdrop-movement hero-lunchdrop-embedded">
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

              <p className="lunchdrop-how">
                <span className="lunchdrop-highlight">Broski&apos;s Lunch Drop™</span> — first
                workplace on your shift to hit <b>22 plates</b> wins tomorrow&apos;s Broski lunch
                delivered by OTW. 1st, 2nd, and 3rd shift. Day-before pre-orders only. Free OTW
                delivery.
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
                <a href="/lunch-order" className="btn-primary">🔥 Place Lunch Order</a>
                <a href="/order-race" className="btn-outline">🏁 View Order Race</a>
                <a href="/enter-workplace" className="btn-outline">🏆 Enter Your Workplace</a>
              </div>

              <p className="lunchdrop-learn-link">
                🍽 <a href="/lunch-drop">Learn About Lunch Drop</a>
              </p>

              <div className="lunchdrop-tagline-row">
                <p className="lunchdrop-tagline">This ain&apos;t takeout — this a takeover.</p>
                <p className="lunchdrop-tagline">Earn it today. Eat it tomorrow.</p>
              </div>
            </div>
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
