"use client"

import React, { useState } from "react"
import { FaTimes, FaEnvelope, FaPhone, FaCheck } from "react-icons/fa"
import { AccessibleInput, AccessibleTextarea, AccessibleSelect, AccessibleCheckbox, AccessibleRadioGroup, useFormValidation } from "../accessibility/AccessibleForm"

interface VolunteerFormProps {
  onClose: () => void
}

const VolunteerForm: React.FC<VolunteerFormProps> = ({ onClose }) => {
  const initialValues = {
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
  }

  const { values: formData, errors, setValue, validate, reset } = useFormValidation(initialValues)
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        setValue("agreeToTerms", checkbox.checked)
      } else if (name.startsWith("interest-")) {
        const interest = name.replace("interest-", "")
        const newInterests = checkbox.checked
          ? [...formData.interests, interest]
          : formData.interests.filter((i) => i !== interest)
        setValue("interests", newInterests)
      } else if (name.startsWith("availability-")) {
        const availability = name.replace("availability-", "")
        const newAvailability = checkbox.checked
          ? [...formData.availability, availability]
          : formData.availability.filter((a) => a !== availability)
        setValue("availability", newAvailability)
      }
    } else {
      setValue(name as keyof typeof initialValues, value)
    }
  }

  const step1ValidationRules = {
    firstName: (value: string) => {
      if (!value.trim()) return "First name is required"
      return undefined
    },
    lastName: (value: string) => {
      if (!value.trim()) return "Last name is required"
      return undefined
    },
    email: (value: string) => {
      if (!value.trim()) return "Email is required"
      if (!/\S+@\S+\.\S+/.test(value)) return "Email is invalid"
      return undefined
    },
    phone: (value: string) => {
      if (!value.trim()) return "Phone number is required"
      return undefined
    },
    age: (value: string) => {
      if (!value.trim()) return "Age is required"
      if (Number.parseInt(value) < 16) return "You must be at least 16 years old to volunteer"
      return undefined
    }
  }

  const validateStep1 = () => {
    return validate(step1ValidationRules)
  }

  const step2ValidationRules = {
    interests: (value: string[]) => {
      if (value.length === 0) return "Please select at least one area of interest"
      return undefined
    },
    availability: (value: string[]) => {
      if (value.length === 0) return "Please select at least one availability option"
      return undefined
    },
    experience: (value: string) => {
      if (!value.trim()) return "Please share your relevant experience"
      return undefined
    },
    motivation: (value: string) => {
      if (!value.trim()) return "Please share your motivation for volunteering"
      return undefined
    }
  }

  const validateStep2 = () => {
    return validate(step2ValidationRules)
  }

  const step3ValidationRules = {
    hearAbout: (value: string) => {
      if (!value.trim()) return "Please let us know how you heard about us"
      return undefined
    },
    agreeToTerms: (value: boolean) => {
      if (!value) return "You must agree to the terms and conditions"
      return undefined
    }
  }

  const validateStep3 = () => {
    return validate(step3ValidationRules)
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
                <AccessibleInput
                  id="firstName"
                  name="firstName"
                  type="text"
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={errors.firstName}
                  required
                  placeholder="Enter your first name"
                />

                <AccessibleInput
                  id="lastName"
                  name="lastName"
                  type="text"
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={errors.lastName}
                  required
                  placeholder="Enter your last name"
                />
              </div>

              <AccessibleInput
                id="email"
                name="email"
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
                placeholder="your@email.com"
                description="We'll use this to contact you about volunteer opportunities"
                className="pl-10"
              />

              <AccessibleInput
                id="phone"
                name="phone"
                type="tel"
                label="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                required
                placeholder="(123) 456-7890"
                description="For urgent volunteer communications"
                className="pl-10"
              />

              <AccessibleInput
                id="age"
                name="age"
                type="number"
                label="Age"
                value={formData.age}
                onChange={handleChange}
                error={errors.age}
                required
                min={16}
                max={100}
                placeholder="Enter your age"
                description="You must be at least 16 years old to volunteer"
              />
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
              <fieldset>
                <legend className="block text-sm font-medium mb-2">Areas of Interest * (Select all that apply)</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2" role="group">
                  {interestOptions.map((interest) => (
                    <AccessibleCheckbox
                      key={interest}
                      id={`interest-${interest}`}
                      name={`interest-${interest}`}
                      label={interest}
                      checked={formData.interests.includes(interest)}
                      onChange={handleChange}
                    />
                  ))}
                </div>
                {errors.interests && <p className="mt-1 text-sm text-red-400" role="alert">{errors.interests}</p>}
              </fieldset>

              <fieldset>
                <legend className="block text-sm font-medium mb-2">Availability * (Select all that apply)</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2" role="group">
                  {availabilityOptions.map((availability) => (
                    <AccessibleCheckbox
                      key={availability}
                      id={`availability-${availability}`}
                      name={`availability-${availability}`}
                      label={availability}
                      checked={formData.availability.includes(availability)}
                      onChange={handleChange}
                    />
                  ))}
                </div>
                {errors.availability && <p className="mt-1 text-sm text-red-400" role="alert">{errors.availability}</p>}
              </fieldset>

              <AccessibleTextarea
                id="experience"
                name="experience"
                label="Relevant Experience"
                value={formData.experience}
                onChange={handleChange}
                error={errors.experience}
                required
                rows={4}
                placeholder="Please describe any relevant experience you have (previous volunteer work, culinary experience, etc.)"
                description="Share any skills or experience that would help you as a volunteer"
              />

              <AccessibleTextarea
                 id="motivation"
                 name="motivation"
                 label="Motivation for Volunteering"
                 value={formData.motivation}
                 onChange={handleChange}
                 error={errors.motivation}
                 required
                 rows={4}
                 placeholder="Why are you interested in volunteering with Broski's Kitchen?"
                 description="Tell us what motivates you to volunteer with our organization"
               />
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
              <AccessibleSelect
                id="hearAbout"
                name="hearAbout"
                label="How did you hear about our volunteer program?"
                value={formData.hearAbout}
                onChange={handleChange}
                error={errors.hearAbout}
                required
                options={[
                  { value: "", label: "Please select" },
                  { value: "Social Media", label: "Social Media" },
                  { value: "Friend or Family", label: "Friend or Family" },
                  { value: "Website", label: "Website" },
                  { value: "Email", label: "Email" },
                  { value: "In-Store", label: "In-Store" },
                  { value: "Community Event", label: "Community Event" },
                  { value: "Other", label: "Other" }
                ]}
                description="Help us understand how you discovered our volunteer opportunities"
              />

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

              <AccessibleCheckbox
                id="agreeToTerms"
                name="agreeToTerms"
                label={
                  <>
                    I agree to the{" "}
                    <a href="/terms" className="text-gold-foil hover:underline">
                      Volunteer Terms and Conditions
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" className="text-gold-foil hover:underline">
                      Privacy Policy
                    </a>
                  </>
                }
                checked={formData.agreeToTerms}
                onChange={handleChange}
                error={errors.agreeToTerms}
                required
              />

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
