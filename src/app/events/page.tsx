"use client"

import { useState, useEffect } from "react"
import { FaSearch, FaCalendarAlt, FaFilter, FaMapMarkerAlt, FaClock, FaTicketAlt } from "react-icons/fa"
import EventCard from "../../components/events/EventCard"
import EventFilter from "../../components/events/EventFilter"
import EventDetailModal from "../../components/events/EventDetailModal"
import RegistrationModal from "../../components/events/RegistrationModal"
import { events, categories, locations } from "../../data/event-data"
import type { Event } from "../../types/event"

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [timeFrame, setTimeFrame] = useState("upcoming")
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Filter events based on search query, category, location, and time frame
  useEffect(() => {
    let filtered = [...events]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.location.name.toLowerCase().includes(query),
      )
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((event) => event.category === selectedCategory)
    }

    // Filter by location
    if (selectedLocation !== "all") {
      filtered = filtered.filter((event) => event.location.id === selectedLocation)
    }

    // Filter by time frame
    const now = new Date()
    if (timeFrame === "upcoming") {
      filtered = filtered.filter((event) => new Date(event.date) >= now)
    } else if (timeFrame === "past") {
      filtered = filtered.filter((event) => new Date(event.date) < now)
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return timeFrame === "upcoming" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
    })

    setFilteredEvents(filtered)
  }, [searchQuery, selectedCategory, selectedLocation, timeFrame])

  // Handle event selection
  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event)
    setShowDetailModal(true)
  }

  // Handle registration
  const handleRegister = (event: Event) => {
    setSelectedEvent(event)
    setShowDetailModal(false)
    setShowRegistrationModal(true)
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative h-[40vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-black">
          <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent opacity-70 z-10"></div>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/events-hero.jpg')" }}
          ></div>
        </div>
        <div className="container mx-auto px-4 z-10 text-center">
          <h1 className="heading-xl mb-4 text-white gritty-shadow">Events & Experiences</h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Join us for exclusive tastings, chef workshops, and special dining experiences.
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
                placeholder="Search events..."
                className="input w-full pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search events"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            {/* Time Frame Toggle */}
            <div className="flex rounded-full bg-[#1A1A1A] p-1">
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  timeFrame === "upcoming" ? "bg-gold-foil text-black" : "text-white hover:bg-[#333333]"
                }`}
                onClick={() => setTimeFrame("upcoming")}
              >
                Upcoming
              </button>
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  timeFrame === "past" ? "bg-gold-foil text-black" : "text-white hover:bg-[#333333]"
                }`}
                onClick={() => setTimeFrame("past")}
              >
                Past Events
              </button>
            </div>

            {/* Advanced Filters Toggle */}
            <button
              className="btn-outline flex items-center gap-2"
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
              aria-controls="advanced-filters"
            >
              <FaFilter /> {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div
              id="advanced-filters"
              className="mt-6 p-4 bg-[#1A1A1A] rounded-lg border border-[#333333] animate-fade-in"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category Filter */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Event Type</h3>
                  <EventFilter
                    items={categories}
                    selectedItem={selectedCategory}
                    setSelectedItem={setSelectedCategory}
                  />
                </div>

                {/* Location Filter */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Location</h3>
                  <EventFilter
                    items={locations}
                    selectedItem={selectedLocation}
                    setSelectedItem={setSelectedLocation}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Event Section (only show for upcoming events) */}
      {timeFrame === "upcoming" &&
        events.filter((event) => event.featured && new Date(event.date) >= new Date()).length > 0 && (
          <section className="py-12 bg-black">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold mb-8 text-center">Featured Event</h2>

              {events
                .filter((event) => event.featured && new Date(event.date) >= new Date())
                .slice(0, 1)
                .map((event) => (
                  <div
                    key={event.id}
                    className="bg-gradient-to-r from-[#1A1A1A] to-[#111111] rounded-lg overflow-hidden shadow-lg border border-gold-foil"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      <div
                        className="h-64 md:h-auto bg-cover bg-center"
                        style={{ backgroundImage: `url(${event.image})` }}
                      ></div>
                      <div className="p-6 md:p-8 flex flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="bg-gold-foil text-black text-xs font-bold px-3 py-1 rounded-full">
                              FEATURED
                            </span>
                            <span className="bg-[#333333] text-white text-xs px-3 py-1 rounded-full">
                              {categories.find((c) => c.id === event.category)?.name}
                            </span>
                          </div>
                          <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
                          <div className="flex items-center text-gray-400 mb-2">
                            <FaCalendarAlt className="mr-2 text-gold-foil" />
                            <span>
                              {new Date(event.date).toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center text-gray-400 mb-2">
                            <FaClock className="mr-2 text-gold-foil" />
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-center text-gray-400 mb-4">
                            <FaMapMarkerAlt className="mr-2 text-gold-foil" />
                            <span>{event.location.name}</span>
                          </div>
                          <p className="text-gray-300 mb-6">{event.description.substring(0, 150)}...</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            className="btn-primary flex items-center justify-center gap-2"
                            onClick={() => handleRegister(event)}
                          >
                            <FaTicketAlt /> Register Now
                          </button>
                          <button
                            className="btn-outline flex items-center justify-center gap-2"
                            onClick={() => handleEventSelect(event)}
                          >
                            Learn More
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

      {/* Events Grid Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">{timeFrame === "upcoming" ? "Upcoming Events" : "Past Events"}</h2>
            <div className="text-sm text-gray-400">
              {filteredEvents.length} {filteredEvents.length === 1 ? "Event" : "Events"} Found
            </div>
          </div>

          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onSelect={handleEventSelect}
                  onRegister={handleRegister}
                  categoryName={categories.find((c) => c.id === event.category)?.name || ""}
                  isPast={timeFrame === "past"}
                />
              ))}
            </div>
          ) : (
            <div className="bg-[#1A1A1A] rounded-lg p-8 text-center">
              <FaCalendarAlt className="text-4xl text-gold-foil mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Events Found</h3>
              <p className="text-gray-400 mb-4">We couldn&apos;t find any events matching your search criteria.</p>
              <button
                className="btn-primary"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("all")
                  setSelectedLocation("all")
                }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Host Your Own Event Section */}
      <section className="py-16 bg-black relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/20 to-[#880808]/20 opacity-50"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="heading-lg mb-4 gritty-shadow">Host Your Own Event</h2>
            <p className="text-gray-300 mb-8">
              Looking for a unique venue for your next private event? Broski&apos;s Kitchen offers custom catering and
              private dining experiences for corporate events, birthdays, anniversaries, and more.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="/private-events" className="btn-primary">
                Private Events
              </a>
              <a href="/catering" className="btn-outline">
                Catering Services
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Event Newsletter Section */}
      <section className="py-12 bg-[#111111]">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Stay Updated</h2>
            <p className="text-gray-300 mb-6">
              Subscribe to our newsletter to get notified about upcoming events and exclusive offers.
            </p>
            <form className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Your email address"
                className="input flex-grow"
                aria-label="Email address"
              />
              <button type="submit" className="btn-primary whitespace-nowrap">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Event Detail Modal */}
      {selectedEvent && showDetailModal && (
        <EventDetailModal
          event={selectedEvent}
          categoryName={categories.find((c) => c.id === selectedEvent.category)?.name || ""}
          onClose={() => setShowDetailModal(false)}
          onRegister={() => {
            setShowDetailModal(false)
            setShowRegistrationModal(true)
          }}
        />
      )}

      {/* Registration Modal */}
      {selectedEvent && showRegistrationModal && (
        <RegistrationModal event={selectedEvent} onClose={() => setShowRegistrationModal(false)} />
      )}
    </div>
  )
}
