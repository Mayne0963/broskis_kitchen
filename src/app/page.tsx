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
      <section className="py-20 bg-charcoal-black">
        <div className="container mx-auto px-4">
          <h2 className="heading-lg mb-12 text-center text-soft-white">
            <span className="graffiti-text">Specialty</span>
          </h2>
          <div className="specialty-carousel-container relative">
            <button className="carousel-nav carousel-nav-prev" onClick={() => {
              const container = document.querySelector('.specialty-carousel');
              container.scrollBy({ left: -320, behavior: 'smooth' });
            }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="specialty-carousel">
              <div className="specialty-card carousel-item animate-slide-in-left">
                <div className="relative h-48 mb-4">
                  <Image src="/images/boosie-sweet-heat-sauce.jpg" alt="Boosie Sweet Heat Sauce" fill className="object-cover rounded-lg" />
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
              <div className="specialty-card carousel-item animate-slide-in-left animate-delay-100">
                <div className="relative h-48 mb-4">
                  <Image src="/images/lotus-cheesecake.jpg" alt="Lotus Cheesecake" fill className="object-cover rounded-lg" />
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
              <div className="specialty-card carousel-item animate-slide-in-left animate-delay-200">
                <div className="relative h-48 mb-4">
                  <Image src="/images/chocolate-cupcake.jpg" alt="Chocolate Cupcake" fill className="object-cover rounded-lg" />
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
              <div className="specialty-card carousel-item animate-slide-in-left animate-delay-300">
                <div className="relative h-48 mb-4">
                  <Image src="/images/badazz-seasoning.jpg" alt="Broski's Badazz Seasoning" fill className="object-cover rounded-lg" />
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
              <div className="specialty-card carousel-item animate-slide-in-left animate-delay-400">
                <div className="relative h-48 mb-4">
                  <Image src="/images/truffle-fries.jpg" alt="Truffle Fries" fill className="object-cover rounded-lg" />
                </div>
                <h3 className="specialty-title mb-2">Truffle Fries</h3>
                <p className="text-soft-gray mb-4">Crispy golden fries elevated with premium truffle oil and parmesan, a luxurious twist on a classic favorite.</p>
                <div className="flex justify-between items-center">
                  <span className="text-gold-foil font-bold text-xl">$14</span>
                  <Link href="/menu" className="specialty-btn">
                    View Details
                  </Link>
                </div>
              </div>
              <div className="specialty-card carousel-item animate-slide-in-left animate-delay-500">
                <div className="relative h-48 mb-4">
                  <Image src="/images/wagyu-sandwich.jpg" alt="Wagyu Sandwich" fill className="object-cover rounded-lg" />
                </div>
                <h3 className="specialty-title mb-2">Wagyu Sandwich</h3>
                <p className="text-soft-gray mb-4">Premium Wagyu beef sandwich with artisanal bread and gourmet toppings, the ultimate luxury dining experience.</p>
                <div className="flex justify-between items-center">
                  <span className="text-gold-foil font-bold text-xl">$28</span>
                  <Link href="/menu" className="specialty-btn">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
            <button className="carousel-nav carousel-nav-next" onClick={() => {
              const container = document.querySelector('.specialty-carousel');
              container.scrollBy({ left: 320, behavior: 'smooth' });
            }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
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
