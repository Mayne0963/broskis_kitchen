"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaUtensils, FaMapMarkerAlt, FaCalendarAlt, FaGift } from "react-icons/fa";
// Note: Using direct path in Image src instead of import for Next.js compatibility


function Page() {
  const [showSaucePopup, setShowSaucePopup] = useState(false);

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
    <div className="min-h-screen relative">

      

      
      {/* Hero Section */}
      <section className="hero-section-new">
        {/* Hero Image Container */}
        <div className="hero-image-container">
          <Image src="/images/broskis-kitchen-transparent-gold.png" alt="Broski's Kitchen" fill className="object-contain hero-image" priority />
        </div>
        
        {/* Hero Content Below Image */}
        <div className="hero-content-below">
          <div className="container mx-auto px-4">
            <h1 className="heading-xl mb-6 animate-fade-in text-center">
              Welcome to <span className="graffiti-text elegant-glow">Broski&apos;s Kitchen</span>
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl text-soft-gray mb-10 animate-fade-in animate-delay-200 max-w-3xl mx-auto text-center" style={{lineHeight: '1.4'}}>
              Luxury Street Gourmet – Where Flavor Meets Culture
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6 animate-fade-in animate-delay-400">
              <Link href="/menu" className="btn-primary btn-pulse text-lg transform hover:scale-105 transition-transform duration-300">
                View Menu
              </Link>
              <Link href="/locations" className="btn-outline text-lg transform hover:scale-105 transition-transform duration-300">
                Find Location
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Boosie Wings Feature Section */}
      <section className="py-20 bg-charcoal-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-foil/10 via-transparent to-red-600/5 opacity-60"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-4 text-soft-white">
              <span className="graffiti-text elegant-glow">Boosie Wings</span> Experience
            </h2>
            {/* Drip Animation */}
            <div className="relative inline-block">
              <div className="w-32 h-1 bg-gradient-to-r from-gold-foil to-red-600 mx-auto rounded-full animate-pulse"></div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-8 bg-gradient-to-b from-gold-foil to-red-600 rounded-full animate-drip"></div>
            </div>
            <p className="text-xl text-soft-gray mt-6 max-w-3xl mx-auto">
              Crispy wings smothered in our signature Boosie Sauce - where mild heat meets sweet perfection
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Wings Image */}
            <div className="relative">
              <div className="relative h-80 lg:h-96 rounded-2xl overflow-hidden shadow-2xl">
                <Image 
                  src="/images/new-boosie-wings-sauce.jpg" 
                  alt="Crispy Buffalo Wings with Golden and Red Sauce" 
                  fill 
                  className="object-cover hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
              </div>
              {/* Floating sauce bottles */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-gold-foil/20 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-gold-foil text-2xl">🔥</span>
              </div>
            </div>
            
            {/* Content */}
            <div className="space-y-6">
              <h3 className="text-3xl lg:text-4xl font-bold text-soft-white">
                Why <span className="text-gold-foil">Boosie Sauce</span>?
              </h3>
              <p className="text-lg text-soft-gray leading-relaxed">
                Because it's <span className="text-red-500 font-bold">BADAZZ!</span> Our signature blend combines the perfect balance of sweet and heat, creating an unforgettable flavor experience that keeps you coming back for more.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                <div className="bg-deep-black/50 p-4 rounded-lg border border-gold-foil/20">
                  <h4 className="text-gold-foil font-bold mb-2">Mild Heat</h4>
                  <p className="text-soft-gray text-sm">Smooth with just enough kick</p>
                </div>
                <div className="bg-deep-black/50 p-4 rounded-lg border border-red-600/20">
                  <h4 className="text-red-500 font-bold mb-2">Sweet Heat</h4>
                  <p className="text-soft-gray text-sm">Smooth, saucy, slightly savage</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Link 
                  href="/menu?item=boosie-wings" 
                  className="btn-primary btn-pulse transform hover:scale-105 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,211,0,0.6)] hover:bg-gold-foil hover:text-black"
                >
                  Order Now
                </Link>
                <Link 
                  href="/menu" 
                  className="btn-outline transform hover:scale-105 transition-transform duration-300"
                >
                  View Full Menu
                </Link>
              </div>
            </div>
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
    </div>
  );
}

export default Page;
