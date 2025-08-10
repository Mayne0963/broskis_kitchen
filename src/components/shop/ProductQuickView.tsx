"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { FaTimes, FaStar, FaFire, FaShoppingCart } from "react-icons/fa"
import type { Product } from "../../types/merch"

interface ProductQuickViewProps {
  product: Product
  onClose: () => void
  onAddToCart: (product: Product, quantity: number) => void
}

const ProductQuickView: React.FC<ProductQuickViewProps> = ({ product, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState(product.sizes ? product.sizes[0] : null)
  const [selectedColor, setSelectedColor] = useState(product.colors ? product.colors[0] : null)

  const handleQuantityChange = (value: number) => {
    if (value < 1) return
    if (value > 10) return
    setQuantity(value)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80">
      <div className="bg-[#1A1A1A] rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fade-in">
        <div className="relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Product Images */}
          <div className="p-6 bg-[#111111]">
            <div className="relative h-80 w-full mb-4">
              <Image
                src={product.images[selectedImage] || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-contain"
              />
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    className={`relative w-16 h-16 rounded-md overflow-hidden border-2 ${
                      selectedImage === index ? "border-gold-foil" : "border-[#333333]"
                    }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`${product.name} - view ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="p-6 overflow-y-auto max-h-[600px]">
            <div className="flex flex-wrap gap-2 mb-2">
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

            <h2 className="text-2xl font-bold mb-2">{product.name}</h2>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold text-gold-foil">${product.price.toFixed(2)}</span>
              {product.compareAtPrice && (
                <span className="text-gray-500 text-lg line-through">${product.compareAtPrice.toFixed(2)}</span>
              )}
            </div>

            <p className="text-gray-300 mb-6">{product.description}</p>

            {/* Size Selection */}
            {product.sizes && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedSize === size ? "bg-gold-foil text-black" : "bg-[#222222] text-white hover:bg-[#333333]"
                      }`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.colors && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Color</h3>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      className={`w-8 h-8 rounded-full transition-all ${
                        selectedColor?.name === color.name
                          ? "ring-2 ring-gold-foil ring-offset-2 ring-offset-[#1A1A1A]"
                          : ""
                      }`}
                      style={{ backgroundColor: color.hex }}
                      onClick={() => setSelectedColor(color)}
                      aria-label={`Select ${color.name} color`}
                    ></button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">Quantity</h3>
              <div className="flex items-center">
                <button
                  className="bg-[#222222] text-white w-10 h-10 flex items-center justify-center rounded-l-md hover:bg-[#333333]"
                  onClick={() => handleQuantityChange(quantity - 1)}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(Number.parseInt(e.target.value))}
                  className="w-16 h-10 bg-[#222222] text-center text-white border-x border-[#333333]"
                />
                <button
                  className="bg-[#222222] text-white w-10 h-10 flex items-center justify-center rounded-r-md hover:bg-[#333333]"
                  onClick={() => handleQuantityChange(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              className="btn-primary w-full flex items-center justify-center gap-2"
              onClick={() => {
                onAddToCart(product, quantity)
                onClose()
              }}
            >
              <FaShoppingCart /> Add to Cart
            </button>

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-[#333333]">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-1">Material</h4>
                  <p className="text-gray-400">{product.material || "100% Cotton"}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Care</h4>
                  <p className="text-gray-400">{product.care || "Machine wash cold"}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">SKU</h4>
                  <p className="text-gray-400">{product.sku || product.id}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Category</h4>
                  <p className="text-gray-400">{product.categoryName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductQuickView
