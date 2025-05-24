"use client"

import type React from "react"

interface CategoryFilterProps {
  categories: { id: string; name: string }[]
  selectedCategory: string
  setSelectedCategory: (category: string) => void
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, selectedCategory, setSelectedCategory }) => {
  return (
    <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
      <div className="flex space-x-2 min-w-max">
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === "all" ? "bg-gold-foil text-black" : "bg-[#1A1A1A] text-white hover:bg-[#333333]"
          }`}
          onClick={() => setSelectedCategory("all")}
        >
          All Products
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? "bg-gold-foil text-black"
                : "bg-[#1A1A1A] text-white hover:bg-[#333333]"
            }`}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export default CategoryFilter
