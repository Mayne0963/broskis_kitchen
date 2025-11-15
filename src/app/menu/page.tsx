"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { useCart } from "@/lib/context/CartContext"
import { useAgeVerification } from "@/lib/context/AgeVerificationContext"
import { FaSearch, FaFilter, FaStar, FaFire, FaLeaf } from "react-icons/fa"
import AgeVerificationModal from "@/components/modals/AgeVerificationModal"
import MenuItemCard from "@/components/menu/MenuItemCard"
import CategoryFilter from "@/components/menu/CategoryFilter"
import { categories } from "@/data/menu-data"
import { getVisibleMenuItems, shouldShowTestItems } from "@/utils/menuUtils"
import type { CustomizationOption } from "@/types"
import { GridSkeleton, EmptyState, SearchLoading } from "@/components/common/LoadingStates"
import { LoadingOverlay, useLoadingState } from "@/components/common/EnhancedLoadingStates"

// Import new design system components
import { Container } from "@/components/atoms/Grid"
import { Typography } from "@/components/atoms/Typography"
import { Button } from "@/components/atoms/Button"
import { Card } from "@/components/atoms/Card"
import { Badge } from "@/components/atoms/Badge"
import { Grid, Stack } from "@/components/atoms/Grid"
import { Input } from "@/components/atoms/Input"
import { FormField, Label, HelperText } from "@/components/molecules/FormField"

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
    <div className="min-h-screen">
      {/* Hero Section - Using new design system */}
      <section className="relative h-[40vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/menu-hero.svg" 
            alt="Broski's Kitchen Menu" 
            fill 
            className="object-cover" 
            priority
            unoptimized 
          />
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        </div>
        <Container size="full" className="relative z-10 text-center">
          <Stack direction="column" gap="md" alignment="center">
            <Typography variant="hero" className="text-white">
              Our Menu
            </Typography>
            <Typography variant="h5" className="text-gray-200 max-w-2xl">
              Discover our luxury street gourmet dishes, crafted with premium ingredients and innovative techniques.
            </Typography>
          </Stack>
        </Container>
      </section>

      {/* Search and Filter Section - Using new design system */}
      <section className="bg-[var(--color-background-subtle)] py-8 sticky top-20 z-30 border-b border-[var(--color-border-subtle)]">
        <Container size="full">
          <Stack direction="column" gap="lg">
            <Grid cols={1} md={3} gap="md" alignment="center">
              {/* Search Bar */}
              <FormField>
                <Label htmlFor="menu-search" className="sr-only">Search menu</Label>
                <Input
                  id="menu-search"
                  type="text"
                  placeholder="Search menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  startIcon={<FaSearch className="text-[var(--color-text-secondary)]" />}
                />
              </FormField>

              {/* Category Filter */}
              <div className="w-full">
                <CategoryFilter
                  categories={categories}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                />
              </div>

              {/* Advanced Filters Toggle */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  startIcon={<FaFilter />}
                >
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </Button>
              </div>
            </Grid>

            {/* Advanced Filters */}
            {showFilters && (
              <Card variant="elevated" className="animate-fade-in">
                <Card.Content>
                  <Stack direction="column" gap="lg">
                    <Typography variant="h5">Filters</Typography>
                    
                    {/* Price Range */}
                    <FormField>
                      <Label htmlFor="price-range">Price Range: ${priceRange[0]} - ${priceRange[1]}</Label>
                      <Input
                        id="price-range"
                        type="range"
                        min="0"
                        max="50"
                        step="5"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number.parseInt(e.target.value)])}
                        aria-label="Price range filter"
                      />
                    </FormField>

                    {/* Dietary Preferences */}
                    <div>
                      <Typography variant="h6" className="mb-4">Dietary Preferences</Typography>
                      <Grid cols={2} md={4} gap="md">
                        {Object.entries(dietaryFilters).map(([key, value]) => (
                          <FormField key={key}>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Input
                                type="checkbox"
                                checked={value}
                                onChange={() => handleDietaryFilterChange(key)}
                                className="rounded"
                              />
                              <Typography variant="body">
                                {key === 'vegetarian' && 'Vegetarian'}
                                {key === 'vegan' && 'Vegan'}
                                {key === 'glutenFree' && 'Gluten Free'}
                                {key === 'dairyFree' && 'Dairy Free'}
                              </Typography>
                            </label>
                          </FormField>
                        ))}
                      </Grid>
                    </div>
                  </Stack>
                </Card.Content>
              </Card>
            )}
          </Stack>
        </Container>
      </section>

      {/* Menu Items Section - Using new design system */}
      <section className="py-12">
        <Container size="full">
          <LoadingOverlay isLoading={isInitialLoading} message="Loading menu items...">
            {isSearching && <SearchLoading />}
            
            {!isInitialLoading && !isSearching && (
              <Stack direction="column" gap="xl">
                {/* Regular Menu Items */}
                {filteredItems.filter(item => !item.isTestItem).length > 0 ? (
                  <Grid cols={3} md={3} lg={4} xl={5} gap="xl">
                    {filteredItems.filter(item => !item.isTestItem).map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        onAddToCart={(quantity, customizations) => handleAddToCart(item, quantity, customizations)}
                      />
                    ))}
                  </Grid>
                ) : (
                  !filteredItems.some(item => item.isTestItem) && (
                    <EmptyState
                      title="No items found"
                      description="No menu items match your current filters. Try adjusting your search criteria."
                      action={
                        <Button
                          variant="primary"
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
                        </Button>
                      }
                    />
                  )
                )}

                {/* Test Items Section */}
                {filteredItems.some(item => item.isTestItem) && (
                  <Stack direction="column" gap="md">
                    <Stack direction="row" gap="md" alignment="center">
                      <Typography variant="h4">Test Products</Typography>
                      <Badge variant="error">TEST</Badge>
                      <Typography variant="body-sm" className="text-[var(--color-text-secondary)]">
                        (Internal Testing Only)
                      </Typography>
                    </Stack>
                    <Grid cols={1} md={2} lg={3} gap="xl">
                      {filteredItems.filter(item => item.isTestItem).map((item) => (
                        <div key={item.id} className="relative">
                          <Badge variant="error" className="absolute -top-2 -right-2 z-10">
                            TEST
                          </Badge>
                          <MenuItemCard
                            item={item}
                            onAddToCart={(quantity, customizations) => handleAddToCart(item, quantity, customizations)}
                          />
                        </div>
                      ))}
                    </Grid>
                  </Stack>
                )}
              </Stack>
            )}
            
            {isInitialLoading && <GridSkeleton count={6} />}
          </LoadingOverlay>
        </Container>
      </section>

      {/* Legend Section - Using new design system */}
      <section className="py-8 bg-[var(--color-background-subtle)]">
        <Container size="full">
          <Stack direction="column" gap="md">
            <Typography variant="h4">Menu Legend</Typography>
            <Grid cols={1} md={3} gap="md">
              <Stack direction="row" gap="md" alignment="center">
                <Badge variant="gold" size="lg">
                  <FaStar />
                </Badge>
                <Typography variant="body">Popular Item</Typography>
              </Stack>
              
              <Stack direction="row" gap="md" alignment="center">
                <Badge variant="error" size="lg">
                  <FaFire />
                </Badge>
                <Typography variant="body">New Item</Typography>
              </Stack>
              
              <Stack direction="row" gap="md" alignment="center">
                <Badge variant="success" size="lg">
                  <FaLeaf />
                </Badge>
                <Typography variant="body">Infused Item (21+ Only)</Typography>
              </Stack>
            </Grid>
          </Stack>
        </Container>
      </section>

      {/* Age Verification Modal */}
      {showAgeModal && (
        <AgeVerificationModal onClose={() => setShowAgeModal(false)} onSuccess={handleVerificationSuccess} />
      )}
    </div>
  )
}
