"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useCart } from "../../lib/context/CartContext"
import { useAgeVerification } from "../../lib/context/AgeVerificationContext"
import { FaSearch, FaFilter, FaStar, FaFire, FaLeaf } from "react-icons/fa"
import AgeVerificationModal from "../../components/modals/AgeVerificationModal"
import MenuItemCard from "../../components/menu/MenuItemCard"
import CategoryFilter from "../../components/menu/CategoryFilter"
import { menuItems, categories } from "../../data/menu-data"
import type { CustomizationOption } from "../../types"

export default function MenuPage() {
  const { addItem } = useCart()
  const { ageVerified } = useAgeVerification()
  const [showAgeModal, setShowAgeModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredItems, setFilteredItems] = useState(menuItems)
  const [showFilters, setShowFilters] = useState(false)
  const [priceRange, setPriceRange] = useState([0, 50])
  const [dietaryFilters, setDietaryFilters] = useState({
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    dairyFree: false,
  })
  const [pendingItem, setPendingItem] = useState<any>(null)
  const [pendingQuantity, setPendingQuantity] = useState(1)
  const [pendingCustomizations, setPendingCustomizations] = useState<
    { [categoryId: string]: CustomizationOption[] } | undefined
  >(undefined)

  // Filter menu items based on selected category, search query, and filters
  useEffect(() => {
    let filtered = [...menuItems]

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) => item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query),
      )
    }

    // Filter by price range
    filtered = filtered.filter((item) => item.price >= priceRange[0] && item.price <= priceRange[1])

    // Filter by dietary preferences
    if (dietaryFilters.vegetarian) {
      filtered = filtered.filter((item) => item.dietary?.vegetarian)
    }
    if (dietaryFilters.vegan) {
      filtered = filtered.filter((item) => item.dietary?.vegan)
    }
    if (dietaryFilters.glutenFree) {
      filtered = filtered.filter((item) => item.dietary?.glutenFree)
    }
    if (dietaryFilters.dairyFree) {
      filtered = filtered.filter((item) => item.dietary?.dairyFree)
    }

    setFilteredItems(filtered)
  }, [selectedCategory, searchQuery, priceRange, dietaryFilters])

  // Handle adding item to cart
  const handleAddToCart = (
    item: any,
    quantity = 1,
    customizations?: { [categoryId: string]: CustomizationOption[] },
  ) => {
    if (item.infused && !ageVerified) {
      // Store the pending item details for after verification
      setPendingItem(item)
      setPendingQuantity(quantity)
      setPendingCustomizations(customizations)
      setShowAgeModal(true)
      return
    }

    // Calculate additional price from customizations
    let additionalPrice = 0
    if (customizations) {
      Object.values(customizations).forEach((options) => {
        options.forEach((option) => {
          additionalPrice += option.price
        })
      })
    }

    // Create customization summary for item name
    let customizationSummary = ""
    if (customizations && Object.keys(customizations).length > 0) {
      const optionNames: string[] = []
      Object.values(customizations).forEach((options) => {
        options.forEach((option) => {
          if (option.price > 0) {
            optionNames.push(`${option.name} (+$${option.price.toFixed(2)})`)
          } else {
            optionNames.push(option.name)
          }
        })
      })

      if (optionNames.length > 0) {
        customizationSummary = ` (${optionNames.join(", ")})`
      }
    }

    addItem({
      id: item.id + (customizationSummary ? `-${Date.now()}` : ""), // Make unique ID for customized items
      name: item.name + customizationSummary,
      price: item.price + additionalPrice,
      quantity: quantity,
      image: item.image,
      customizations: customizations,
    })
  }

  // Handle age verification success
  const handleVerificationSuccess = () => {
    setShowAgeModal(false)

    // Process the pending item if it exists
    if (pendingItem) {
      handleAddToCart(pendingItem, pendingQuantity, pendingCustomizations)

      // Clear pending item
      setPendingItem(null)
      setPendingQuantity(1)
      setPendingCustomizations(undefined)
    }
  }

  // Handle dietary filter changes
  const handleDietaryFilterChange = (filter: string) => {
    setDietaryFilters((prev) => ({
      ...prev,
      [filter]: !prev[filter],
    }))
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative h-[40vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image src="/images/menu-hero.svg" alt="Broski's Kitchen Menu" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        </div>
        <div className="container mx-auto px-4 z-10 text-center">
          <h1 className="heading-xl mb-4 text-white gritty-shadow">Our Menu</h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Discover our luxury street gourmet dishes, crafted with premium ingredients and innovative techniques.
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
                placeholder="Search menu..."
                className="input w-full pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            {/* Category Filter */}
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />

            {/* Advanced Filters Toggle */}
            <button className="btn-outline flex items-center gap-2" onClick={() => setShowFilters(!showFilters)}>
              <FaFilter /> {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 p-4 bg-[#1A1A1A] rounded-lg border border-[#333333] animate-fade-in">
              <h3 className="text-lg font-bold mb-4">Filters</h3>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-2">
                  Price Range: ${priceRange[0]} - ${priceRange[1]}
                </h4>
                <div className="flex items-center gap-4">
                  <span className="text-xs">${priceRange[0]}</span>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number.parseInt(e.target.value)])}
                    className="w-full h-2 bg-[#333333] rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs">${priceRange[1]}</span>
                </div>
              </div>

              {/* Dietary Preferences */}
              <div>
                <h4 className="text-sm font-medium mb-2">Dietary Preferences</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dietaryFilters.vegetarian}
                      onChange={() => handleDietaryFilterChange("vegetarian")}
                      className="rounded border-[#333333] text-gold-foil focus:ring-gold-foil"
                    />
                    <span className="text-sm">Vegetarian</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dietaryFilters.vegan}
                      onChange={() => handleDietaryFilterChange("vegan")}
                      className="rounded border-[#333333] text-gold-foil focus:ring-gold-foil"
                    />
                    <span className="text-sm">Vegan</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dietaryFilters.glutenFree}
                      onChange={() => handleDietaryFilterChange("glutenFree")}
                      className="rounded border-[#333333] text-gold-foil focus:ring-gold-foil"
                    />
                    <span className="text-sm">Gluten Free</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dietaryFilters.dairyFree}
                      onChange={() => handleDietaryFilterChange("dairyFree")}
                      className="rounded border-[#333333] text-gold-foil focus:ring-gold-foil"
                    />
                    <span className="text-sm">Dairy Free</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Menu Items Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onAddToCart={(quantity, customizations) => handleAddToCart(item, quantity, customizations)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-2xl font-bold mb-4">No items found</h3>
              <p className="text-gray-400 mb-6">Try adjusting your filters or search query</p>
              <button
                className="btn-primary"
                onClick={() => {
                  setSelectedCategory("all")
                  setSearchQuery("")
                  setPriceRange([0, 50])
                  setDietaryFilters({
                    vegetarian: false,
                    vegan: false,
                    glutenFree: false,
                    dairyFree: false,
                  })
                }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Legend Section */}
      <section className="py-8 bg-[#111111]">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold mb-4">Menu Legend</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gold-foil bg-opacity-20 flex items-center justify-center">
                <FaStar className="text-gold-foil" />
              </div>
              <span>Popular Item</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blood-red bg-opacity-20 flex items-center justify-center">
                <FaFire className="text-blood-red" />
              </div>
              <span>New Item</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-green bg-opacity-20 flex items-center justify-center">
                <FaLeaf className="text-emerald-green" />
              </div>
              <span>Infused Item (21+ Only)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Age Verification Modal */}
      {showAgeModal && (
        <AgeVerificationModal onClose={() => setShowAgeModal(false)} onSuccess={handleVerificationSuccess} />
      )}
    </div>
  )
}
