/**
 * This file provides a template for creating JavaScript components that can work alongside TypeScript components.
 * It demonstrates how to use the type definitions from the project while writing in JavaScript.
 *
 * @typedef {import('@/types').CartItem} CartItem
 * @typedef {import('@/types').User} User
 * @typedef {import('react').ReactNode} ReactNode
 */

"use client"

import { useState } from "react"

/**
 * Example JavaScript component that works with TypeScript types
 * @param {Object} props
 * @param {string} props.title
 * @param {ReactNode} props.children
 * @returns {JSX.Element}
 */
const JSComponent = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-surface p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn bg-primary text-black px-4 py-2 rounded hover:bg-primary/90 transition-colors mb-4"
      >
        {isOpen ? "Hide Content" : "Show Content"}
      </button>

      {isOpen && <div className="animate-fade-in">{children}</div>}
    </div>
  )
}

export default JSComponent
