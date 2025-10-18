"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaChevronDown, FaChevronUp } from "react-icons/fa"
import RadioPlayer from "../common/RadioPlayer"

const Footer = () => {
  const [currentYear, setCurrentYear] = useState<number | null>(null)
  const [isRewardsPolicyOpen, setIsRewardsPolicyOpen] = useState(false)

  useEffect(() => {
    setCurrentYear(new Date().getFullYear())
  }, [])
  return (
    <footer className="bg-black text-white py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-primary mb-4">Broski&apos;s Kitchen</h3>
            <p className="text-gray-300 mb-4">Luxury Street Gourmet</p>
            <div className="flex space-x-4 mb-4">
              <a
                href="https://facebook.com"
                className="text-gray-300 hover:text-primary transition-colors duration-300"
              >
                <FaFacebook size={24} />
              </a>
              <a href="https://twitter.com" className="text-gray-300 hover:text-primary transition-colors duration-300">
                <FaTwitter size={24} />
              </a>
              <a
                href="https://instagram.com"
                className="text-gray-300 hover:text-primary transition-colors duration-300"
              >
                <FaInstagram size={24} />
              </a>
              <a href="https://youtube.com" className="text-gray-300 hover:text-primary transition-colors duration-300">
                <FaYoutube size={24} />
              </a>
            </div>
            <RadioPlayer />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/menu" className="text-gray-300 hover:text-primary transition-colors duration-300">
                  Menu
                </Link>
              </li>
              <li>
                <Link href="/locations" className="text-gray-300 hover:text-primary transition-colors duration-300">
                  Locations
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-gray-300 hover:text-primary transition-colors duration-300">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/rewards" className="text-gray-300 hover:text-primary transition-colors duration-300">
                  Rewards
                </Link>
              </li>
              <li>
                <Link href="/shop" className="text-gray-300 hover:text-primary transition-colors duration-300">
                  Shop
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Information</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-300 hover:text-primary transition-colors duration-300">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-primary transition-colors duration-300">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/gift-cards" className="text-gray-300 hover:text-primary transition-colors duration-300">
                  Gift Cards
                </Link>
              </li>
              <li>
                <Link href="/catering" className="text-gray-300 hover:text-primary transition-colors duration-300">
                  Catering
                </Link>
              </li>
              <li>
                <Link href="/volunteer" className="text-gray-300 hover:text-primary transition-colors duration-300">
                  Volunteer
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-primary transition-colors duration-300">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-primary transition-colors duration-300">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/accessibility" className="text-gray-300 hover:text-primary transition-colors duration-300">
                  Accessibility
                </Link>
              </li>
              <li>
                <button
                  onClick={() => setIsRewardsPolicyOpen(!isRewardsPolicyOpen)}
                  className="text-gray-300 hover:text-primary transition-colors duration-300 flex items-center gap-2 text-left"
                >
                  Rewards Policy
                  {isRewardsPolicyOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                </button>
                {isRewardsPolicyOpen && (
                  <div className="mt-4 p-4 bg-black border border-gray-700 rounded-lg text-sm">
                    <div className="space-y-3">
                      <h4 className="text-yellow-400 font-semibold text-base">Broski&apos;s Rewards Policy</h4>
                      
                      <div>
                        <h5 className="text-yellow-400 font-medium mb-1">Earning Points:</h5>
                        <p className="text-white opacity-90">Earn 1 point for every $10 spent on food and drink (before tax, tips, and delivery).</p>
                      </div>
                      
                      <div>
                        <h5 className="text-yellow-400 font-medium mb-1">Spins:</h5>
                        <p className="text-white opacity-90">10 points = Everyday Spin (bonus points only). Seniors and verified volunteers spin at half threshold (5 points).</p>
                      </div>
                      
                      <div>
                        <h5 className="text-yellow-400 font-medium mb-1">Redemption:</h5>
                        <p className="text-white opacity-90">Rewards available starting at 100 points. Valid for select items, discounts, or merchandise.</p>
                      </div>
                      
                      <div>
                        <h5 className="text-yellow-400 font-medium mb-1">Expiration:</h5>
                        <p className="text-white opacity-90">All points expire 30 days after they are earned.</p>
                      </div>
                      
                      <div>
                        <h5 className="text-yellow-400 font-medium mb-1">Limits:</h5>
                        <p className="text-white opacity-90">One reward per order unless otherwise noted. Discounts cannot be stacked. Rewards are not valid on alcohol, gift cards, or delivery fees.</p>
                      </div>
                      
                      <div>
                        <h5 className="text-yellow-400 font-medium mb-1">Community Perks:</h5>
                        <p className="text-white opacity-90">Birthday, Anniversary, and Achievement Spins are one-time bonuses tied to your profile.</p>
                      </div>
                      
                      <div>
                        <h5 className="text-yellow-400 font-medium mb-1">Volunteer Discount:</h5>
                        <p className="text-white opacity-90">Registered volunteers get 10% off orders of $50+.</p>
                      </div>
                      
                      <div>
                        <h5 className="text-yellow-400 font-medium mb-1">Rights Reserved:</h5>
                        <p className="text-white opacity-90">Broski&apos;s may adjust, pause, or end the Rewards Program at any time.</p>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {currentYear || 2024} Broski&apos;s Kitchen. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
