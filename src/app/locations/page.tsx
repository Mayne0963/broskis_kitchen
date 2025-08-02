import type { Metadata } from "next"
import Image from "next/image"
import LocationsClientPage from "./LocationsClientPage"
import { locationData } from "../../data/location-data"

export const metadata: Metadata = {
  title: "Locations | Broski's Kitchen",
  description: "Find a Broski's Kitchen location near you. View our restaurant locations, hours, and features.",
}

export default function LocationsPage() {
  return (
    <div>
      <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden">
        <Image
          src="/images/LocationsHero.png"
          alt="Broski's Kitchen Locations"
          fill
          style={{ objectFit: "cover" }}
          priority
          className="brightness-75"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Our Locations</h1>
          <p className="text-xl md:text-2xl">Find a Broski's Kitchen Near You</p>
        </div>
      </div>
      <LocationsClientPage locations={locationData} />
    </div>
  )
}
