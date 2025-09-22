"use client"

import { useState, useEffect, useMemo } from "react"
import type { Metadata } from "next"

// Note: Metadata export for client components is handled by layout.tsx
// This page uses the template from root layout: "%s | Broski's Kitchen"
import Image from "next/image"
import { useCart } from "../../lib/context/CartContext"
import { useAgeVerification } from "../../lib/context/AgeVerificationContext"
import { FaSearch, FaFilter, FaStar, FaFire, FaLeaf } from "react-icons/fa"
import AgeVerificationModal from "../../components/modals/AgeVerificationModal"
import MenuItemCard from "../../components/menu/MenuItemCard"
import CategoryFilter from "../../components/menu/CategoryFilter"
import { categories } from "../../data/menu-data"
import { getVisibleMenuItems, shouldShowTestItems } from "../../utils/menuUtils"
import type { CustomizationOption } from "../../types"
import { GridSkeleton, EmptyState, SearchLoading } from "../../components/common/LoadingStates"
import { LoadingOverlay, useLoadingState } from "../../components/common/EnhancedLoadingStates"

export default function MenuPage() {
  const { addItem } = useCart()
  const { ageVerified } = useAgeVerification()
  const [showAgeModal, setShowAgeModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Get visible menu items based on environment and query params
  const visibleMenuItems = useMemo(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      return getVisibleMenuItems(searchParams)
    }
    return getVisibleMenuItems()
  }, [])
  
  // Hero Image Section
  const heroSection = (
    <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden">
      <Image
        src="/images/menu-hero.svg"
        alt="Broski's Kitchen Menu Hero"
        fill
        style={{ objectFit: "cover" }}
        priority
        className="brightness-75"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">Our Menu</h1>
        <p className="text-xl md:text-2xl">Discover Our Delicious Offerings</p>
      </div>
    </div>
  )
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
  const { isLoading: isSearching, withLoading } = useLoadingState()
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Filter items based on search, category, price, and dietary preferences
  const filteredItems = useMemo(() => {
    return visibleMenuItems.filter((item) => {
      // Filter by category
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Filter by price range
      const price = typeof item.price === 'string' 
        ? Number.parseFloat(item.price.replace("$", ""))
        : item.price
      if (price < priceRange[0] || price > priceRange[1]) {
        return false
      }

      // Filter by dietary preferences
      if (dietaryFilters.vegetarian && !item.dietary?.vegetarian) {
        return false
      }
      if (dietaryFilters.vegan && !item.dietary?.vegan) {
        return false
      }
      if (dietaryFilters.glutenFree && !item.dietary?.glutenFree) {
        return false
      }
      if (dietaryFilters.dairyFree && !item.dietary?.dairyFree) {
        return false
      }

      return true
    })
  }, [visibleMenuItems, searchQuery, selectedCategory, priceRange, dietaryFilters])

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
                    aria-label="Price range filter"
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
          <LoadingOverlay isLoading={isInitialLoading} message="Loading menu items...">
            {isSearching && <SearchLoading />}
            
            {!isInitialLoading && !isSearching && (
              <>
                {/* Regular Menu Items */}
                {filteredItems.filter(item => !item.isTestItem).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredItems.filter(item => !item.isTestItem).map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        onAddToCart={(quantity, customizations) => handleAddToCart(item, quantity, customizations)}
                      />
                    ))}
                  </div>
                ) : (
                  !filteredItems.some(item => item.isTestItem) && (
                    <EmptyState
                      title="No items found"
                      description="No menu items match your current filters. Try adjusting your search criteria."
                      action={
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
                      }
                    />
                  )
                )}

                {/* Test Items Section */}
                {filteredItems.some(item => item.isTestItem) && (
                  <div className="mt-16">
                    <div className="flex items-center gap-3 mb-8">
                      <h2 className="text-2xl font-bold">Test Products</h2>
                      <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        TEST
                      </div>
                      <div className="text-sm text-gray-400">
                        (Internal Testing Only)
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {filteredItems.filter(item => item.isTestItem).map((item) => (
                        <div key={item.id} className="relative">
                          <div className="absolute -top-2 -right-2 z-10 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                            TEST
                          </div>
                          <MenuItemCard
                            item={item}
                            onAddToCart={(quantity, customizations) => handleAddToCart(item, quantity, customizations)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            
            {isInitialLoading && <GridSkeleton count={6} />}
          </LoadingOverlay>
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
