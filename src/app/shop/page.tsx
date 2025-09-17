"use client"

// Note: Metadata export for client components is handled by layout.tsx
// This page uses the template from root layout: "%s | Broski's Kitchen"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useCart } from "../../lib/context/CartContext"
import { FaSearch, FaFilter } from "react-icons/fa"
import ProductCard from "../../components/shop/ProductCard"
import CategoryFilter from "../../components/shop/CategoryFilter"
import ProductQuickView from "../../components/shop/ProductQuickView"
import Newsletter from "../../components/shop/Newsletter"
import { products, categories } from "../../data/merch-data"
import type { Product } from "../../types/merch"

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
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative h-[40vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/shopHero.svg"
            alt="Shop Hero"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        </div>
        <div className="container mx-auto px-4 z-10 text-center">
          <h1 className="heading-xl mb-4 text-white gritty-shadow">Official Merch</h1>
          <p className="text-xl text-[#FFD700] max-w-2xl mx-auto">
            Rep the brand with our exclusive collection of Broski&apos;s Kitchen apparel and accessories.
          </p>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-12 bg-[#111111]">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Featured Collection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="bg-[#0A0A0A] py-8 sticky top-20 z-30 border-b border-[#333333]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Search Bar */}
            <div className="relative w-full md:w-1/3">
              <input
                type="text"
                placeholder="Search merchandise..."
                className="input w-full pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#FFD700]" />
            </div>

            {/* Category Filter */}
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />

            {/* Sort Dropdown */}
            <div className="relative w-full md:w-auto">
              <select
                className="input w-full appearance-none pr-10"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest</option>
                <option value="bestselling">Best Selling</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <FaFilter className="text-[#FFD700]" />
              </div>
            </div>

            {/* Advanced Filters Toggle */}
            <button className="btn-outline flex items-center gap-2" onClick={() => setShowFilters(!showFilters)}>
              <FaFilter /> {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 p-4 bg-black rounded-lg border border-[#FFD700] animate-fade-in">
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
                    max="100"
                    step="5"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number.parseInt(e.target.value)])}
                    className="w-full h-2 bg-[#FFD700] rounded-lg appearance-none cursor-pointer"
                    aria-label="Price range filter"
                  />
                  <span className="text-xs">${priceRange[1]}</span>
                </div>
              </div>

              {/* Additional Filters */}
              <div>
                <h4 className="text-sm font-medium mb-2">Product Status</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-[#FFD700] text-gold-foil focus:ring-gold-foil" />
                    <span className="text-sm">New Arrivals</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-[#FFD700] text-gold-foil focus:ring-gold-foil" />
                    <span className="text-sm">Best Sellers</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-[#FFD700] text-gold-foil focus:ring-gold-foil" />
                    <span className="text-sm">On Sale</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-[#FFD700] text-gold-foil focus:ring-gold-foil" />
                    <span className="text-sm">Limited Edition</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Products Grid Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">All Products</h2>
            <div className="text-sm text-[#FFD700]">
              {filteredProducts.length} {filteredProducts.length === 1 ? "Product" : "Products"}
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={() => handleAddToCart(product)}
                  onQuickView={() => handleQuickView(product)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-2xl font-bold mb-4">No products found</h3>
              <p className="text-[#FFD700] mb-6">Try adjusting your filters or search query</p>
              <button
                className="btn-primary"
                onClick={() => {
                  setSelectedCategory("all")
                  setSearchQuery("")
                  setPriceRange([0, 100])
                  setSortOption("featured")
                }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* About Our Merch Section */}
      <section className="py-16 bg-[#111111]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">About Our Merch</h2>
              <p className="text-[#FFD700] mb-4">
                At Broski&apos;s Kitchen, we believe in quality that matches our food. Our merchandise is crafted with
                premium materials and designed to last, just like the memories you make in our restaurants.
              </p>
              <p className="text-[#FFD700] mb-4">
                Each piece is designed in-house and produced in limited quantities to ensure exclusivity. We partner
                with sustainable manufacturers who share our values of quality and responsibility.
              </p>
              <p className="text-[#FFD700]">
                From comfortable tees to stylish accessories, our merch lets you take a piece of the Broski&apos;s
                experience home with you.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-square relative rounded-lg overflow-hidden">
                <Image
                  src="/images/menu-1.svg"
                  alt="Broski's Kitchen Merchandise"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="aspect-square relative rounded-lg overflow-hidden">
                <Image
                  src="/images/menu-2.svg"
                  alt="Broski's Kitchen Merchandise"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="aspect-square relative rounded-lg overflow-hidden">
                <Image
                  src="/images/menu-3.svg"
                  alt="Broski's Kitchen Merchandise"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="aspect-square relative rounded-lg overflow-hidden">
                <Image
                  src="/images/hero-bg.svg"
                  alt="Broski's Kitchen Merchandise"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-black relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/20 to-[#880808]/20 opacity-50"></div>
        <div className="container mx-auto px-4 relative z-10">
          <Newsletter />
        </div>
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
