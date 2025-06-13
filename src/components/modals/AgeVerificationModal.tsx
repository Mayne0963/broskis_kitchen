"use client"

import type React from "react"

import { useState } from "react"
import { useAgeVerification } from "../../lib/context/AgeVerificationContext"
import { FaTimes, FaExclamationTriangle } from "react-icons/fa"

interface AgeVerificationModalProps {
  onClose: () => void
}

const AgeVerificationModal: React.FC<AgeVerificationModalProps> = ({ onClose }) => {
  const { verifyAge, isVerifying, error } = useAgeVerification()
  const [month, setMonth] = useState("")
  const [year, setYear] = useState("")

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i)
  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!month || !year) {
      return
    }

    const verified = await verifyAge(Number.parseInt(month), Number.parseInt(year))

    if (verified) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
      <div className="bg-[#1A1A1A] rounded-lg shadow-xl w-full max-w-md mx-4 relative animate-fade-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white" aria-label="Close">
          <FaTimes size={20} />
        </button>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blood-red bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaExclamationTriangle className="text-blood-red text-2xl" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Age Verification Required</h2>
            <p className="text-gray-400">You must be 21 years or older to view and purchase infused products.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Date of Birth</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <select value={month} onChange={(e) => setMonth(e.target.value)} className="input w-full" required>
                    <option value="">Month</option>
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <select value={year} onChange={(e) => setYear(e.target.value)} className="input w-full" required>
                    <option value="">Year</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {error && <div className="bg-blood-red bg-opacity-20 text-blood-red p-3 rounded mb-4">{error}</div>}

            <div className="flex flex-col gap-3">
              <button type="submit" className="btn-primary" disabled={isVerifying || !month || !year}>
                {isVerifying ? "Verifying..." : "Verify Age"}
              </button>
              <button type="button" onClick={onClose} className="btn-outline">
                Cancel
              </button>
            </div>
          </form>

          <p className="text-xs text-gray-500 mt-6 text-center">
            By clicking "Verify Age", you confirm that you are 21 years of age or older and agree to our Terms of
            Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AgeVerificationModal
