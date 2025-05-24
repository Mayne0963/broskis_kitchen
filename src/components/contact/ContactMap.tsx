"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import type { Location } from "../../types/location"

interface ContactMapProps {
  locations: Location[]
}

const ContactMap: React.FC<ContactMapProps> = ({ locations }) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)

  // Calculate center point of all locations
  const calculateCenter = () => {
    if (locations.length === 0) return { lat: 37.0902, lng: -95.7129 } // Default to US center

    const totalLat = locations.reduce((sum, loc) => sum + loc.coordinates.lat, 0)
    const totalLng = locations.reduce((sum, loc) => sum + loc.coordinates.lng, 0)

    return {
      lat: totalLat / locations.length,
      lng: totalLng / locations.length,
    }
  }

  useEffect(() => {
    // Load Google Maps script
    const loadGoogleMapsScript = () => {
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places`
      script.async = true
      script.defer = true
      script.onload = initializeMap
      document.head.appendChild(script)
    }

    // Initialize map
    const initializeMap = () => {
      if (!mapRef.current) return

      const center = calculateCenter()

      // Create map instance
      const mapOptions = {
        center: center,
        zoom: 5,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
          {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
          },
          {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
          },
          {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#263c3f" }],
          },
          {
            featureType: "poi.park",
            elementType: "labels.text.fill",
            stylers: [{ color: "#6b9a76" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#38414e" }],
          },
          {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#212a37" }],
          },
          {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9ca5b3" }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#746855" }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry.stroke",
            stylers: [{ color: "#1f2835" }],
          },
          {
            featureType: "road.highway",
            elementType: "labels.text.fill",
            stylers: [{ color: "#f3d19c" }],
          },
          {
            featureType: "transit",
            elementType: "geometry",
            stylers: [{ color: "#2f3948" }],
          },
          {
            featureType: "transit.station",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#17263c" }],
          },
          {
            featureType: "water",
            elementType: "labels.text.fill",
            stylers: [{ color: "#515c6d" }],
          },
          {
            featureType: "water",
            elementType: "labels.text.stroke",
            stylers: [{ color: "#17263c" }],
          },
        ],
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true,
      }

      const map = new window.google.maps.Map(mapRef.current, mapOptions)

      // Add markers for each location
      locations.forEach((location) => {
        const marker = new window.google.maps.Marker({
          position: { lat: location.coordinates.lat, lng: location.coordinates.lng },
          map: map,
          title: location.name,
          icon: {
            url: "/images/marker.png",
            scaledSize: new window.google.maps.Size(30, 40),
          },
        })

        // Create info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="color: #000; padding: 5px;">
              <h3 style="font-weight: bold; margin-bottom: 5px;">${location.name}</h3>
              <p style="margin: 0;">${location.address}, ${location.city}, ${location.state}</p>
              <p style="margin: 5px 0 0;"><a href="tel:${location.phone}" style="color: #D4AF37;">${location.phone}</a></p>
            </div>
          `,
        })

        // Add click event to marker
        marker.addListener("click", () => {
          // Close any open info windows
          infoWindow.close()

          // Open this info window
          infoWindow.open(map, marker)

          // Set selected location
          setSelectedLocation(location)
        })
      })
    }

    // Check if Google Maps script is already loaded
    if (window.google && window.google.maps) {
      initializeMap()
    } else {
      loadGoogleMapsScript()
    }
  }, [locations])

  return (
    <div className="w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      <div className="sr-only" aria-live="polite">
        {selectedLocation
          ? `Selected location: ${selectedLocation.name} at ${selectedLocation.address}, ${selectedLocation.city}, ${selectedLocation.state}`
          : "Map showing all Broski's Kitchen locations"}
      </div>
    </div>
  )
}

export default ContactMap
