"use client"

import type React from "react"

import { useState } from "react"
import { FaPaperPlane, FaCheck } from "react-icons/fa"

const Newsletter: React.FC = () => {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Success
      setIsSubmitted(true)
      setEmail("")
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="text-2xl font-bold mb-4">Stay Updated on New Merch Drops</h2>
      <p className="text-gray-300 mb-6">
        Subscribe to our newsletter to be the first to know about new merchandise releases, exclusive drops, and special
        offers.
      </p>

      {isSubmitted ? (
        <div className="bg-emerald-green bg-opacity-20 text-emerald-green p-6 rounded-lg animate-fade-in">
          <div className="w-12 h-12 bg-emerald-green bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
            <FaCheck className="text-emerald-green text-xl" />
          </div>
          <h3 className="text-lg font-bold mb-2">Thank You for Subscribing!</h3>
          <p>You're now on the list to receive our latest merch updates and exclusive offers.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <div className="flex-grow relative">
            <input
              type="email"
              placeholder="Your email address"
              className={`input w-full ${error ? "border-blood-red" : ""}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
            {error && <p className="absolute text-xs text-blood-red mt-1">{error}</p>}
          </div>
          <button
            type="submit"
            className="btn-primary whitespace-nowrap flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-black"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Subscribing...
              </span>
            ) : (
              <>
                <FaPaperPlane /> Subscribe
              </>
            )}
          </button>
        </form>
      )}
    </div>
  )
}

export default Newsletter
