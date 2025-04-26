"use client"

import { useState, useEffect } from "react"
import { FaSearch, FaMapMarkerAlt, FaPhone, FaClock, FaDirections, FaUtensils } from "react-icons/fa"
import LocationMap from "../../components/locations/LocationMap"
import LocationCard from "../../components/locations/LocationCard"
import LocationFilter from "../../components/locations/LocationFilter"
import { locationData } from "../../data/location-data"

export default function LocationsClientPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedState, setSelectedState] = useState("all")
  const [filteredLocations, setFilteredLocations] = useState(locationData)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [mapCenter, setMapCenter] = useState({ lat: 34.0522, lng: -118.2437 }) // Default to LA
  const [mapZoom, setMapZoom] = useState(5)

  // Get unique states for filter
  const states = [...new Set(locationData.map((location) => location.state))].sort()

  // Filter locations based on search query and selected state
  useEffect(() => {
    let filtered = [...locationData]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (location) =>
          location.name.toLowerCase().includes(query) ||
          location.address.toLowerCase().includes(query) ||
          location.city.toLowerCase().includes(query) ||
          location.state.toLowerCase().includes(query) ||
          location.zipCode.toLowerCase().includes(query),
      )
    }

    if (selectedState !== "all") {
      filtered = filtered.filter((location) => location.state === selectedState)
    }

    setFilteredLocations(filtered)

    // If we have filtered results, center the map on the first result
    if (filtered.length > 0 && (searchQuery || selectedState !== "all")) {
      setMapCenter({ lat: filtered[0].coordinates.lat, lng: filtered[0].coordinates.lng })
      setMapZoom(10)
    } else {
      // Reset to default view
      setMapCenter({ lat: 34.0522, lng: -118.2437 })
      setMapZoom(5)
    }
  }, [searchQuery, selectedState])

  // Handle location selection
  const handleLocationSelect = (location) => {
    setSelectedLocation(location)
    setMapCenter({ lat: location.coordinates.lat, lng: location.coordinates.lng })
    setMapZoom(14)
  }

  // Handle map marker click
  const handleMarkerClick = (location) => {
    setSelectedLocation(location)

    // Scroll to the selected location card if on mobile
    if (window.innerWidth < 768) {
      const element = document.getElementById(`location-${location.id}`)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative h-[40vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-black">
          <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent opacity-70 z-10"></div>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/locations-hero.jpg')" }}
          ></div>
        </div>
        <div className="container mx-auto px-4 z-10 text-center">
          <h1 className="heading-xl mb-4 text-white gritty-shadow">Our Locations</h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Find a Broski&apos;s Kitchen near you and experience our luxury street gourmet.
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
                placeholder="Search by city, state, or zip code..."
                className="input w-full pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search locations"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            {/* State Filter */}
            <LocationFilter states={states} selectedState={selectedState} setSelectedState={setSelectedState} />
          </div>
        </div>
      </section>

      {/* Map and Locations Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Locations List */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <h2 className="text-2xl font-bold mb-6">
                {filteredLocations.length} {filteredLocations.length === 1 ? "Location" : "Locations"} Found
              </h2>

              {filteredLocations.length > 0 ? (
                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 locations-container">
                  {filteredLocations.map((location) => (
                    <LocationCard
                      key={location.id}
                      location={location}
                      isSelected={selectedLocation?.id === location.id}
                      onSelect={handleLocationSelect}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-[#1A1A1A] rounded-lg p-8 text-center">
                  <FaMapMarkerAlt className="text-4xl text-gold-foil mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Locations Found</h3>
                  <p className="text-gray-400 mb-4">
                    We couldn&apos;t find any locations matching your search criteria.
                  </p>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedState("all")
                    }}
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>

            {/* Map */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              <div className="bg-[#1A1A1A] rounded-lg overflow-hidden shadow-lg h-[600px]">
                <LocationMap
                  locations={filteredLocations}
                  center={mapCenter}
                  zoom={mapZoom}
                  selectedLocation={selectedLocation}
                  onMarkerClick={handleMarkerClick}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Selected Location Details */}
      {selectedLocation && (
        <section className="py-12 bg-[#111111]">
          <div className="container mx-auto px-4">
            <div className="bg-[#1A1A1A] rounded-lg overflow-hidden shadow-lg">
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2 text-gold-foil">{selectedLocation.name}</h2>
                    <div className="flex items-center text-gray-400 mb-4">
                      <FaMapMarkerAlt className="mr-2 text-gold-foil" />
                      <address className="not-italic">
                        {selectedLocation.address}, {selectedLocation.city}, {selectedLocation.state}{" "}
                        {selectedLocation.zipCode}
                      </address>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Hours */}
                      <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center">
                          <FaClock className="mr-2 text-gold-foil" /> Hours
                        </h3>
                        <ul className="space-y-1 text-gray-300">
                          {selectedLocation.hours.map((hour, index) => (
                            <li key={index} className="flex justify-between">
                              <span className="font-medium">{hour.day}:</span>
                              <span>{hour.hours}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Contact & Features */}
                      <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center">
                          <FaPhone className="mr-2 text-gold-foil" /> Contact
                        </h3>
                        <p className="text-gray-300 mb-4">{selectedLocation.phone}</p>

                        <h3 className="text-lg font-semibold mb-2 flex items-center">
                          <FaUtensils className="mr-2 text-gold-foil" /> Features
                        </h3>
                        <ul className="grid grid-cols-2 gap-2">
                          {selectedLocation.features.map((feature, index) => (
                            <li key={index} className="flex items-center text-gray-300">
                              <span className="w-2 h-2 bg-gold-foil rounded-full mr-2"></span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex flex-col gap-3">
                    <a
                      href={`https://maps.google.com/?q=${selectedLocation.coordinates.lat},${selectedLocation.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary flex items-center justify-center gap-2 w-full md:w-auto"
                    >
                      <FaDirections /> Get Directions
                    </a>
                    <a
                      href={`/order?location=${selectedLocation.id}`}
                      className="btn-outline flex items-center justify-center gap-2 w-full md:w-auto"
                    >
                      <FaUtensils /> Order Online
                    </a>
                  </div>
                </div>

                {/* Special Notes */}
                {selectedLocation.notes && (
                  <div className="mt-6 p-4 bg-black bg-opacity-30 rounded-lg border border-[#333333]">
                    <h3 className="text-lg font-semibold mb-2">Special Notes</h3>
                    <p className="text-gray-300">{selectedLocation.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Coming Soon Section */}
      <section className="py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Coming Soon</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Broski&apos;s Kitchen is expanding! Check out our upcoming locations.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Coming Soon Location Cards */}
            <div className="bg-[#1A1A1A] rounded-lg overflow-hidden shadow-lg border border-[#333333] hover:border-gold-foil transition-colors">
              <div className="p-6">
                <div className="bg-gold-foil bg-opacity-20 text-gold-foil text-sm font-bold px-3 py-1 rounded-full inline-block mb-4">
                  Opening Fall 2023
                </div>
                <h3 className="text-xl font-bold mb-2">Miami, FL</h3>
                <p className="text-gray-400 mb-4">
                  Wynwood Arts District
                  <br />
                  Miami, FL 33127
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Coming Soon</span>
                  <button className="text-gold-foil hover:underline text-sm">Get Notified</button>
                </div>
              </div>
            </div>

            <div className="bg-[#1A1A1A] rounded-lg overflow-hidden shadow-lg border border-[#333333] hover:border-gold-foil transition-colors">
              <div className="p-6">
                <div className="bg-gold-foil bg-opacity-20 text-gold-foil text-sm font-bold px-3 py-1 rounded-full inline-block mb-4">
                  Opening Winter 2023
                </div>
                <h3 className="text-xl font-bold mb-2">Austin, TX</h3>
                <p className="text-gray-400 mb-4">
                  South Congress
                  <br />
                  Austin, TX 78704
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Coming Soon</span>
                  <button className="text-gold-foil hover:underline text-sm">Get Notified</button>
                </div>
              </div>
            </div>

            <div className="bg-[#1A1A1A] rounded-lg overflow-hidden shadow-lg border border-[#333333] hover:border-gold-foil transition-colors">
              <div className="p-6">
                <div className="bg-gold-foil bg-opacity-20 text-gold-foil text-sm font-bold px-3 py-1 rounded-full inline-block mb-4">
                  Opening Spring 2024
                </div>
                <h3 className="text-xl font-bold mb-2">Chicago, IL</h3>
                <p className="text-gray-400 mb-4">
                  West Loop
                  <br />
                  Chicago, IL 60607
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Coming Soon</span>
                  <button className="text-gold-foil hover:underline text-sm">Get Notified</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Franchise Information */}
      <section className="py-16 bg-black relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/20 to-[#880808]/20 opacity-50"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="heading-lg mb-4 gritty-shadow">Interested in Franchising?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join the Broski&apos;s Kitchen family and bring luxury street gourmet to your community. We&apos;re looking
            for passionate entrepreneurs to help us expand.
          </p>
          <a href="/franchise" className="btn-primary inline-block">
            Learn About Franchising
          </a>
        </div>
      </section>
    </div>
  )
}
