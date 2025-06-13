"use client"

import type React from "react"

import { FaClock, FaMapMarkerAlt, FaTicketAlt, FaLock } from "react-icons/fa"
import type { Event } from "@/types/event"

interface EventCardProps {
  event: Event
  onSelect: (event: Event) => void
  onRegister: (event: Event) => void
  categoryName: string
  isPast: boolean
}

const EventCard: React.FC<EventCardProps> = ({ event, onSelect, onRegister, categoryName, isPast }) => {
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  // Check if event is sold out
  const isSoldOut = event.capacity <= event.registered

  return (
    <div className="bg-[#1A1A1A] rounded-lg overflow-hidden shadow-lg border border-[#333333] hover:border-[#555555] transition-colors">
      <div className="relative">
        <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${event.image})` }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-[#333333] text-white text-xs px-3 py-1 rounded-full">{categoryName}</span>
        </div>

        {/* Status Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {event.featured && (
            <span className="bg-gold-foil text-black text-xs font-bold px-3 py-1 rounded-full">FEATURED</span>
          )}
          {isSoldOut && (
            <span className="bg-blood-red text-white text-xs font-bold px-3 py-1 rounded-full">SOLD OUT</span>
          )}
          {!isSoldOut && event.capacity - event.registered <= 5 && !isPast && (
            <span className="bg-citrus-orange text-black text-xs font-bold px-3 py-1 rounded-full">ALMOST FULL</span>
          )}
        </div>

        {/* Date Badge */}
        <div className="absolute bottom-3 left-3 bg-black bg-opacity-70 text-white text-sm px-3 py-1 rounded">
          {formatDate(event.date)}
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-xl font-bold mb-3 line-clamp-2">{event.title}</h3>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-400">
            <FaClock className="mr-2 text-gold-foil flex-shrink-0" />
            <span>{event.time}</span>
          </div>

          <div className="flex items-center text-gray-400">
            <FaMapMarkerAlt className="mr-2 text-gold-foil flex-shrink-0" />
            <span>{event.location.name}</span>
          </div>

          {!isPast && (
            <div className="flex items-center text-gray-400">
              <FaTicketAlt className="mr-2 text-gold-foil flex-shrink-0" />
              <span>{isSoldOut ? "Sold Out" : `${event.registered}/${event.capacity} registered`}</span>
            </div>
          )}
        </div>

        <p className="text-gray-300 mb-4 line-clamp-2">{event.description}</p>

        <div className="flex gap-2">
          <button className="btn-outline flex-1 text-sm" onClick={() => onSelect(event)}>
            Details
          </button>

          {isPast ? (
            <button className="btn-secondary flex-1 text-sm flex items-center justify-center gap-1" disabled>
              <FaLock size={12} /> Past Event
            </button>
          ) : (
            <button className="btn-primary flex-1 text-sm" onClick={() => onRegister(event)} disabled={isSoldOut}>
              {isSoldOut ? "Sold Out" : "Register"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default EventCard
