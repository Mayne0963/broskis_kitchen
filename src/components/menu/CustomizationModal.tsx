"use client"

import React, { useState, useEffect } from "react"
import { FaTimes, FaCheck } from "react-icons/fa"
import type { CustomizationCategory, CustomizationOption } from "@/types"

interface CustomizationModalProps {
  item: {
    id: string
    name: string
    price: number
    image: string
    category: string
  }
  customizationOptions: CustomizationCategory[]
  onClose: () => void
  onAddToCart: (quantity: number, customizations: { [categoryId: string]: CustomizationOption[] }) => void
}

const CustomizationModal: React.FC<CustomizationModalProps> = ({
  item,
  customizationOptions,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<{ [categoryId: string]: CustomizationOption[] }>({})
  const [validationErrors, setValidationErrors] = useState<{ [categoryId: string]: string }>({})
  const [totalPrice, setTotalPrice] = useState(item.price)

  // Initialize selected options
  useEffect(() => {
    const initialOptions: { [categoryId: string]: CustomizationOption[] } = {}
    const errors: { [categoryId: string]: string } = {}

    customizationOptions.forEach((category) => {
      if (category.required && !category.multiple) {
        // Pre-select the first option for required single-select categories
        initialOptions[category.id] = [category.options[0]]
      } else {
        initialOptions[category.id] = []
      }

      if (category.required && initialOptions[category.id].length === 0) {
        errors[category.id] = `Please select a ${category.name.toLowerCase()}`
      }
    })

    setSelectedOptions(initialOptions)
    setValidationErrors(errors)
  }, [customizationOptions])

  // Calculate total price whenever selections change
  useEffect(() => {
    let newTotal = item.price * quantity

    // Add the price of all selected options
    Object.values(selectedOptions).forEach((options) => {
      options.forEach((option) => {
        newTotal += option.price * quantity
      })
    })

    setTotalPrice(newTotal)
  }, [selectedOptions, quantity, item.price])

  const handleOptionSelect = (category: CustomizationCategory, option: CustomizationOption) => {
    setSelectedOptions((prev) => {
      const newOptions = { ...prev }

      if (category.multiple) {
        // For multi-select, toggle the option
        const categoryOptions = [...(prev[category.id] || [])]
        const optionIndex = categoryOptions.findIndex((opt) => opt.id === option.id)

        if (optionIndex >= 0) {
          // Remove if already selected
          categoryOptions.splice(optionIndex, 1)
        } else {
          // Add if not selected
          categoryOptions.push(option)
        }

        newOptions[category.id] = categoryOptions
      } else {
        // For single-select, replace the current selection
        newOptions[category.id] = [option]
      }

      // Clear validation error if a selection is made for a required category
      if (category.required && newOptions[category.id].length > 0) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[category.id]
          return newErrors
        })
      }

      return newOptions
    })
  }

  const isOptionSelected = (categoryId: string, optionId: string) => {
    return (selectedOptions[categoryId] || []).some((opt) => opt.id === optionId)
  }

  const handleAddToCart = () => {
    // Validate all required fields are filled
    const errors: { [categoryId: string]: string } = {}

    customizationOptions.forEach((category) => {
      if (category.required && (!selectedOptions[category.id] || selectedOptions[category.id].length === 0)) {
        errors[category.id] = `Please select a ${category.name.toLowerCase()}`
      }
    })

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    onAddToCart(quantity, selectedOptions)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-[#1A1A1A] rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fade-in">
        <div className="relative p-6 border-b border-[#333333] flex justify-between items-center">
          <h2 className="text-xl font-bold">Customize {item.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
          {customizationOptions.map((category) => (
            <div key={category.id} className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold">
                  {category.name} {category.required && <span className="text-blood-red">*</span>}
                </h3>
                <span className="text-sm text-gray-400">{category.multiple ? "Select multiple" : "Select one"}</span>
              </div>

              {validationErrors[category.id] && (
                <p className="text-blood-red text-sm mb-2">{validationErrors[category.id]}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {category.options.map((option) => (
                  <button
                    key={option.id}
                    className={`p-3 rounded-md border ${
                      isOptionSelected(category.id, option.id)
                        ? "border-gold-foil bg-gold-foil bg-opacity-10"
                        : "border-[#333333] hover:border-[#555555]"
                    } text-left flex justify-between items-center transition-colors`}
                    onClick={() => handleOptionSelect(category, option)}
                  >
                    <span className="flex items-center">
                      {isOptionSelected(category.id, option.id) && (
                        <FaCheck className="text-gold-foil mr-2 flex-shrink-0" />
                      )}
                      {option.name}
                    </span>
                    {option.price > 0 && <span className="text-gold-foil">+${option.price.toFixed(2)}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-6 pt-6 border-t border-[#333333]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold">Quantity</h3>
              </div>
              <div className="flex items-center border border-[#333333] rounded-md">
                <button
                  className="px-3 py-1 text-white hover:bg-[#333333] transition-colors"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </button>
                <span className="px-4 py-1 text-white">{quantity}</span>
                <button
                  className="px-3 py-1 text-white hover:bg-[#333333] transition-colors"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center mb-4 text-lg font-bold">
              <span>Total:</span>
              <span className="text-gold-foil">${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-[#111111] border-t border-[#333333]">
          <div className="flex gap-3">
            <button className="btn-outline flex-1" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary flex-1" onClick={handleAddToCart}>
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomizationModal
