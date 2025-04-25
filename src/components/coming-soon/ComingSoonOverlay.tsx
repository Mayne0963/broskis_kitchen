"use client"

import type React from "react"
import { FaCalendarAlt, FaInfoCircle } from "react-icons/fa"

interface ComingSoonOverlayProps {
  onClose: () => void
}

const ComingSoonOverlay: React.FC<ComingSoonOverlayProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-md">
      <div className="bg-[#1A1A1A] rounded-lg shadow-xl w-full max-w-lg p-8 text-center animate-fade-in">
        <div className="w-20 h-20 bg-gold-foil bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaInfoCircle className="text-gold-foil text-3xl" />
        </div>

        <h2 className="text-3xl font-bold mb-4">Coming Soon</h2>
        <p className="text-xl text-gray-300 mb-6">
          Our infused menu will be available starting July 1st, 2024 in legal locations
        </p>

        <div className="bg-[#111111] p-6 rounded-lg mb-8">
          <div className="flex items-center justify-center mb-4">
            <FaCalendarAlt className="text-gold-foil mr-2" />
            <span className="text-gold-foil font-bold">Stay Tuned</span>
          </div>
          <p className="text-gray-400 mb-4">
            We're excited to bring you our premium infused culinary creations soon. Check back for updates!
          </p>
        </div>

        <p className="text-sm text-gray-500">
          You must be 21 or older to access our infused menu when available. Available only in locations where legal.
        </p>

        <button onClick={onClose} className="btn-primary mt-6">
          Close
        </button>
      </div>
    </div>
  )
}

export default ComingSoonOverlay
