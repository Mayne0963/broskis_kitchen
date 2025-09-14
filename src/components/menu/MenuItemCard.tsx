"use client"

import type React from "react"

import Image from "next/image"
import { useState } from "react"
import { FaStar, FaFire, FaLeaf, FaShoppingCart, FaPlus, FaMinus, FaCog } from "react-icons/fa"
import CustomizationModal from "./CustomizationModal"
import { getItemCustomizationOptions } from "../../data/menu-data"
import type { CustomizationOption } from "@/types"

interface MenuItemProps {
  item: {
    id: string
    name: string
    description: string
    price: number
    image: string
    category: string
    popular?: boolean
    new?: boolean
    infused?: boolean
    dietary?: {
      vegetarian?: boolean
      vegan?: boolean
      glutenFree?: boolean
      dairyFree?: boolean
    }
  }
  onAddToCart: (quantity: number, customizations?: { [categoryId: string]: CustomizationOption[] }) => void
}

const MenuItemCard: React.FC<MenuItemProps> = ({ item, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCustomizationModal, setShowCustomizationModal] = useState(false)
  const [size, setSize] = useState('')
  const [spice, setSpice] = useState('')
  const [side, setSide] = useState('')

  const customizationOptions = getItemCustomizationOptions(item)
  const hasCustomizationOptions = customizationOptions.length > 0

  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(1, quantity + change)
    setQuantity(newQuantity)
  }

  // Function to get default options for an item
  const getDefaultOptions = () => {
    const defaultOptions: { [categoryId: string]: CustomizationOption[] } = {}
    
    customizationOptions.forEach((category) => {
      if (category.required) {
        // For required categories, select the first option as default
        defaultOptions[category.id] = [category.options[0]]
      }
      // For optional categories, we don't select any defaults
    })
    
    return defaultOptions
  }

  const handleAddToCart = () => {
    if (hasCustomizationOptions) {
      // Use default options when main Add to Cart is clicked
      const defaultOptions = getDefaultOptions()
      onAddToCart(quantity, defaultOptions)
    } else {
      // Create options object for simple customizations
      const options: { [key: string]: any } = {}
      if (size) options.size = size
      if (spice) options.spice = spice
      if (side) options.side = side
      
      // Convert simple options to customization format if any exist
      if (Object.keys(options).length > 0) {
        const simpleCustomizations = {
          options: Object.entries(options).map(([key, value]) => ({
            id: `${key}-${value}`,
            name: `${key}: ${value}`,
            price: 0
          }))
        }
        onAddToCart(quantity, simpleCustomizations)
      } else {
        onAddToCart(quantity)
      }
    }
  }

  const handleCustomize = () => {
    setShowCustomizationModal(true)
  }

  const handleCustomizedAddToCart = (
    quantity: number,
    customizations: { [categoryId: string]: CustomizationOption[] },
  ) => {
    onAddToCart(quantity, customizations)
  }

  return (
    <>
      <div className="menu-card overflow-hidden">
        <div className="relative w-full aspect-square">
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
          {item.image ? (
            <Image
              src={item.image || "/placeholder.svg"}
              alt={item.name}
              fill
              className="object-contain"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-500">No Image</div>
          )}

          {/* Badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-2 z-20">
            {item.popular && (
              <div className="badge bg-gold-foil text-black text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <FaStar /> POPULAR
              </div>
            )}
            {item.new && (
              <div className="badge bg-blood-red text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <FaFire /> NEW
              </div>
            )}
            {item.infused && (
              <div className="badge bg-emerald-green text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <FaLeaf /> INFUSED
              </div>
            )}
          </div>

          {/* Category Tag */}
          <div className="absolute bottom-2 left-2 z-20">
            <span className="text-xs bg-black bg-opacity-70 text-white px-2 py-1 rounded">{item.category}</span>
          </div>
        </div>

        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-white">{item.name}</h3>
            <span className="text-gold-foil font-bold">${item.price.toFixed(2)}</span>
          </div>

          <p className={`text-gray-400 text-sm mb-4 ${isExpanded ? "" : "line-clamp-2"}`}>{item.description}</p>

          {item.description.length > 100 && (
            <button className="text-gold-foil text-xs mb-4 hover:underline" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? "Show less" : "Read more"}
            </button>
          )}

          {/* Dietary Icons */}
          {item.dietary && Object.values(item.dietary).some(Boolean) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {item.dietary.vegetarian && (
                <span className="text-xs bg-[#333333] text-white px-2 py-1 rounded">Vegetarian</span>
              )}
              {item.dietary.vegan && <span className="text-xs bg-[#333333] text-white px-2 py-1 rounded">Vegan</span>}
              {item.dietary.glutenFree && (
                <span className="text-xs bg-[#333333] text-white px-2 py-1 rounded">Gluten Free</span>
              )}
              {item.dietary.dairyFree && (
                <span className="text-xs bg-[#333333] text-white px-2 py-1 rounded">Dairy Free</span>
              )}
            </div>
          )}

          {/* Simple Customization Controls */}
          {!hasCustomizationOptions && (
            <div className="mb-4">
              {/* Size Selection */}
              {(item.category === 'drinks' || item.category === 'sides' || item.category === 'desserts') && (
                <>
                  <label className="block text-sm mb-1 text-white">Size</label>
                  <select 
                    className="mb-2 bg-zinc-900 border border-zinc-700 rounded p-2 w-full text-white" 
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                  >
                    <option value="">Choose</option>
                    <option value="Regular">Regular</option>
                    <option value="Large">Large</option>
                  </select>
                </>
              )}
              
              {/* Spice Level */}
              {(item.category === 'wings' || item.category === 'tacos' || item.category === 'burgers') && (
                <>
                  <label className="block text-sm mb-1 text-white">Spice</label>
                  <select 
                    className="mb-2 bg-zinc-900 border border-zinc-700 rounded p-2 w-full text-white" 
                    value={spice}
                    onChange={(e) => setSpice(e.target.value)}
                  >
                    <option value="">Choose</option>
                    <option value="Mild">Mild</option>
                    <option value="Medium">Medium</option>
                    <option value="Hot">Hot</option>
                    <option value="Extra Hot">Extra Hot</option>
                  </select>
                </>
              )}
              
              {/* Side Selection */}
              {(item.category === 'sandwiches' || item.category === 'burgers') && (
                <>
                  <label className="block text-sm mb-1 text-white">Side</label>
                  <select 
                    className="mb-2 bg-zinc-900 border border-zinc-700 rounded p-2 w-full text-white" 
                    value={side}
                    onChange={(e) => setSide(e.target.value)}
                  >
                    <option value="">Choose</option>
                    <option value="Fries">Fries</option>
                    <option value="Salad">Side Salad</option>
                    <option value="Chips">Chips</option>
                  </select>
                </>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex items-center border border-[#333333] rounded-md">
              <button
                className="px-2 py-1 text-white hover:bg-[#333333] transition-colors"
                onClick={() => handleQuantityChange(-1)}
              >
                <FaMinus size={12} />
              </button>
              <span className="px-3 py-1 text-white">{quantity}</span>
              <button
                className="px-2 py-1 text-white hover:bg-[#333333] transition-colors"
                onClick={() => handleQuantityChange(1)}
              >
                <FaPlus size={12} />
              </button>
            </div>

            <button onClick={handleAddToCart} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <FaShoppingCart size={14} /> Add to Cart
            </button>
            
            {hasCustomizationOptions && (
              <button
                onClick={handleCustomize}
                className="btn-outline px-3 py-2 flex items-center justify-center gap-2"
              >
                <FaCog size={14} /> Customize
              </button>
            )}
          </div>
        </div>
      </div>

      {showCustomizationModal && (
        <CustomizationModal
          item={item}
          customizationOptions={customizationOptions}
          onClose={() => setShowCustomizationModal(false)}
          onAddToCart={handleCustomizedAddToCart}
        />
      )}
    </>
  )
}

export default MenuItemCard
