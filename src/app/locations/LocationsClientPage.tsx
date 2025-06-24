"use client"

import { useState, useEffect } from "react"
import { FaSearch, FaMapMarkerAlt, FaPhone, FaClock, FaDirections, FaUtensils } from "react-icons/fa"
import LocationMap from "../../components/locations/LocationMap"
import LocationCard from "../../components/locations/LocationCard"
import LocationFilter from "../../components/locations/LocationFilter"

// REMOVE THIS:
// import { locationData } from "../../data/location-data"

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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Our Locations</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map((location: any) => (
            <div key={location.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-2">{location.name}</h3>
              <p className="text-gray-600">{location.address}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
