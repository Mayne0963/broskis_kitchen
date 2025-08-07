"use client"

import type React from "react"

import { useState } from "react"
import { FaUser, FaEnvelope, FaPhone, FaComment, FaCheck, FaExclamationTriangle } from "react-icons/fa"
import { AccessibleInput, AccessibleTextarea, AccessibleSelect, useFormValidation } from "../accessibility/AccessibleForm"
import { FormLoading, ErrorState, useLoadingState } from "../common/EnhancedLoadingStates"
import { toast } from "sonner"

const ContactForm = () => {
  const initialValues = {
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  }

  const { values: formData, errors, setValue, validate, reset } = useFormValidation(initialValues)
  const { isLoading: isSubmitting, error: submitError, withLoading, setError } = useLoadingState()
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setValue(name as keyof typeof initialValues, value)
  }

  const validationRules = {
    name: (value: string) => {
      if (!value.trim()) return "Name is required"
      return undefined
    },
    email: (value: string) => {
      if (!value.trim()) return "Email is required"
      if (!/\S+@\S+\.\S+/.test(value)) return "Email is invalid"
      return undefined
    },
    message: (value: string) => {
      if (!value.trim()) return "Message is required"
      return undefined
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate(validationRules)) {
      toast.error('Please fix the errors in the form')
      return
    }

    const result = await withLoading(async () => {
      // Simulate API call with potential failure
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate random failure for demo (remove in production)
          if (Math.random() > 0.7 && retryCount < 2) {
            reject(new Error('Network error: Failed to send message. Please try again.'))
          } else {
            resolve(true)
          }
        }, 1500)
      })

      // Simulate sending to actual API endpoint
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`)
      }

      return response.json()
    })

    if (result) {
      setIsSubmitted(true)
      setRetryCount(0)
      reset()
      toast.success('Message sent successfully!')
    }
  }

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    setError(null)
  }

  const subjectOptions = ["General Inquiry", "Catering", "Events", "Delivery", "Feedback", "Career", "Other"]

  return (
    <div className="bg-[#1A1A1A] rounded-lg p-6 border border-[#333333]">
      {isSubmitted ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-emerald-green bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheck className="text-emerald-green text-2xl" />
          </div>
          <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
          <p className="text-gray-300 mb-6">Thank you for reaching out. We'll get back to you as soon as possible.</p>
          <button className="btn-primary" onClick={() => setIsSubmitted(false)}>
            Send Another Message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <AccessibleInput
            id="name"
            name="name"
            type="text"
            label="Name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
            placeholder="Your name"
            className="pl-10"
          />

          <AccessibleInput
            id="email"
            name="email"
            type="email"
            label="Email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
            placeholder="your@email.com"
            className="pl-10"
          />

          <AccessibleInput
            id="phone"
            name="phone"
            type="tel"
            label="Phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="(123) 456-7890"
            description="Optional - We'll only call if needed"
            className="pl-10"
          />

          <AccessibleSelect
            id="subject"
            name="subject"
            label="Subject"
            value={formData.subject}
            onChange={handleChange}
            options={subjectOptions.map(option => ({ value: option, label: option }))}
            placeholder="Select a subject"
            description="Choose the category that best describes your inquiry"
          />

          <AccessibleTextarea
            id="message"
            name="message"
            label="Message"
            value={formData.message}
            onChange={handleChange}
            error={errors.message}
            required
            rows={5}
            placeholder="How can we help you?"
            description="Please provide as much detail as possible"
            className="pl-10"
          />

          {submitError && (
            <div className="mb-4">
              <ErrorState
                error={submitError}
                onRetry={handleRetry}
                retryCount={retryCount}
                maxRetries={3}
                className="bg-red-900/20 border border-red-500/30 rounded-lg p-4"
              />
            </div>
          )}
          
          <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
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
                Sending...
              </span>
            ) : (
              "Send Message"
            )}
          </button>
        </form>
      )}
    </div>
  )
}

export default ContactForm
