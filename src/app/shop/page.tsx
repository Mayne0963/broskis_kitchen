"use client"

// Note: Metadata export for client components is handled by layout.tsx
// This page uses the template from root layout: "%s | Broski's Kitchen"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useCart } from "@/lib/context/CartContext"
import { FaSearch, FaFilter } from "react-icons/fa"
import ProductCard from "@/components/shop/ProductCard"
import CategoryFilter from "@/components/shop/CategoryFilter"
import ProductQuickView from "@/components/shop/ProductQuickView"
import Newsletter from "@/components/shop/Newsletter"
import { products, categories } from "@/data/merch-data"
import type { Product } from "@/types/merch"

// Import new design system components
import { Container } from "@/components/atoms/Grid"
import { Typography } from "@/components/atoms/Typography"
import { Button } from "@/components/atoms/Button"
import { Card } from "@/components/atoms/Card"
import { Grid, Stack } from "@/components/atoms/Grid"
import { Input } from "@/components/atoms/Input"
import { Select } from "@/components/atoms/Select"
import { FormField, Label } from "@/components/molecules/FormField"

export default function ShopPage() {
  const { addItem } = useCart()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [filteredProducts, setFilteredProducts] = useState(products)
  const [showFilters, setShowFilters] = useState(false)
  const [priceRange, setPriceRange] = useState([0, 100])
  const [sortOption, setSortOption] = useState("featured")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showQuickView, setShowQuickView] = useState(false)

  // Filter products based on selected category, search query, and filters
  useEffect(() => {
    let filtered = [...products]

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((product) => product.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (product) => product.name.toLowerCase().includes(query) || product.description.toLowerCase().includes(query),
      )
    }

    // Filter by price range
    filtered = filtered.filter((product) => product.price >= priceRange[0] && product.price <= priceRange[1])

    // Sort products
    switch (sortOption) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price)
        break
      case "price-high":
        filtered.sort((a, b) => b.price - a.price)
        break
      case "newest":
        filtered.sort((a, b) => (a.new === b.new ? 0 : a.new ? -1 : 1))
        break
      case "bestselling":
        filtered.sort((a, b) => (a.bestseller === b.bestseller ? 0 : a.bestseller ? -1 : 1))
        break
      default: // featured
        filtered.sort((a, b) => (a.featured === b.featured ? 0 : a.featured ? -1 : 1))
    }

    setFilteredProducts(filtered)
  }, [selectedCategory, searchQuery, priceRange, sortOption])

  // Handle adding item to cart
  const handleAddToCart = (product: Product, quantity = 1) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      image: product.images[0],
    })
  }

  // Handle quick view
  const handleQuickView = (product: Product) => {
    setSelectedProduct(product)
    setShowQuickView(true)
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section - Using new design system */}
      <section className="relative h-[40vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/shopHero.svg"
            alt="Shop Hero"
            fill
            className="object-cover"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        </div>
        <Container className="relative z-10 text-center">
          <Stack direction="column" gap="md" alignment="center">
            <Typography variant="hero" className="text-white">
              Official Merch
            </Typography>
            <Typography variant="h5" className="text-[var(--color-brand-gold)] max-w-2xl">
              Rep the brand with our exclusive collection of Broski's Kitchen apparel and accessories.
            </Typography>
          </Stack>
        </Container>
      </section>

      {/* Featured Products Section - Using new design system */}
      <section className="py-12 bg-[var(--color-background-subtle)]">
        <Container>
          <Stack direction="column" gap="xl">
            <Typography variant="h3" className="text-center">
              Featured Collection
            </Typography>
            <Grid cols={1} md={2} lg={4} gap="lg">
              {products
                .filter((product) => product.featured)
                .slice(0, 4)
                .map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={() => handleAddToCart(product)}
                    onQuickView={() => handleQuickView(product)}
                  />
                ))}
            </Grid>
          </Stack>
        </Container>
      </section>

      {/* Search and Filter Section - Using new design system */}
      <section className="bg-[var(--color-background-elevated)] py-8 sticky top-20 z-30 border-b border-[var(--color-border-subtle)]">
        <Container>
          <Stack direction="column" gap="lg">
            <Grid cols={1} md={4} gap="md" alignment="end">
              {/* Search Bar */}
              <FormField>
                <Label htmlFor="shop-search" className="sr-only">Search merchandise</Label>
                <Input
                  id="shop-search"
                  type="text"
                  placeholder="Search merchandise..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  startIcon={<FaSearch className="text-[var(--color-brand-gold)]" />}
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

              {/* Sort Dropdown */}
              <FormField>
                <Label htmlFor="sort-select">Sort by</Label>
                <Select
                  id="sort-select"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  options={[
                    { value: 'featured', label: 'Featured' },
                    { value: 'price-low', label: 'Price: Low to High' },
                    { value: 'price-high', label: 'Price: High to Low' },
                    { value: 'newest', label: 'Newest' },
                    { value: 'bestselling', label: 'Best Selling' },
                  ]}
                />
              </FormField>

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
                        max="100"
                        step="5"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number.parseInt(e.target.value)])}
                        aria-label="Price range filter"
                      />
                    </FormField>

                    {/* Additional Filters */}
                    <div>
                      <Typography variant="h6" className="mb-4">Product Status</Typography>
                      <Grid cols={2} md={4} gap="md">
                        {['New Arrivals', 'Best Sellers', 'On Sale', 'Limited Edition'].map((filter) => (
                          <FormField key={filter}>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Input type="checkbox" className="rounded" />
                              <Typography variant="body-sm">{filter}</Typography>
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

      {/* Products Grid Section - Using new design system */}
      <section className="py-12">
        <Container>
          <Stack direction="column" gap="xl">
            <Stack direction="row" gap="md" alignment="center" justify="between">
              <Typography variant="h3">All Products</Typography>
              <Typography variant="body" className="text-[var(--color-brand-gold)]">
                {filteredProducts.length} {filteredProducts.length === 1 ? "Product" : "Products"}
              </Typography>
            </Stack>

            {filteredProducts.length > 0 ? (
              <Grid cols={1} md={3} lg={4} gap="lg">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={() => handleAddToCart(product)}
                    onQuickView={() => handleQuickView(product)}
                  />
                ))}
              </Grid>
            ) : (
              <Card variant="elevated" className="text-center py-20">
                <Card.Content>
                  <Stack direction="column" gap="md" alignment="center">
                    <Typography variant="h4">No products found</Typography>
                    <Typography variant="body" className="text-[var(--color-text-secondary)]">
                      Try adjusting your filters or search query
                    </Typography>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setSelectedCategory("all")
                        setSearchQuery("")
                        setPriceRange([0, 100])
                        setSortOption("featured")
                      }}
                    >
                      Reset Filters
                    </Button>
                  </Stack>
                </Card.Content>
              </Card>
            )}
          </Stack>
        </Container>
      </section>

      {/* About Our Merch Section - Using new design system */}
      <section className="py-16 bg-[var(--color-background-subtle)]">
        <Container>
          <Grid cols={1} md={2} gap="xl" alignment="center">
            <Stack direction="column" gap="md">
              <Typography variant="h3">About Our Merch</Typography>
              <Typography variant="body" className="text-[var(--color-text-secondary)]">
                At Broski's Kitchen, we believe in quality that matches our food. Our merchandise is crafted with
                premium materials and designed to last, just like the memories you make in our restaurants.
              </Typography>
              <Typography variant="body" className="text-[var(--color-text-secondary)]">
                Each piece is designed in-house and produced in limited quantities to ensure exclusivity. We partner
                with sustainable manufacturers who share our values of quality and responsibility.
              </Typography>
              <Typography variant="body" className="text-[var(--color-text-secondary)]">
                From comfortable tees to stylish accessories, our merch lets you take a piece of the Broski's
                experience home with you.
              </Typography>
            </div>
            
            <Grid cols={2} gap="md">
              <div className="aspect-square relative rounded-lg overflow-hidden">
                <Image
                  src="/images/menu-1.svg"
                  alt="Broski's Kitchen Merchandise"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="aspect-square relative rounded-lg overflow-hidden">
                <Image
                  src="/images/menu-2.svg"
                  alt="Broski's Kitchen Merchandise"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="aspect-square relative rounded-lg overflow-hidden">
                <Image
                  src="/images/menu-3.svg"
                  alt="Broski's Kitchen Merchandise"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="aspect-square relative rounded-lg overflow-hidden">
                <Image
                  src="/images/hero-bg.svg"
                  alt="Broski's Kitchen Merchandise"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </Grid>
          </Grid>
        </Container>
      </section>

      {/* Newsletter Section - Using new design system */}
      <section className="py-16 bg-[var(--color-background)] relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-brand-gold-transparent)] to-[var(--color-brand-burgundy-transparent)] opacity-20"></div>
        <Container className="relative z-10">
          <Newsletter />
        </Container>
      </section>

      {/* Product Quick View Modal */}
      {selectedProduct && showQuickView && (
        <ProductQuickView
          product={selectedProduct}
          onClose={() => setShowQuickView(false)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  )
}
