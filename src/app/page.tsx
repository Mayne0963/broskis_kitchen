import Image from "next/image"
import Link from "next/link"
import { FaUtensils, FaMapMarkerAlt, FaCalendarAlt, FaGift } from "react-icons/fa"

function Page() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="absolute inset-0 z-0">
          <Image src="/images/hero-bg.jpg" alt="Broski's Kitchen" fill className="object-cover hero-image" priority />
        </div>
        <div className="hero-background"></div>
        <div className="container mx-auto px-4 z-10 hero-content">
          <h1 className="heading-xl mb-6 text-white animate-fade-in gritty-shadow">Broski&apos;s Kitchen</h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8 animate-fade-in animate-delay-200">
            Luxury Street Gourmet – Where Flavor Meets Culture
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in animate-delay-400">
            <Link href="/menu" className="btn-primary">
              View Menu
            </Link>
            <Link href="/locations" className="btn-outline">
              Find Location
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#111111]">
        <div className="container mx-auto px-4">
          <h2 className="heading-lg mb-12 text-center">
            Experience <span className="graffiti-text">Broski&apos;s</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="feature-card animate-fade-in">
              <div className="bg-gold-foil bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUtensils className="text-gold-foil text-2xl" />
              </div>
              <h3 className="heading-sm mb-2 text-white">Gourmet Menu</h3>
              <p className="text-gray-400">Explore our luxury street food with both regular and infused options.</p>
            </div>
            <div className="feature-card animate-fade-in animate-delay-100">
              <div className="bg-gold-foil bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaMapMarkerAlt className="text-gold-foil text-2xl" />
              </div>
              <h3 className="heading-sm mb-2 text-white">Multiple Locations</h3>
              <p className="text-gray-400">Visit us at our convenient locations throughout the city.</p>
            </div>
            <div className="feature-card animate-fade-in animate-delay-200">
              <div className="bg-gold-foil bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCalendarAlt className="text-gold-foil text-2xl" />
              </div>
              <h3 className="heading-sm mb-2 text-white">Special Events</h3>
              <p className="text-gray-400">Join our exclusive tasting events and culinary experiences.</p>
            </div>
            <div className="feature-card animate-fade-in animate-delay-300">
              <div className="bg-gold-foil bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaGift className="text-gold-foil text-2xl" />
              </div>
              <h3 className="heading-sm mb-2 text-white">Rewards Program</h3>
              <p className="text-gray-400">Earn points with every purchase and unlock exclusive perks.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Menu Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="heading-lg mb-4 text-center">Featured Menu</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Discover our chef&apos;s selection of luxury street gourmet dishes, crafted with premium ingredients and
            innovative techniques.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="menu-card animate-fade-in animate-delay-0">
              <div className="relative h-48 w-full">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
                <Image src="/images/menu-1.jpg" alt="Luxury Burger" fill className="object-cover" />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white">Luxury Burger</h3>
                  <span className="text-gold-foil font-bold">$18.99</span>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  Premium beef patty with truffle aioli, aged cheddar, and caramelized onions on a brioche bun.
                </p>
                <Link href="/menu" className="btn-primary inline-block text-sm">
                  View Details
                </Link>
              </div>
            </div>
            <div className="menu-card animate-fade-in animate-delay-100">
              <div className="relative h-48 w-full">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
                <Image src="/images/menu-2.jpg" alt="Infused Wings" fill className="object-cover" />
                <div className="absolute top-2 right-2 badge badge-new z-20">INFUSED</div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white">Infused Wings</h3>
                  <span className="text-gold-foil font-bold">$16.99</span>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  Crispy chicken wings tossed in our signature sauce with a special infusion.
                </p>
                <Link href="/menu" className="btn-primary inline-block text-sm">
                  View Details
                </Link>
              </div>
            </div>
            <div className="menu-card animate-fade-in animate-delay-200">
              <div className="relative h-48 w-full">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
                <Image src="/images/menu-3.jpg" alt="Gourmet Street Tacos" fill className="object-cover" />
                <div className="absolute top-2 right-2 badge badge-popular z-20">POPULAR</div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white">Gourmet Street Tacos</h3>
                  <span className="text-gold-foil font-bold">$14.99</span>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  Three street-style tacos with premium fillings and house-made salsas.
                </p>
                <Link href="/menu" className="btn-primary inline-block text-sm">
                  View Details
                </Link>
              </div>
            </div>
          </div>
          <div className="text-center mt-12">
            <Link href="/menu" className="btn-outline inline-block">
              View Full Menu
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/20 to-[#880808]/20 opacity-50"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="heading-lg mb-4 gritty-shadow">Ready to Experience Broski&apos;s?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join our community of food enthusiasts and experience the perfect blend of luxury and street food culture.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/order" className="btn-primary">
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
