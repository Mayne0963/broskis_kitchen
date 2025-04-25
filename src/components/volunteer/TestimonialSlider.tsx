"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { FaQuoteLeft, FaChevronLeft, FaChevronRight } from "react-icons/fa"

interface Testimonial {
  name: string
  role: string
  image: string
  quote: string
}

interface TestimonialSliderProps {
  testimonials: Testimonial[]
}

const TestimonialSlider: React.FC<TestimonialSliderProps> = ({ testimonials }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // Auto-advance the slider
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        handleNext()
      }
    }, 8000)

    return () => clearInterval(interval)
  }, [currentIndex, isAnimating])

  const handlePrev = () => {
    if (isAnimating) return

    setIsAnimating(true)
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1))

    setTimeout(() => {
      setIsAnimating(false)
    }, 500)
  }

  const handleNext = () => {
    if (isAnimating) return

    setIsAnimating(true)
    setCurrentIndex((prevIndex) => (prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1))

    setTimeout(() => {
      setIsAnimating(false)
    }, 500)
  }

  const handleDotClick = (index: number) => {
    if (isAnimating || index === currentIndex) return

    setIsAnimating(true)
    setCurrentIndex(index)

    setTimeout(() => {
      setIsAnimating(false)
    }, 500)
  }

  return (
    <div className="relative max-w-4xl mx-auto">
      <div className="overflow-hidden rounded-lg bg-[#1A1A1A] border border-[#333333]">
        <div className="relative p-8 md:p-12">
          <FaQuoteLeft className="text-gold-foil text-4xl opacity-20 absolute top-8 left-8" />

          <div className={`transition-opacity duration-500 ${isAnimating ? "opacity-0" : "opacity-100"}`}>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={testimonials[currentIndex].image || "/placeholder.svg"}
                  alt={testimonials[currentIndex].name}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>

              <div>
                <p className="text-lg text-gray-300 italic mb-6">{testimonials[currentIndex].quote}</p>
                <div>
                  <h4 className="font-bold text-lg">{testimonials[currentIndex].name}</h4>
                  <p className="text-gold-foil">{testimonials[currentIndex].role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-6 space-x-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentIndex ? "bg-gold-foil" : "bg-[#333333] hover:bg-[#555555]"
            }`}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>

      <button
        onClick={handlePrev}
        className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-8 w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#333333] flex items-center justify-center text-white hover:bg-[#333333] transition-colors"
        aria-label="Previous testimonial"
      >
        <FaChevronLeft />
      </button>

      <button
        onClick={handleNext}
        className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-8 w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#333333] flex items-center justify-center text-white hover:bg-[#333333] transition-colors"
        aria-label="Next testimonial"
      >
        <FaChevronRight />
      </button>
    </div>
  )
}

export default TestimonialSlider
