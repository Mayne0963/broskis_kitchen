"use client"

import React, { useState, useEffect } from "react"
import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaTicketAlt,
  FaTimes,
  FaUserFriends,
  FaUtensils,
  FaGlassMartiniAlt,
  FaMusic,
} from "react-icons/fa"
import type { Event } from "@/types/event"

interface EventDetailModalProps {
  event: Event
  categoryName: string
  onClose: () => void
  onRegister: () => void
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, categoryName, onClose, onRegister }) => {
  const [isPast, setIsPast] = useState(false)

  useEffect(() => {
    setIsPast(new Date(event.date) < new Date())
  }, [event.date])

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  // Check if event is sold out
  const isSoldOut = event.capacity <= event.registered

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-[#1A1A1A] rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fade-in">
        <div className="relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            aria-label="Close"
          >
            <FaTimes />
          </button>

          {/* Event image */}
          <div className="h-64 bg-cover bg-center relative" style={{ backgroundImage: `url(${event.image})` }}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] to-transparent"></div>

            {/* Category Badge */}
            <div className="absolute top-4 left-4">
              <span className="bg-[#333333] text-white text-xs px-3 py-1 rounded-full">{categoryName}</span>
            </div>

            {/* Status Badges */}
            <div className="absolute top-4 right-16 flex gap-2">
              {event.featured && (
                <span className="bg-gold-foil text-black text-xs font-bold px-3 py-1 rounded-full">FEATURED</span>
              )}
              {isSoldOut && (
                <span className="bg-blood-red text-white text-xs font-bold px-3 py-1 rounded-full">SOLD OUT</span>
              )}
              {isPast && (
                <span className="bg-[#555555] text-white text-xs font-bold px-3 py-1 rounded-full">PAST EVENT</span>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-16rem)]">
          <h2 className="text-2xl font-bold mb-4">{event.title}</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="space-y-3">
              <div className="flex items-center text-gray-300">
                <FaCalendarAlt className="mr-2 text-gold-foil flex-shrink-0" />
                <span>{formatDate(event.date)}</span>
              </div>

              <div className="flex items-center text-gray-300">
                <FaClock className="mr-2 text-gold-foil flex-shrink-0" />
                <span>{event.time}</span>
              </div>

              <div className="flex items-center text-gray-300">
                <FaMapMarkerAlt className="mr-2 text-gold-foil flex-shrink-0" />
                <span>{event.location.name}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-gray-300">
                <FaTicketAlt className="mr-2 text-gold-foil flex-shrink-0" />
                <span>${event.price.toFixed(2)} per person</span>
              </div>

              <div className="flex items-center text-gray-300">
                <FaUserFriends className="mr-2 text-gold-foil flex-shrink-0" />
                <span>{isSoldOut ? "Sold Out" : `${event.registered}/${event.capacity} registered`}</span>
              </div>
            </div>

            <div className="space-y-3">
              {event.features.map((feature, index) => (
                <div key={index} className="flex items-center text-gray-300">
                  {feature.includes("Food") && <FaUtensils className="mr-2 text-gold-foil flex-shrink-0" />}
                  {feature.includes("Drink") && <FaGlassMartiniAlt className="mr-2 text-gold-foil flex-shrink-0" />}
                  {feature.includes("Music") && <FaMusic className="mr-2 text-gold-foil flex-shrink-0" />}
                  {!feature.includes("Food") && !feature.includes("Drink") && !feature.includes("Music") && (
                    <span className="w-2 h-2 bg-gold-foil rounded-full mr-2 flex-shrink-0"></span>
                  )}
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">About This Event</h3>
            <p className="text-gray-300 whitespace-pre-line">{event.description}</p>
          </div>

          {event.schedule && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Event Schedule</h3>
              <ul className="space-y-2">
                {event.schedule.map((item, index) => (
                  <li key={index} className="flex">
                    <span className="text-gold-foil font-medium mr-3">{item.time}</span>
                    <span className="text-gray-300">{item.activity}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {event.host && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Event Host</h3>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-[#333333] overflow-hidden mr-3">
                  {event.host.image && (
                    <img
                      src={event.host.image || "/placeholder.svg"}
                      alt={event.host.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <p className="font-medium">{event.host.name}</p>
                  <p className="text-sm text-gray-400">{event.host.title}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-[#111111] border-t border-[#333333]">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button className="btn-outline" onClick={onClose}>
              Close
            </button>

            {!isPast && (
              <button className="btn-primary" onClick={onRegister} disabled={isSoldOut}>
                {isSoldOut ? "Sold Out" : "Register Now"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventDetailModal
