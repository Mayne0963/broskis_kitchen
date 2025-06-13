import Link from "next/link"
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube } from "react-icons/fa"

const Footer = () => {
  return (
    <footer className="bg-black text-white py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-primary mb-4">Broski&apos;s Kitchen</h3>
            <p className="text-gray-300 mb-4">Luxury Street Gourmet</p>
            <div className="flex space-x-4">
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
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Broski&apos;s Kitchen. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
