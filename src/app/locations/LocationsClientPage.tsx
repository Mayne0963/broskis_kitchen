"use client"

import { useState, useEffect } from "react"
import { FaSearch, FaMapMarkerAlt, FaPhone, FaClock, FaDirections, FaUtensils, FaFilter } from "react-icons/fa"
import Image from "next/image"

type LocationsClientPageProps = {
  locations: any[] // you can replace any[] with your real Location type later
}

export default function LocationsClientPage({ locations }: LocationsClientPageProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedState, setSelectedState] = useState("all")
  const [filteredLocations, setFilteredLocations] = useState(locations)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [mapCenter, setMapCenter] = useState({ lat: 34.0522, lng: -118.2437 }) // Default to LA
  const [mapZoom, setMapZoom] = useState(5)

  const states = [...new Set(locations.map((location) => location.state))].sort()

  useEffect(() => {
    let filtered = [...locations]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (location) =>
          location.name.toLowerCase().includes(query) ||
          location.address.toLowerCase().includes(query) ||
          location.city.toLowerCase().includes(query) ||
          location.state.toLowerCase().includes(query) ||
          location.zipCode.toLowerCase().includes(query)
      )
    }

    if (selectedState !== "all") {
      filtered = filtered.filter((location) => location.state === selectedState)
    }

    setFilteredLocations(filtered)

    if (filtered.length > 0 && (searchQuery || selectedState !== "all")) {
      setMapCenter({ lat: filtered[0].coordinates.lat, lng: filtered[0].coordinates.lng })
      setMapZoom(10)
    } else {
      setMapCenter({ lat: 34.0522, lng: -118.2437 })
      setMapZoom(5)
    }
  }, [searchQuery, selectedState, locations])

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative h-[40vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20restaurant%20locations%20urban%20street%20food%20kitchen%20multiple%20locations%20cityscape&image_size=landscape_16_9" 
            alt="Broski's Kitchen Locations" 
            fill 
            className="object-cover" 
            priority 
          />
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        </div>
        <div className="container mx-auto px-4 z-10 text-center">
          <h1 className="heading-xl mb-4 text-white gritty-shadow">Our Locations</h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Find a Broski's Kitchen near you and experience luxury street food.
          </p>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="bg-[#111111] py-8 sticky top-20 z-30 border-b border-[#333333]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Search Bar */}
            <div className="relative w-full md:w-1/3">
              <input
                type="text"
                placeholder="Search locations..."
                className="input w-full pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            {/* State Filter */}
            <div className="flex items-center gap-4">
              <select
                className="input"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
              >
                <option value="all">All States</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Locations Grid */}
      <section className="py-12 bg-black">
        <div className="container mx-auto px-4">
          {filteredLocations.length === 0 ? (
            <div className="text-center py-16">
              <FaMapMarkerAlt className="text-6xl text-gray-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">No locations found</h3>
              <p className="text-gray-400">Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredLocations.map((location: any) => (
                <div key={location.id} className="bg-[#1A1A1A] rounded-lg overflow-hidden border border-[#333333] hover:border-gold-foil transition-colors">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{location.name}</h3>
                        <div className="flex items-center text-gray-400 mb-2">
                          <FaMapMarkerAlt className="mr-2" />
                          <span className="text-sm">
                            {location.address}, {location.city}, {location.state} {location.zipCode}
                          </span>
                        </div>
                      </div>
                    </div>

                    {location.phone && (
                      <div className="flex items-center text-gray-400 mb-2">
                        <FaPhone className="mr-2" />
                        <span className="text-sm">{location.phone}</span>
                      </div>
                    )}

                    {location.hours && (
                      <div className="flex items-center text-gray-400 mb-4">
                        <FaClock className="mr-2" />
                        <span className="text-sm">{location.hours}</span>
                      </div>
                    )}

                    {location.features && location.features.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {location.features.map((feature: string, index: number) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gold-foil bg-opacity-20 text-gold-foil text-xs rounded-full"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button className="btn-primary flex-1 flex items-center justify-center gap-2">
                        <FaDirections /> Get Directions
                      </button>
                      <button className="btn-outline flex items-center justify-center gap-2">
                        <FaUtensils /> Order Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
