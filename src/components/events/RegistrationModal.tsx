"use client"

import React, { useState } from "react"
import { FaTimes, FaCalendarAlt, FaMapMarkerAlt, FaClock, FaTicketAlt, FaCheck } from "react-icons/fa"
import type { Event } from "@/types/event"

interface RegistrationModalProps {
  event: Event
  onClose: () => void
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({ event, onClose }) => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    tickets: 1,
    specialRequests: "",
    dietaryRestrictions: "",
    agreeToTerms: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate total price
  const totalPrice = formData.tickets * event.price

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })

    // Clear error when field is updated
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      })
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required"
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    }

    if (formData.tickets < 1) {
      newErrors.tickets = "At least 1 ticket is required"
    } else if (formData.tickets > event.capacity - event.registered) {
      newErrors.tickets = `Only ${event.capacity - event.registered} tickets available`
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle next step
  const handleNextStep = () => {
    if (validateForm()) {
      setStep(2)
    }
  }

  // Handle previous step
  const handlePrevStep = () => {
    setStep(1)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      setIsSubmitting(true)

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // Show success step
        setStep(3)
      } catch (error) {
        console.error("Registration error:", error)
        setErrors({
          ...errors,
          form: "An error occurred during registration. Please try again.",
        })
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-[#1A1A1A] rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fade-in">
        <div className="relative p-6 border-b border-[#333333]">
          <h2 className="text-xl font-bold pr-8">
            {step === 3 ? "Registration Complete" : `Register for ${event.title}`}
          </h2>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-10rem)]">
          {step === 1 && (
            <>
              <div className="mb-6 p-4 bg-[#111111] rounded-lg">
                <div className="flex items-center text-gray-300 mb-2">
                  <FaCalendarAlt className="mr-2 text-gold-foil flex-shrink-0" />
                  <span>{formatDate(event.date)}</span>
                </div>

                <div className="flex items-center text-gray-300 mb-2">
                  <FaClock className="mr-2 text-gold-foil flex-shrink-0" />
                  <span>{event.time}</span>
                </div>

                <div className="flex items-center text-gray-300 mb-2">
                  <FaMapMarkerAlt className="mr-2 text-gold-foil flex-shrink-0" />
                  <span>{event.location.name}</span>
                </div>

                <div className="flex items-center text-gray-300">
                  <FaTicketAlt className="mr-2 text-gold-foil flex-shrink-0" />
                  <span>${event.price.toFixed(2)} per person</span>
                </div>
              </div>

              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`input w-full ${errors.firstName ? "border-blood-red" : ""}`}
                      required
                    />
                    {errors.firstName && <p className="mt-1 text-sm text-blood-red">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`input w-full ${errors.lastName ? "border-blood-red" : ""}`}
                      required
                    />
                    {errors.lastName && <p className="mt-1 text-sm text-blood-red">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`input w-full ${errors.email ? "border-blood-red" : ""}`}
                    required
                  />
                  {errors.email && <p className="mt-1 text-sm text-blood-red">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`input w-full ${errors.phone ? "border-blood-red" : ""}`}
                    required
                  />
                  {errors.phone && <p className="mt-1 text-sm text-blood-red">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="tickets" className="block text-sm font-medium mb-1">
                    Number of Tickets *
                  </label>
                  <select
                    id="tickets"
                    name="tickets"
                    value={formData.tickets}
                    onChange={handleChange}
                    className={`input w-full ${errors.tickets ? "border-blood-red" : ""}`}
                    required
                  >
                    {[...Array(Math.min(10, event.capacity - event.registered))].map((_, i) => (
                      <option key={i} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                  {errors.tickets && <p className="mt-1 text-sm text-blood-red">{errors.tickets}</p>}
                </div>

                <div>
                  <label htmlFor="dietaryRestrictions" className="block text-sm font-medium mb-1">
                    Dietary Restrictions
                  </label>
                  <textarea
                    id="dietaryRestrictions"
                    name="dietaryRestrictions"
                    value={formData.dietaryRestrictions}
                    onChange={handleChange}
                    className="input w-full h-20"
                    placeholder="Please list any dietary restrictions or allergies"
                  />
                </div>

                <div>
                  <label htmlFor="specialRequests" className="block text-sm font-medium mb-1">
                    Special Requests
                  </label>
                  <textarea
                    id="specialRequests"
                    name="specialRequests"
                    value={formData.specialRequests}
                    onChange={handleChange}
                    className="input w-full h-20"
                    placeholder="Any special requests or accommodations needed?"
                  />
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="agreeToTerms"
                      name="agreeToTerms"
                      type="checkbox"
                      checked={formData.agreeToTerms}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-[#333333] text-gold-foil focus:ring-gold-foil"
                      required
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="agreeToTerms" className="text-gray-300">
                      I agree to the{" "}
                      <a href="/terms" className="text-gold-foil hover:underline">
                        Terms and Conditions
                      </a>{" "}
                      and{" "}
                      <a href="/privacy" className="text-gold-foil hover:underline">
                        Privacy Policy
                      </a>
                    </label>
                    {errors.agreeToTerms && <p className="mt-1 text-sm text-blood-red">{errors.agreeToTerms}</p>}
                  </div>
                </div>
              </form>
            </>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Review Your Registration</h3>

              <div className="p-4 bg-[#111111] rounded-lg">
                <h4 className="font-medium mb-2">Event Details</h4>
                <div className="space-y-2 text-gray-300">
                  <p>
                    <span className="text-gray-400">Event:</span> {event.title}
                  </p>
                  <p>
                    <span className="text-gray-400">Date:</span> {formatDate(event.date)}
                  </p>
                  <p>
                    <span className="text-gray-400">Time:</span> {event.time}
                  </p>
                  <p>
                    <span className="text-gray-400">Location:</span> {event.location.name}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-[#111111] rounded-lg">
                <h4 className="font-medium mb-2">Attendee Information</h4>
                <div className="space-y-2 text-gray-300">
                  <p>
                    <span className="text-gray-400">Name:</span> {formData.firstName} {formData.lastName}
                  </p>
                  <p>
                    <span className="text-gray-400">Email:</span> {formData.email}
                  </p>
                  <p>
                    <span className="text-gray-400">Phone:</span> {formData.phone}
                  </p>
                  <p>
                    <span className="text-gray-400">Tickets:</span> {formData.tickets}
                  </p>
                  {formData.dietaryRestrictions && (
                    <p>
                      <span className="text-gray-400">Dietary Restrictions:</span> {formData.dietaryRestrictions}
                    </p>
                  )}
                  {formData.specialRequests && (
                    <p>
                      <span className="text-gray-400">Special Requests:</span> {formData.specialRequests}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 bg-[#111111] rounded-lg">
                <h4 className="font-medium mb-2">Payment Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">{formData.tickets} x Ticket(s)</span>
                    <span className="text-gray-300">${(formData.tickets * event.price).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-[#333333] my-2"></div>
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span className="text-gold-foil">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {errors.form && (
                <div className="p-4 bg-blood-red bg-opacity-20 text-blood-red rounded-lg">{errors.form}</div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-green bg-opacity-20 rounded-full flex items-center justify-center mx-auto">
                <FaCheck className="text-emerald-green text-2xl" />
              </div>

              <div>
                <h3 className="text-xl font-bold mb-2">Registration Successful!</h3>
                <p className="text-gray-300 mb-4">
                  Thank you for registering for {event.title}. We&apos;ve sent a confirmation email to {formData.email} with
                  all the details.
                </p>
              </div>

              <div className="p-4 bg-[#111111] rounded-lg text-left">
                <h4 className="font-medium mb-2">Event Details</h4>
                <div className="space-y-2 text-gray-300">
                  <p>
                    <span className="text-gray-400">Event:</span> {event.title}
                  </p>
                  <p>
                    <span className="text-gray-400">Date:</span> {formatDate(event.date)}
                  </p>
                  <p>
                    <span className="text-gray-400">Time:</span> {event.time}
                  </p>
                  <p>
                    <span className="text-gray-400">Location:</span> {event.location.name}
                  </p>
                  <p>
                    <span className="text-gray-400">Tickets:</span> {formData.tickets}
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-400">Add this event to your calendar or share it with friends.</p>

              <div className="flex justify-center gap-3">
                <button className="btn-outline text-sm">Add to Calendar</button>
                <button className="btn-outline text-sm">Share Event</button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-[#111111] border-t border-[#333333]">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            {step === 1 && (
              <>
                <button className="btn-outline" onClick={onClose}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleNextStep}>
                  Continue to Review
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <button className="btn-outline" onClick={handlePrevStep}>
                  Back
                </button>
                <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    "Complete Registration"
                  )}
                </button>
              </>
            )}

            {step === 3 && (
              <button className="btn-primary" onClick={onClose}>
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegistrationModal
