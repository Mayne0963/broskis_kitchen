"use client"

import type React from "react"

interface FilterItem {
  id: string
  name: string
}

interface EventFilterProps {
  items: FilterItem[]
  selectedItem: string
  setSelectedItem: (id: string) => void
}

const EventFilter: React.FC<EventFilterProps> = ({ items, selectedItem, setSelectedItem }) => {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex space-x-2 min-w-max">
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedItem === "all" ? "bg-gold-foil text-black" : "bg-[#222222] text-white hover:bg-[#333333]"
          }`}
          onClick={() => setSelectedItem("all")}
        >
          All
        </button>

        {items.map((item) => (
          <button
            key={item.id}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedItem === item.id ? "bg-gold-foil text-black" : "bg-[#222222] text-white hover:bg-[#333333]"
            }`}
            onClick={() => setSelectedItem(item.id)}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export default EventFilter
