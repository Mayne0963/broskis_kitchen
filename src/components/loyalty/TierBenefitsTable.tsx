"use client"

import type React from "react"

import { FaCheck, FaTimes } from "react-icons/fa"

const TierBenefitsTable: React.FC = () => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#111111]">
            <th className="p-4 text-left border-b border-[#333333]">Benefit</th>
            <th className="p-4 text-center border-b border-[#333333]">
              <span className="flex items-center justify-center">
                <span className="w-3 h-3 bg-[#CD7F32] rounded-full mr-2"></span> Bronze
              </span>
            </th>
            <th className="p-4 text-center border-b border-[#333333]">
              <span className="flex items-center justify-center">
                <span className="w-3 h-3 bg-gray-400 rounded-full mr-2"></span> Silver
              </span>
            </th>
            <th className="p-4 text-center border-b border-[#333333]">
              <span className="flex items-center justify-center">
                <span className="w-3 h-3 bg-gold-foil rounded-full mr-2"></span> Gold
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-[#333333] hover:bg-[#1F1F1F]">
            <td className="p-4">Points per $1 spent</td>
            <td className="p-4 text-center">1 point</td>
            <td className="p-4 text-center">1.5 points</td>
            <td className="p-4 text-center">2 points</td>
          </tr>
          <tr className="border-b border-[#333333] hover:bg-[#1F1F1F]">
            <td className="p-4">Birthday reward</td>
            <td className="p-4 text-center">
              <FaCheck className="mx-auto text-emerald-green" />
            </td>
            <td className="p-4 text-center">
              <FaCheck className="mx-auto text-emerald-green" />
            </td>
            <td className="p-4 text-center">
              <FaCheck className="mx-auto text-emerald-green" />
            </td>
          </tr>
          <tr className="border-b border-[#333333] hover:bg-[#1F1F1F]">
            <td className="p-4">Digital membership card</td>
            <td className="p-4 text-center">
              <FaCheck className="mx-auto text-emerald-green" />
            </td>
            <td className="p-4 text-center">
              <FaCheck className="mx-auto text-emerald-green" />
            </td>
            <td className="p-4 text-center">
              <FaCheck className="mx-auto text-emerald-green" />
            </td>
          </tr>
          <tr className="border-b border-[#333333] hover:bg-[#1F1F1F]">
            <td className="p-4">Priority pickup</td>
            <td className="p-4 text-center">
              <FaTimes className="mx-auto text-blood-red" />
            </td>
            <td className="p-4 text-center">
              <FaCheck className="mx-auto text-emerald-green" />
            </td>
            <td className="p-4 text-center">
              <FaCheck className="mx-auto text-emerald-green" />
            </td>
          </tr>
          <tr className="border-b border-[#333333] hover:bg-[#1F1F1F]">
            <td className="p-4">Exclusive menu items</td>
            <td className="p-4 text-center">
              <FaTimes className="mx-auto text-blood-red" />
            </td>
            <td className="p-4 text-center">
              <FaCheck className="mx-auto text-emerald-green" />
            </td>
            <td className="p-4 text-center">
              <FaCheck className="mx-auto text-emerald-green" />
            </td>
          </tr>
          <tr className="border-b border-[#333333] hover:bg-[#1F1F1F]">
            <td className="p-4">Free delivery</td>
            <td className="p-4 text-center">
              <FaTimes className="mx-auto text-blood-red" />
            </td>
            <td className="p-4 text-center">
              <FaTimes className="mx-auto text-blood-red" />
            </td>
            <td className="p-4 text-center">
              <FaCheck className="mx-auto text-emerald-green" />
            </td>
          </tr>
          <tr className="border-b border-[#333333] hover:bg-[#1F1F1F]">
            <td className="p-4">VIP event invitations</td>
            <td className="p-4 text-center">
              <FaTimes className="mx-auto text-blood-red" />
            </td>
            <td className="p-4 text-center">
              <FaTimes className="mx-auto text-blood-red" />
            </td>
            <td className="p-4 text-center">
              <FaCheck className="mx-auto text-emerald-green" />
            </td>
          </tr>
          <tr className="border-b border-[#333333] hover:bg-[#1F1F1F]">
            <td className="p-4">Chef's table access</td>
            <td className="p-4 text-center">
              <FaTimes className="mx-auto text-blood-red" />
            </td>
            <td className="p-4 text-center">
              <FaTimes className="mx-auto text-blood-red" />
            </td>
            <td className="p-4 text-center">
              <FaCheck className="mx-auto text-emerald-green" />
            </td>
          </tr>
          <tr className="border-b border-[#333333] hover:bg-[#1F1F1F]">
            <td className="p-4">Early access to new menu items</td>
            <td className="p-4 text-center">
              <FaTimes className="mx-auto text-blood-red" />
            </td>
            <td className="p-4 text-center">
              <FaCheck className="mx-auto text-emerald-green" />
            </td>
            <td className="p-4 text-center">
              <FaCheck className="mx-auto text-emerald-green" />
            </td>
          </tr>
          <tr className="border-b border-[#333333] hover:bg-[#1F1F1F]">
            <td className="p-4">Cooking class priority</td>
            <td className="p-4 text-center">
              <FaTimes className="mx-auto text-blood-red" />
            </td>
            <td className="p-4 text-center">
              <FaCheck className="mx-auto text-emerald-green" />
            </td>
            <td className="p-4 text-center">
              <FaCheck className="mx-auto text-emerald-green" />
            </td>
          </tr>
          <tr className="hover:bg-[#1F1F1F]">
            <td className="p-4">Partner benefits</td>
            <td className="p-4 text-center">Limited</td>
            <td className="p-4 text-center">Enhanced</td>
            <td className="p-4 text-center">Premium</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default TierBenefitsTable
