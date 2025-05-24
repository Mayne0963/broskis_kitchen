"use client"

import type React from "react"
import { FaUtensils, FaMapMarkerAlt, FaCalendarAlt, FaGift } from "react-icons/fa"

interface QuickActionProps {
  icon: React.ReactNode
  text: string
  onClick: () => void
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, text, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 p-2 rounded-md hover:bg-[#333333] transition-colors text-left w-full"
  >
    <div className="bg-gold-foil bg-opacity-20 p-2 rounded-full">{icon}</div>
    <span>{text}</span>
  </button>
)

interface WelcomeMessageProps {
  onQuickActionClick: (message: string) => void
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ onQuickActionClick }) => {
  return (
    <div className="bg-[#222222] rounded-lg p-4 mb-4">
      <h3 className="font-bold text-gold-foil mb-2">Welcome to Broski's Kitchen!</h3>
      <p className="text-gray-300 mb-4">I'm BroskiBot, your virtual assistant. How can I help you today?</p>

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-400 mb-1">Quick Actions:</h4>
        <QuickAction
          icon={<FaUtensils className="text-gold-foil" />}
          text="Tell me about the menu"
          onClick={() => onQuickActionClick("Tell me about your menu options")}
        />
        <QuickAction
          icon={<FaMapMarkerAlt className="text-gold-foil" />}
          text="Find a location"
          onClick={() => onQuickActionClick("What locations do you have?")}
        />
        <QuickAction
          icon={<FaCalendarAlt className="text-gold-foil" />}
          text="Upcoming events"
          onClick={() => onQuickActionClick("What events do you have coming up?")}
        />
        <QuickAction
          icon={<FaGift className="text-gold-foil" />}
          text="Rewards program"
          onClick={() => onQuickActionClick("Tell me about your rewards program")}
        />
      </div>
    </div>
  )
}

export default WelcomeMessage
