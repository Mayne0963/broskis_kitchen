import React from 'react'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "About Us - Our Story & Mission",
  description: "Learn about Broski's Kitchen story, from food truck beginnings to luxury street gourmet restaurant. Discover our mission, values, and commitment to quality.",
  keywords: ["about", "story", "mission", "food truck", "luxury street food", "restaurant history", "values", "team"],
  openGraph: {
    title: "About Us - Broski's Kitchen",
    description: "Discover the story behind Broski's Kitchen - from humble food truck beginnings to luxury street gourmet excellence.",
    images: [{
      url: '/images/broskis-gold-logo.png',
      width: 1200,
      height: 630,
      alt: 'About Broski\'s Kitchen'
    }],
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: "About Us - Broski's Kitchen",
    description: "Discover the story behind Broski's Kitchen - from humble food truck beginnings to luxury street gourmet excellence.",
    images: ['/images/broskis-gold-logo.png']
  }
}

const AboutPage = () => {
  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative h-[40vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/HomePageHeroImage.png" 
            alt="Broski's Kitchen Story" 
            fill 
            className="object-cover" 
            priority 
            unoptimized
          />
          <div className="absolute inset-0 bg-black/60"></div>
        </div>
        <div className="container mx-auto px-4 z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white">Our Story</h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            From humble food truck beginnings to luxury street gourmet excellence
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-[#FFD700]">The Beginning</h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                Broski&apos;s Kitchen was born from a simple vision: to elevate street food to luxury dining standards. 
                What started as a single food truck in Los Angeles has grown into a culinary movement that celebrates 
                the intersection of street culture and gourmet cuisine.
              </p>
              <p className="text-gray-300 mb-4 leading-relaxed">
                Our founder&apos;s passion for authentic flavors and premium ingredients led to the creation of our 
                signature Boosie Wings and other innovative dishes that have earned critical acclaim and a devoted following.
              </p>
            </div>
            <div className="relative h-[400px] rounded-lg overflow-hidden">
              <Image 
                src="/images/broskis-gold-logo.png" 
                alt="Broski's Kitchen Logo" 
                fill 
                className="object-contain" 
                unoptimized
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="order-2 lg:order-1 relative h-[400px] rounded-lg overflow-hidden">
              <Image 
                src="/images/HomePageHeroImage.png" 
                alt="Broski's Kitchen Food" 
                fill 
                className="object-cover rounded-lg" 
                unoptimized
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold mb-6 text-[#FFD700]">Our Mission</h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                We believe that exceptional food should be accessible to everyone. Our mission is to create 
                unforgettable dining experiences that bring people together through the universal language of flavor.
              </p>
              <p className="text-gray-300 mb-4 leading-relaxed">
                Every dish we serve is crafted with premium ingredients, innovative techniques, and a deep respect 
                for the culinary traditions that inspire us. We&apos;re not just serving food – we&apos;re creating memories.
              </p>
            </div>
          </div>

          {/* Values Section */}
          <div className="bg-black rounded-lg p-8 border border-[#FFD700]">
            <h2 className="text-3xl font-bold mb-8 text-center text-[#FFD700]">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-4 text-white">Quality</h3>
                <p className="text-gray-300">
                  We source only the finest ingredients and maintain the highest standards in every aspect of our operation.
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-4 text-white">Innovation</h3>
                <p className="text-gray-300">
                  We constantly push culinary boundaries, creating unique flavor combinations that surprise and delight.
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-4 text-white">Community</h3>
                <p className="text-gray-300">
                  We&apos;re committed to giving back to the communities we serve and supporting local suppliers and partners.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage