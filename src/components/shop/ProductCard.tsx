"use client"

import type React from "react"

import Image from "next/image"
import { useState } from "react"
import { FaShoppingCart, FaEye, FaStar, FaFire } from "react-icons/fa"
import type { Product } from "../../types/merch"

interface ProductCardProps {
  product: Product
  onAddToCart: () => void
  onQuickView: () => void
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onQuickView }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="bg-black rounded-lg overflow-hidden shadow-lg border border-[#FFD700] hover:border-[#B22222] transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image */}
      <div className="relative h-64 w-full overflow-hidden">
        <Image
          src={isHovered && product.images.length > 1 ? product.images[1] : product.images[0]}
          alt={product.name}
          fill
          className="object-cover transition-all duration-500"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-2 z-10">
          {product.new && (
            <span className="bg-blood-red text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
              <FaFire /> NEW
            </span>
          )}
          {product.bestseller && (
            <span className="bg-gold-foil text-black text-xs px-3 py-1 rounded-full flex items-center gap-1">
              <FaStar /> BESTSELLER
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-2 flex justify-center gap-2 transition-all duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`}
        >
          <button
            className="bg-gold-foil text-black p-2 rounded-full hover:bg-opacity-80 transition-colors"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onQuickView()
            }}
            aria-label="Quick view"
          >
            <FaEye />
          </button>
          <button
            className="bg-gold-foil text-black p-2 rounded-full hover:bg-opacity-80 transition-colors"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onAddToCart()
            }}
            aria-label="Add to cart"
          >
            <FaShoppingCart />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="text-lg font-bold mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-gray-400 text-sm mb-2 line-clamp-2">{product.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-gold-foil font-bold">${product.price.toFixed(2)}</span>
          {product.compareAtPrice && (
            <span className="text-gray-500 text-sm line-through">${product.compareAtPrice.toFixed(2)}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductCard
