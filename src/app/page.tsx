import Image from "next/image"
import Link from "next/link"
import { FaUtensils, FaMapMarkerAlt, FaCalendarAlt, FaGift } from "react-icons/fa"

function Page() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background"></div>
        <div className="container mx-auto px-4 hero-content">
          <h1 className="heading-xl mb-6 text-soft-white animate-fade-in gritty-shadow">Broski&apos;s Kitchen</h1>
          <p className="text-xl md:text-2xl text-soft-gray mb-8 animate-fade-in animate-delay-200">
            Luxury Street Gourmet – Where Flavor Meets Culture
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in animate-delay-400">
            <Link href="/menu" className="btn-primary btn-pulse">
              View Menu
            </Link>
            <Link href="/locations" className="btn-outline">
              Find Location
            </Link>
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

      {/* Featured Menu Section */}
      <section className="py-20 bg-charcoal-black">
        <div className="container mx-auto px-4">
          <h2 className="heading-lg mb-12 text-center text-soft-white">
            Featured <span className="graffiti-text">Menu</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="menu-card animate-fade-in">
              <div className="relative h-48 mb-4">
                <Image src="/images/signature-burger.jpg" alt="Signature Burger" fill className="object-cover rounded-lg" />
              </div>
              <h3 className="heading-sm mb-2 text-soft-white">Signature Broski Burger</h3>
              <p className="text-soft-gray mb-4">Our premium beef patty with special sauce, aged cheddar, and crispy onions.</p>
              <div className="flex justify-between items-center">
                <span className="text-gold-foil font-bold text-xl">$18</span>
                <Link href="/menu" className="btn-outline text-sm">
                  View Details
                </Link>
              </div>
            </div>
            <div className="menu-card animate-fade-in animate-delay-100">
              <div className="relative h-48 mb-4">
                <Image src="/images/truffle-fries.jpg" alt="Truffle Fries" fill className="object-cover rounded-lg" />
              </div>
              <h3 className="heading-sm mb-2 text-soft-white">Truffle Parmesan Fries</h3>
              <p className="text-soft-gray mb-4">Hand-cut fries with truffle oil, parmesan, and fresh herbs.</p>
              <div className="flex justify-between items-center">
                <span className="text-gold-foil font-bold text-xl">$12</span>
                <Link href="/menu" className="btn-outline text-sm">
                  View Details
                </Link>
              </div>
            </div>
            <div className="menu-card animate-fade-in animate-delay-200">
              <div className="relative h-48 mb-4">
                <Image src="/images/craft-cocktail.jpg" alt="Craft Cocktail" fill className="object-cover rounded-lg" />
              </div>
              <h3 className="heading-sm mb-2 text-soft-white">Craft Cocktails</h3>
              <p className="text-soft-gray mb-4">Artisanal cocktails with premium spirits and house-made mixers.</p>
              <div className="flex justify-between items-center">
                <span className="text-gold-foil font-bold text-xl">$14</span>
                <Link href="/menu" className="btn-outline text-sm">
                  View Details
                </Link>
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
