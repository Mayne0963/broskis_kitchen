"use client"

import { useState } from "react"
import Image from "next/image"
import MenuItemCard from "../../components/menu/MenuItemCard"
import CategoryFilter from "../../components/menu/CategoryFilter"
import ComingSoonOverlay from "../../components/coming-soon/ComingSoonOverlay"
import { infusedMenuItems } from "../../data/menu-data"

export default function InfusedMenuPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showComingSoon] = useState(true) // Always show disclaimer

  // Get unique categories
  const categories = [
    { id: "all", name: "All" },
    ...Array.from(new Set(infusedMenuItems.map((item) => item.category))).map((category) => ({
      id: category,
      name: category.charAt(0).toUpperCase() + category.slice(1),
    })),
  ]

  // Filter items by selected category
  const filteredItems =
    selectedCategory === "all"
      ? infusedMenuItems
      : infusedMenuItems.filter((item) => item.category === selectedCategory)

  // Removed close functionality to keep disclaimer always open

  return (
    <div className="min-h-screen relative">
      {/* Coming Soon Overlay - Always Visible */}
      {showComingSoon && <ComingSoonOverlay onClose={() => {}} />}

      {/* Main Content (Blurred when Coming Soon is shown) */}
      <div className={`${showComingSoon ? "blur-sm" : ""} transition-all duration-300`}>
        {/* Hero Section */}
        <section className="relative h-[50vh] min-h-[400px]">
          <div className="absolute inset-0 z-0">
            <Image src="/images/infused-menu-hero.jpg" alt="Infused Menu" fill className="object-cover" priority />
            <div className="absolute inset-0 bg-black bg-opacity-60"></div>
          </div>
          <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
            <h1 className="heading-xl mb-4 text-white">Infused Menu</h1>
            <p className="text-xl text-gray-200 max-w-2xl">
              Explore our premium infused culinary creations, crafted for an elevated experience.
            </p>
          </div>
        </section>

        {/* Menu Section */}
        <section className="py-16 bg-[#111111]">
          <div className="container mx-auto px-4">
            <div className="mb-12">
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredItems.map((item) => (
                <MenuItemCard key={item.id} item={item} onAddToCart={() => {}} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
