"use client"

import type React from "react"
import { useState, useEffect } from "react"

import { FaMapMarkerAlt, FaPhone, FaClock, FaChevronRight } from "react-icons/fa"
import type { Location } from "@/types/location"

interface LocationCardProps {
  location: Location
  isSelected: boolean
  onSelect: (location: Location) => void
}

const LocationCard: React.FC<LocationCardProps> = ({ location, isSelected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState("Loading...")
  const [todayHours, setTodayHours] = useState("Loading...")

  // Determine if the location is currently open
  const getCurrentStatus = () => {
    const now = new Date()
    const day = now.toLocaleDateString("en-US", { weekday: "long" })
    const currentHour = now.getHours() * 100 + now.getMinutes()

    const todayHours = location.hours.find((h) => h.day === day)

    if (!todayHours || todayHours.hours === "Closed") {
      return { isOpen: false, status: "Closed", hours: "Closed" }
    }

    // Parse hours like "11:00 AM - 10:00 PM"
    const [openStr, closeStr] = todayHours.hours.split(" - ")

    const parseTimeStr = (timeStr: string) => {
      const [time, period] = timeStr.split(" ")
      let [hours, minutes] = time.split(":").map(Number)
      if (period === "PM" && hours !== 12) hours += 12
      if (period === "AM" && hours === 12) hours = 0
      return hours * 100 + minutes
    }

    const openTime = parseTimeStr(openStr)
    const closeTime = parseTimeStr(closeStr)

    if (currentHour >= openTime && currentHour < closeTime) {
      return { isOpen: true, status: "Open Now", hours: todayHours.hours }
    } else {
      return { isOpen: false, status: "Closed", hours: todayHours.hours }
    }
  }

  useEffect(() => {
    const { isOpen, status, hours } = getCurrentStatus()
    setIsOpen(isOpen)
    setStatus(status)
    setTodayHours(hours)
  }, [location.hours])

  return (
    <div
      id={`location-${location.id}`}
      className={`bg-[#1A1A1A] rounded-lg overflow-hidden shadow-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-xl ${
        isSelected ? "border-gold-foil" : "border-[#333333] hover:border-[#555555]"
      }`}
      onClick={() => onSelect(location)}
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold">{location.name}</h3>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              isOpen ? "bg-emerald-green bg-opacity-20 text-emerald-green" : "bg-blood-red bg-opacity-20 text-blood-red"
            }`}
          >
            {status}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-start">
            <FaMapMarkerAlt className="text-gold-foil mt-1 mr-2 flex-shrink-0" />
            <address className="not-italic text-gray-300 text-sm">
              {location.address}, {location.city}, {location.state} {location.zipCode}
            </address>
          </div>

          <div className="flex items-center">
            <FaPhone className="text-gold-foil mr-2 flex-shrink-0" />
            <span className="text-gray-300 text-sm">{location.phone}</span>
          </div>

          <div className="flex items-start">
            <FaClock className="text-gold-foil mt-1 mr-2 flex-shrink-0" />
            <div className="text-gray-300 text-sm">
              <p className="font-medium">Today's Hours:</p>
              <p>{todayHours}</p>
            </div>
          </div>
        </div>

        <button
          className="flex items-center justify-between w-full text-gold-foil hover:text-white transition-colors text-sm font-medium"
          onClick={(e) => {
            e.stopPropagation()
            onSelect(location)
          }}
        >
          <span>View Details</span>
          <FaChevronRight />
        </button>
      </div>
    </div>
  )
}

export default LocationCard
