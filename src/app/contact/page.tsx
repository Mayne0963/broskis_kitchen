"use client"
import { useState } from "react"
import type { Metadata } from "next"

// Note: Metadata export for client components is handled by layout.tsx
// This page uses the template from root layout: "%s | Broski's Kitchen"
import Link from "next/link"
import {
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa"
import ContactForm from "../../components/contact/ContactForm"
import ContactMap from "../../components/contact/ContactMap"
import Image from "next/image"
import { locationData } from "../../data/location-data"

export default function ContactPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const heroSection = (
    <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden">
      <Image
        src="/images/contact-hero.svg"
        alt="Contact Broski's Kitchen"
        fill
        style={{ objectFit: "cover" }}
        priority
        className="brightness-75"
            unoptimized
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">Contact Us</h1>
        <p className="text-xl md:text-2xl">We'd Love to Hear from You</p>
      </div>
    </div>
  )

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  const faqs = [
    {
      question: "What are your hours of operation?",
      answer:
        "Our hours vary by location. Most locations are open from 11 AM to 10 PM Monday through Thursday, 11 AM to 12 AM Friday and Saturday, and 10 AM to 9 PM on Sunday. Please check our Locations page for specific hours.",
    },
    {
      question: "Do you offer catering services?",
      answer:
        "Yes, we offer catering for events of all sizes. Please fill out our contact form or call our catering line directly at (555) 123-4567 to discuss your needs.",
    },
    {
      question: "Do you take reservations?",
      answer:
        "We do not take reservations. We operate on a first-come, first-served basis at all our locations. For large groups or special events, please contact us about our catering and event services.",
    },
    {
      question: "How does your delivery service work?",
      answer:
        "We offer delivery through our website and mobile app. You can also find us on major delivery platforms. Our delivery radius is typically within 5 miles of each location, and delivery times average 30-45 minutes depending on distance and order volume.",
    },
    {
      question: "Can you host private events?",
      answer:
        "Yes, we offer private event services at select locations. We can accommodate various group sizes and customize menus for your specific event. Please contact our events team through the form on this page for more information.",
    },
    {
      question: "Do you accommodate dietary restrictions?",
      answer:
        "Yes, we offer vegetarian, vegan, gluten-free, and dairy-free options. Please inform your server about any allergies or dietary restrictions when ordering.",
    },
    {
      question: "How can I apply for a job at Broski's Kitchen?",
      answer:
        "You can apply for job openings through the Careers section of our website or by visiting any of our locations and asking for an application form.",
    },
  ]

  return (
    <div className="min-h-screen pb-20">
      {heroSection}
      {/* Contact Information & Form Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
              <ContactForm />
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>

              <div className="bg-black rounded-lg p-6 border border-[#FFD700] mb-8">
                <div className="space-y-6">
                  {/* Headquarters */}
                  <div className="flex items-start">
                    <div className="bg-gold-foil bg-opacity-20 p-3 rounded-full mr-4 flex-shrink-0">
                      <FaMapMarkerAlt className="text-gold-foil" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">Headquarters</h3>
                      <address className="not-italic text-[#FFD700]">
                        420 S Grand Ave
                        <br />
                        Los Angeles, CA 90071
                      </address>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start">
                    <div className="bg-gold-foil bg-opacity-20 p-3 rounded-full mr-4 flex-shrink-0">
                      <FaPhone className="text-gold-foil" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">Phone</h3>
                      <p className="text-[#FFD700]">Main: (213) 555-1234</p>
                      <p className="text-[#FFD700]">Catering: (213) 555-5678</p>
                      <p className="text-[#FFD700]">Delivery: (213) 555-9012</p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start">
                    <div className="bg-gold-foil bg-opacity-20 p-3 rounded-full mr-4 flex-shrink-0">
                      <FaEnvelope className="text-gold-foil" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">Email</h3>
                      <p className="text-[#FFD700]">info@broskiskitchen.com</p>
                      <p className="text-[#FFD700]">catering@broskiskitchen.com</p>
                      <p className="text-[#FFD700]">events@broskiskitchen.com</p>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex items-start">
                    <div className="bg-gold-foil bg-opacity-20 p-3 rounded-full mr-4 flex-shrink-0">
                      <FaClock className="text-gold-foil" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">Office Hours</h3>
                      <p className="text-[#FFD700]">Monday - Friday: 9 AM - 5 PM</p>
                      <p className="text-[#FFD700]">Saturday - Sunday: Closed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <h3 className="text-xl font-bold mb-4">Connect With Us</h3>
              <div className="flex space-x-4 mb-8">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-black p-3 rounded-full hover:bg-[#FFD700] hover:text-black transition-colors border border-[#FFD700]"
                  aria-label="Facebook"
                >
                  <FaFacebook size={24} />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-black p-3 rounded-full hover:bg-gold-foil hover:text-black transition-colors border border-[#FFD700]"
                  aria-label="Twitter"
                >
                  <FaTwitter size={24} />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1A1A1A] p-3 rounded-full hover:bg-gold-foil hover:text-black transition-colors"
                  aria-label="Instagram"
                >
                  <FaInstagram size={24} />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1A1A1A] p-3 rounded-full hover:bg-gold-foil hover:text-black transition-colors"
                  aria-label="YouTube"
                >
                  <FaYoutube size={24} />
                </a>
              </div>

              {/* Newsletter Signup */}
              <div className="bg-black rounded-lg p-6 border border-[#FFD700]">
                <h3 className="text-xl font-bold mb-2">Stay Updated</h3>
                <p className="text-[#FFD700] mb-4">Subscribe to our newsletter for the latest updates and offers.</p>
                <form className="flex flex-col sm:flex-row gap-2">
                  <input type="email" placeholder="Your email address" className="input flex-grow" required />
                  <button type="submit" className="btn-primary whitespace-nowrap">
                    Subscribe
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <div key={index} className="mb-4 bg-black rounded-lg border border-[#FFD700] overflow-hidden">
                <button
                  className="w-full p-4 text-left flex justify-between items-center focus:outline-none"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={expandedFaq === index}
                >
                  <span className="font-bold">{faq.question}</span>
                  {expandedFaq === index ? (
                    <FaChevronUp className="text-gold-foil" />
                  ) : (
                    <FaChevronDown className="text-gold-foil" />
                  )}
                </button>
                <div
                  className={`px-4 pb-4 transition-all duration-300 ${
                    expandedFaq === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
                  }`}
                >
                  <p className="text-[#FFD700]">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-black relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/20 to-[#880808]/20 opacity-50"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="heading-lg mb-4 gritty-shadow">Ready to Experience Broski's?</h2>
          <p className="text-[#FFD700] mb-8 max-w-2xl mx-auto">
            Visit one of our locations or order online to experience our luxury street gourmet cuisine.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/locations" className="btn-outline">
              Find a Location
            </Link>
            <Link href="/order" className="btn-primary">
              Order Delivery
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
