'use client'

import Image from "next/image"
import Link from "next/link"
import { FaUtensils, FaMapMarkerAlt, FaCalendarAlt, FaGift } from "react-icons/fa"

function Page() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-section-new">
        {/* Hero Image Container */}
        <div className="hero-image-container">
          <Image src="/images/Broski’s Kitchen-Transparent-Gold.png" alt="Broski's Kitchen" fill className="object-contain hero-image" priority />
        </div>
        
        {/* Hero Content Below Image */}
        <div className="hero-content-below">
          <div className="container mx-auto px-4">
            <p className="text-xl md:text-2xl lg:text-3xl text-soft-gray mb-10 animate-fade-in animate-delay-200 max-w-3xl mx-auto" style={{lineHeight: '1.4'}}>
              Luxury Street Gourmet – Where Flavor Meets Culture
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6 animate-fade-in animate-delay-400">
              <Link href="/menu" className="btn-primary btn-pulse text-lg">
                View Menu
              </Link>
              <Link href="/locations" className="btn-outline text-lg">
                Find Location
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-deep-black">
        <div className="container mx-auto px-4">
          <h2 className="heading-lg mb-12 text-center">
            Experience <span className="graffiti-text">Broski&apos;s</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="feature-card animate-fade-in">
              <div className="bg-gold-foil bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUtensils className="text-gold-foil text-2xl" />
              </div>
              <h3 className="heading-sm mb-2 text-soft-white">Gourmet Menu</h3>
              <p className="text-soft-gray">Explore our luxury street food with both regular and infused options.</p>
            </div>
            <div className="feature-card animate-fade-in animate-delay-100">
              <div className="bg-gold-foil bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaMapMarkerAlt className="text-gold-foil text-2xl" />
              </div>
              <h3 className="heading-sm mb-2 text-soft-white">Multiple Locations</h3>
              <p className="text-soft-gray">Visit us at our convenient locations throughout the city.</p>
            </div>
            <div className="feature-card animate-fade-in animate-delay-200">
              <div className="bg-gold-foil bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCalendarAlt className="text-gold-foil text-2xl" />
              </div>
              <h3 className="heading-sm mb-2 text-soft-white">Special Events</h3>
              <p className="text-soft-gray">Join our exclusive tasting events and culinary experiences.</p>
            </div>
            <div className="feature-card animate-fade-in animate-delay-300">
              <div className="bg-gold-foil bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaGift className="text-gold-foil text-2xl" />
              </div>
              <h3 className="heading-sm mb-2 text-soft-white">Rewards Program</h3>
              <p className="text-soft-gray">Earn points with every purchase and unlock exclusive perks.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Specialty Section */}
      <section className="py-20 bg-charcoal-black overflow-hidden">
        <div className="container mx-auto px-4">
          <h2 className="heading-lg mb-12 text-center text-soft-white">
            <span className="graffiti-text">Specialty</span>
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
      <section className="py-20 bg-deep-black">
        <div className="container mx-auto px-4 text-center">
          <h2 className="heading-lg mb-6 text-soft-white">
            Ready to Experience <span className="graffiti-text">Broski&apos;s</span>?
          </h2>
          <p className="text-xl text-soft-gray mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who have discovered the perfect blend of luxury and street culture.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/menu" className="btn-primary">
              Order Now
            </Link>
            <Link href="/rewards" className="btn-outline">
              Join Rewards
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Page
