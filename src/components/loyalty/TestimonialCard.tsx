"use client"

import type React from "react"

import Image from "next/image"
import { FaStar } from "react-icons/fa"

interface Testimonial {
  name: string
  tier: string
  image: string
  quote: string
  rating: number
}

interface TestimonialCardProps {
  testimonial: Testimonial
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial }) => {
  // Get tier color
  const getTierColor = () => {
    switch (testimonial.tier.toLowerCase()) {
      case "gold":
        return "text-gold-foil"
      case "silver":
        return "text-gray-400"
      default:
        return "text-[#CD7F32]"
    }
  }

  return (
    <div className="bg-[#1A1A1A] rounded-lg p-6 border border-[#333333]">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
          <Image
            src={testimonial.image || "/placeholder.svg"}
            alt={testimonial.name}
            width={48}
            height={48}
            className="object-cover"
          />
        </div>
        <div>
          <h4 className="font-bold">{testimonial.name}</h4>
          <div className="flex items-center">
            <span className={`text-sm ${getTierColor()}`}>{testimonial.tier} Member</span>
          </div>
        </div>
      </div>
      <div className="mb-4">
        <div className="flex mb-2">
          {[...Array(5)].map((_, i) => (
            <FaStar key={i} className={i < testimonial.rating ? "text-gold-foil" : "text-gray-600"} size={16} />
          ))}
        </div>
        <p className="text-gray-300 italic">"{testimonial.quote}"</p>
      </div>
    </div>
  )
}

export default TestimonialCard
