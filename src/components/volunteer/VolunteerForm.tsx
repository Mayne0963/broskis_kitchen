"use client"

import type React from "react"

import { useState } from "react"
import { FaTimes, FaEnvelope, FaPhone, FaCheck } from "react-icons/fa"

interface VolunteerFormProps {
  onClose: () => void
}

const VolunteerForm: React.FC<VolunteerFormProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    age: "",
    interests: [] as string[],
    availability: [] as string[],
    experience: "",
    motivation: "",
    hearAbout: "",
    agreeToTerms: false,
  })

  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const interestOptions = [
    "Kitchen Assistant",
    "Event Support",
    "Food Distribution",
    "Community Outreach",
    "Administrative Support",
    "Culinary Education",
  ]

  const availabilityOptions = [
    "Weekday Mornings",
    "Weekday Afternoons",
    "Weekday Evenings",
    "Weekend Mornings",
    "Weekend Afternoons",
    "Weekend Evenings",
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement

      if (name === "agreeToTerms") {
        setFormData({
          ...formData,
          [name]: checkbox.checked,
        })
      } else if (name.startsWith("interest-")) {
        const interest = name.replace("interest-", "")
        setFormData({
          ...formData,
          interests: checkbox.checked
            ? [...formData.interests, interest]
            : formData.interests.filter((i) => i !== interest),
        })
      } else if (name.startsWith("availability-")) {
        const availability = name.replace("availability-", "")
        setFormData({
          ...formData,
          availability: checkbox.checked
            ? [...formData.availability, availability]
            : formData.availability.filter((a) => a !== availability),
        })
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }

    // Clear error when field is updated
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      })
    }
  }

  const validateStep1 = () => {
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

    if (!formData.age.trim()) {
      newErrors.age = "Age is required"
    } else if (Number.parseInt(formData.age) < 16) {
      newErrors.age = "You must be at least 16 years old to volunteer"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}

    if (formData.interests.length === 0) {
      newErrors.interests = "Please select at least one area of interest"
    }

    if (formData.availability.length === 0) {
      newErrors.availability = "Please select at least one availability option"
    }

    if (!formData.experience.trim()) {
      newErrors.experience = "Please share your relevant experience"
    }

    if (!formData.motivation.trim()) {
      newErrors.motivation = "Please share your motivation for volunteering"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.hearAbout.trim()) {
      newErrors.hearAbout = "Please let us know how you heard about us"
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handlePrevStep = () => {
    setStep(step - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (validateStep3()) {
      setIsSubmitting(true)

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // Show success step
        setStep(4)
      } catch (error) {
        console.error("Form submission error:", error)
        setErrors({
          ...errors,
          form: "An error occurred during submission. Please try again.",
        })
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <>
      <div className="relative p-6 border-b border-[#333333]">
        <h2 className="text-xl font-bold pr-8">{step === 4 ? "Application Submitted" : "Volunteer Application"}</h2>
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white" aria-label="Close">
          <FaTimes />
        </button>
      </div>

      <div className="p-6 overflow-y-auto max-h-[calc(90vh-10rem)]">
        {step === 1 && (
          <>
            <div className="mb-6">
              <div className="flex justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gold-foil text-black flex items-center justify-center">1</div>
                  <span className="ml-2 font-bold">Personal Information</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <div className="w-8 h-8 rounded-full bg-[#333333] flex items-center justify-center mr-2">2</div>
                  <div className="w-8 h-8 rounded-full bg-[#333333] flex items-center justify-center">3</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
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
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="text-gray-500" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`input pl-10 w-full ${errors.email ? "border-blood-red" : ""}`}
                    required
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-blood-red">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaPhone className="text-gray-500" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`input pl-10 w-full ${errors.phone ? "border-blood-red" : ""}`}
                    required
                  />
                </div>
                {errors.phone && <p className="mt-1 text-sm text-blood-red">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="age" className="block text-sm font-medium mb-1">
                  Age *
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  min="16"
                  max="100"
                  value={formData.age}
                  onChange={handleChange}
                  className={`input w-full ${errors.age ? "border-blood-red" : ""}`}
                  required
                />
                {errors.age && <p className="mt-1 text-sm text-blood-red">{errors.age}</p>}
                <p className="mt-1 text-xs text-gray-400">You must be at least 16 years old to volunteer.</p>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="mb-6">
              <div className="flex justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-[#333333] flex items-center justify-center">1</div>
                  <div className="w-8 h-8 rounded-full bg-gold-foil text-black flex items-center justify-center mx-2">
                    2
                  </div>
                  <span className="font-bold">Experience & Availability</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <div className="w-8 h-8 rounded-full bg-[#333333] flex items-center justify-center">3</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Areas of Interest * (Select all that apply)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {interestOptions.map((interest) => (
                    <label key={interest} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name={`interest-${interest}`}
                        checked={formData.interests.includes(interest)}
                        onChange={handleChange}
                        className="rounded border-[#333333] text-gold-foil focus:ring-gold-foil"
                      />
                      <span>{interest}</span>
                    </label>
                  ))}
                </div>
                {errors.interests && <p className="mt-1 text-sm text-blood-red">{errors.interests}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Availability * (Select all that apply)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {availabilityOptions.map((availability) => (
                    <label key={availability} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name={`availability-${availability}`}
                        checked={formData.availability.includes(availability)}
                        onChange={handleChange}
                        className="rounded border-[#333333] text-gold-foil focus:ring-gold-foil"
                      />
                      <span>{availability}</span>
                    </label>
                  ))}
                </div>
                {errors.availability && <p className="mt-1 text-sm text-blood-red">{errors.availability}</p>}
              </div>

              <div>
                <label htmlFor="experience" className="block text-sm font-medium mb-1">
                  Relevant Experience *
                </label>
                <textarea
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  className={`input w-full h-24 ${errors.experience ? "border-blood-red" : ""}`}
                  placeholder="Please describe any relevant experience you have (previous volunteer work, culinary experience, etc.)"
                  required
                ></textarea>
                {errors.experience && <p className="mt-1 text-sm text-blood-red">{errors.experience}</p>}
              </div>

              <div>
                <label htmlFor="motivation" className="block text-sm font-medium mb-1">
                  Motivation for Volunteering *
                </label>
                <textarea
                  id="motivation"
                  name="motivation"
                  value={formData.motivation}
                  onChange={handleChange}
                  className={`input w-full h-24 ${errors.motivation ? "border-blood-red" : ""}`}
                  placeholder="Why are you interested in volunteering with Broski's Kitchen?"
                  required
                ></textarea>
                {errors.motivation && <p className="mt-1 text-sm text-blood-red">{errors.motivation}</p>}
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="mb-6">
              <div className="flex justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-[#333333] flex items-center justify-center">1</div>
                  <div className="w-8 h-8 rounded-full bg-[#333333] flex items-center justify-center mx-2">2</div>
                  <div className="w-8 h-8 rounded-full bg-gold-foil text-black flex items-center justify-center mr-2">
                    3
                  </div>
                  <span className="font-bold">Final Steps</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="hearAbout" className="block text-sm font-medium mb-1">
                  How did you hear about our volunteer program? *
                </label>
                <select
                  id="hearAbout"
                  name="hearAbout"
                  value={formData.hearAbout}
                  onChange={handleChange}
                  className={`input w-full ${errors.hearAbout ? "border-blood-red" : ""}`}
                  required
                >
                  <option value="">Please select</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Friend or Family">Friend or Family</option>
                  <option value="Website">Website</option>
                  <option value="Email">Email</option>
                  <option value="In-Store">In-Store</option>
                  <option value="Community Event">Community Event</option>
                  <option value="Other">Other</option>
                </select>
                {errors.hearAbout && <p className="mt-1 text-sm text-blood-red">{errors.hearAbout}</p>}
              </div>

              <div className="bg-[#111111] p-4 rounded-lg">
                <h3 className="font-bold mb-2">Application Summary</h3>
                <div className="space-y-2 text-sm">
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
                    <span className="text-gray-400">Age:</span> {formData.age}
                  </p>
                  <p>
                    <span className="text-gray-400">Interests:</span> {formData.interests.join(", ")}
                  </p>
                  <p>
                    <span className="text-gray-400">Availability:</span> {formData.availability.join(", ")}
                  </p>
                </div>
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
                      Volunteer Terms and Conditions
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" className="text-gold-foil hover:underline">
                      Privacy Policy
                    </a>
                  </label>
                  {errors.agreeToTerms && <p className="mt-1 text-sm text-blood-red">{errors.agreeToTerms}</p>}
                </div>
              </div>

              {errors.form && (
                <div className="bg-blood-red bg-opacity-20 text-blood-red p-4 rounded-md">{errors.form}</div>
              )}
            </div>
          </>
        )}

        {step === 4 && (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-green bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheck className="text-emerald-green text-2xl" />
            </div>

            <h3 className="text-xl font-bold mb-4">Application Submitted Successfully!</h3>
            <p className="text-gray-300 mb-6">
              Thank you for your interest in volunteering with Broski&apos;s Kitchen. We&apos;ve received your
              application and will contact you within 3-5 business days to discuss next steps.
            </p>

            <div className="bg-[#111111] p-6 rounded-lg mb-6">
              <h4 className="text-sm text-gray-400 mb-2">What to Expect Next</h4>
              <ol className="text-left space-y-2">
                <li className="flex items-start">
                  <span className="w-6 h-6 rounded-full bg-gold-foil text-black flex items-center justify-center mr-3 flex-shrink-0">
                    1
                  </span>
                  <span>Application review (3-5 business days)</span>
                </li>
                <li className="flex items-start">
                  <span className="w-6 h-6 rounded-full bg-gold-foil text-black flex items-center justify-center mr-3 flex-shrink-0">
                    2
                  </span>
                  <span>Interview invitation via email</span>
                </li>
                <li className="flex items-start">
                  <span className="w-6 h-6 rounded-full bg-gold-foil text-black flex items-center justify-center mr-3 flex-shrink-0">
                    3
                  </span>
                  <span>Orientation and training schedule</span>
                </li>
              </ol>
            </div>

            <button className="btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>

      <div className="p-6 bg-[#111111] border-t border-[#333333]">
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          {step > 1 && step < 4 && (
            <button className="btn-outline" onClick={handlePrevStep}>
              Back
            </button>
          )}

          {step < 3 && (
            <button className="btn-primary" onClick={handleNextStep}>
              Continue
            </button>
          )}

          {step === 3 && (
            <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center justify-center">
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
                  Submitting...
                </span>
              ) : (
                "Submit Application"
              )}
            </button>
          )}
        </div>
      </div>
    </>
  )
}

export default VolunteerForm
