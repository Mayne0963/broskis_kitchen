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

  // Everything else stays the same in your return JSX
}
