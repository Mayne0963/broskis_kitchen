"use client"

import type React from "react"

interface LocationFilterProps {
  states: string[]
  selectedState: string
  setSelectedState: (state: string) => void
}

const LocationFilter: React.FC<LocationFilterProps> = ({ states, selectedState, setSelectedState }) => {
  return (
    <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
      <div className="flex space-x-2 min-w-max">
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedState === "all" ? "bg-gold-foil text-black" : "bg-[#1A1A1A] text-white hover:bg-[#333333]"
          }`}
          onClick={() => setSelectedState("all")}
        >
          All States
        </button>

        {states.map((state) => (
          <button
            key={state}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedState === state ? "bg-gold-foil text-black" : "bg-[#1A1A1A] text-white hover:bg-[#333333]"
            }`}
            onClick={() => setSelectedState(state)}
          >
            {state}
          </button>
        ))}
      </div>
    </div>
  )
}

export default LocationFilter
