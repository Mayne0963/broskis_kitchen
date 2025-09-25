"use client"

import React, { useState } from "react"
import { FaPlus, FaMinus, FaExchangeAlt, FaSort, FaSortAmountDown, FaSortAmountUp } from "react-icons/fa"
import type { RewardHistory as RewardHistoryType } from "@/types"

interface RewardHistoryProps {
  history: RewardHistoryType[]
}

const RewardHistory: React.FC<RewardHistoryProps> = ({ history }) => {
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "highest" | "lowest">("newest")
  const [filter, setFilter] = useState<"all" | "earned" | "redeemed">("all")

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Filter and sort history
  const getFilteredAndSortedHistory = () => {
    let filtered = [...history]

    // Apply filter
    if (filter === "earned") {
      filtered = filtered.filter((item) => item.points > 0)
    } else if (filter === "redeemed") {
      filtered = filtered.filter((item) => item.points < 0)
    }

    // Apply sort
    switch (sortOrder) {
      case "newest":
        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      case "oldest":
        return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      case "highest":
        return filtered.sort((a, b) => Math.abs(b.points) - Math.abs(a.points))
      case "lowest":
        return filtered.sort((a, b) => Math.abs(a.points) - Math.abs(b.points))
      default:
        return filtered
    }
  }

  const filteredHistory = getFilteredAndSortedHistory()

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        {/* Filter Buttons */}
        <div className="flex rounded-full bg-[#1A1A1A] p-1">
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === "all" ? "bg-gold-foil text-black" : "text-white hover:bg-[#333333]"
            }`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === "earned" ? "bg-gold-foil text-black" : "text-white hover:bg-[#333333]"
            }`}
            onClick={() => setFilter("earned")}
          >
            Earned
          </button>
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === "redeemed" ? "bg-gold-foil text-black" : "text-white hover:bg-[#333333]"
            }`}
            onClick={() => setFilter("redeemed")}
          >
            Redeemed
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <button
            className="btn-outline flex items-center gap-2"
            onClick={() => {
              const dropdown = document.getElementById("sort-dropdown")
              if (dropdown) {
                dropdown.classList.toggle("hidden")
              }
            }}
          >
            <FaSort /> Sort by: {sortOrder.charAt(0).toUpperCase() + sortOrder.slice(1)}
          </button>
          <div id="sort-dropdown" className="absolute right-0 mt-2 w-48 bg-[#1A1A1A] rounded-md shadow-lg z-10 hidden">
            <div className="py-1">
              <button
                className={`block px-4 py-2 text-sm w-full text-left ${
                  sortOrder === "newest" ? "text-gold-foil" : "text-white hover:bg-[#333333]"
                }`}
                onClick={() => {
                  setSortOrder("newest")
                  document.getElementById("sort-dropdown")?.classList.add("hidden")
                }}
              >
                <FaSortAmountDown className="inline mr-2" /> Newest First
              </button>
              <button
                className={`block px-4 py-2 text-sm w-full text-left ${
                  sortOrder === "oldest" ? "text-gold-foil" : "text-white hover:bg-[#333333]"
                }`}
                onClick={() => {
                  setSortOrder("oldest")
                  document.getElementById("sort-dropdown")?.classList.add("hidden")
                }}
              >
                <FaSortAmountUp className="inline mr-2" /> Oldest First
              </button>
              <button
                className={`block px-4 py-2 text-sm w-full text-left ${
                  sortOrder === "highest" ? "text-gold-foil" : "text-white hover:bg-[#333333]"
                }`}
                onClick={() => {
                  setSortOrder("highest")
                  document.getElementById("sort-dropdown")?.classList.add("hidden")
                }}
              >
                <FaSortAmountDown className="inline mr-2" /> Highest Points
              </button>
              <button
                className={`block px-4 py-2 text-sm w-full text-left ${
                  sortOrder === "lowest" ? "text-gold-foil" : "text-white hover:bg-[#333333]"
                }`}
                onClick={() => {
                  setSortOrder("lowest")
                  document.getElementById("sort-dropdown")?.classList.add("hidden")
                }}
              >
                <FaSortAmountUp className="inline mr-2" /> Lowest Points
              </button>
            </div>
          </div>
        </div>
      </div>

      {filteredHistory.length > 0 ? (
        <div className="bg-[#1A1A1A] rounded-lg overflow-hidden shadow-lg border border-[#333333]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#111111]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333333]">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-[#222222]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatDate(item.date)}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{item.action}</td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                        item.points > 0 ? "text-emerald-green" : "text-blood-red"
                      }`}
                    >
                      <span className="flex items-center justify-end">
                        {item.points > 0 ? (
                          <>
                            <FaPlus className="mr-1" /> {item.points}
                          </>
                        ) : (
                          <>
                            <FaMinus className="mr-1" /> {Math.abs(item.points)}
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#1A1A1A] rounded-lg p-8 text-center border border-[#333333]">
          <FaExchangeAlt className="text-4xl text-gold-foil mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No History Found</h3>
          <p className="text-gray-400">
            {filter === "all"
              ? "You don&apos;t have any points history yet."
              : filter === "earned"
                ? "You haven&apos;t earned any points yet."
                : "You haven&apos;t redeemed any rewards yet."}
          </p>
        </div>
      )}
    </div>
  )
}

export default RewardHistory
