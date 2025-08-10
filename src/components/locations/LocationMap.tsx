"use client"

import type React from "react"
import { useEffect, useState } from "react"
import type { Location } from "@/types/location"
import { FaMapMarkerAlt, FaDirections, FaPhone, FaInfoCircle } from "react-icons/fa"

interface LocationMapProps {
  locations: Location[]
  center: { lat: number; lng: number }
  zoom: number
  selectedLocation: Location | null
  onMarkerClick: (location: Location) => void
}

const LocationMap: React.FC<LocationMapProps> = ({ locations, selectedLocation, onMarkerClick }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [mapAvailable, setMapAvailable] = useState(false)

  useEffect(() => {
    const checkMapAvailability = async () => {
      try {
        // Check if maps are available without exposing API key
        const response = await fetch("/api/maps")
        
        if (!response.ok) {
          console.error(`Maps API check failed: HTTP ${response.status}`)
          setMapAvailable(false)
          return
        }
        
        const data = await response.json()
        setMapAvailable(data.hasApiKey)
      } catch (error) {
        console.error("Error checking map availability:", error)
        setMapAvailable(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkMapAvailability()
  }, [])

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full h-full bg-[#1A1A1A] rounded-lg flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-gold-foil text-5xl mb-4 animate-pulse">
            <FaMapMarkerAlt />
          </div>
          <h3 className="text-xl font-bold mb-2">Loading Locations...</h3>
        </div>
      </div>
    )
  }

  // Always use the location list view - no more Google Maps integration
  return (
    <div className="w-full h-full bg-[#1A1A1A] rounded-lg p-6">
      <div className="mb-6 text-center">
        <div className="text-gold-foil text-5xl mb-4">
          <FaMapMarkerAlt />
        </div>
        <h3 className="text-xl font-bold mb-2">Our Locations</h3>
        {!mapAvailable && <p className="text-gray-400 mb-4">Find a Broski's Kitchen near you</p>}
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {locations.map((location) => (
          <div
            key={location.id}
            className={`p-4 rounded-lg cursor-pointer transition-all ${
              selectedLocation?.id === location.id
                ? "bg-gold-foil/20 border border-gold-foil"
                : "bg-gray-800 hover:bg-gray-700"
            }`}
            onClick={() => onMarkerClick(location)}
          >
            <h4 className="font-bold text-lg">{location.name}</h4>
            <p className="text-gray-300">{location.address}</p>
            <p className="text-gray-300">
              {location.city}, {location.state} {location.zipCode}
            </p>
            <p className="text-gray-400 mt-2">{location.phone}</p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {location.hours.map((hour, idx) => (
                <div key={idx} className="flex justify-between text-gray-400 text-xs">
                  <span className="font-medium">{hour.day}:</span>
                  <span>{hour.hours}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {location.features.map((feature, index) => (
                <span key={index} className="inline-block bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                  {feature}
                </span>
              ))}
            </div>

            <div className="mt-4 flex space-x-3 pt-2 border-t border-gray-700">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  `${location.address}, ${location.city}, ${location.state}`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-gold-foil hover:text-gold-foil/80 text-sm"
                aria-label={`Get directions to ${location.name}`}
              >
                <FaDirections className="mr-1" /> Directions
              </a>

              <a
                href={`tel:${location.phone.replace(/[^0-9]/g, "")}`}
                className="flex items-center text-gold-foil hover:text-gold-foil/80 text-sm"
                aria-label={`Call ${location.name}`}
              >
                <FaPhone className="mr-1" /> Call
              </a>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkerClick(location)
                }}
                className="flex items-center text-gold-foil hover:text-gold-foil/80 text-sm"
                aria-label={`View details for ${location.name}`}
              >
                <FaInfoCircle className="mr-1" /> Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LocationMap
