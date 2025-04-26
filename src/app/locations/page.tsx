import type { Metadata } from "next"
import LocationsClientPage from "./LocationsClientPage"
import { locationData } from "../../data/location-data"

export const metadata: Metadata = {
  title: "Locations | Broski's Kitchen",
  description: "Find a Broski's Kitchen location near you. View our restaurant locations, hours, and features.",
}

export default function LocationsPage() {
  return <LocationsClientPage locations={locationData} />
}
