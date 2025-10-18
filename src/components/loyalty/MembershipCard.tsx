"use client"

import React, { useRef, useEffect } from "react"
import { FaCrown, FaQrcode } from "react-icons/fa"
import type { User } from "@/types"

interface MembershipCardProps {
  user: User
  points: number
  tier: string
}

const MembershipCard: React.FC<MembershipCardProps> = ({ user, points, tier }) => {
  const qrRef = useRef<HTMLDivElement>(null)

  // Generate QR code on mount
  useEffect(() => {
    if (!qrRef.current) return

    // This is a placeholder for actual QR code generation
    // In a real implementation, you would use a library like qrcode.react
    const generateQRCode = () => {
      const canvas = document.createElement("canvas")
      canvas.width = 150
      canvas.height = 150
      const ctx = canvas.getContext("2d")

      if (ctx) {
        // Draw a simple placeholder QR code
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, 150, 150)
        ctx.fillStyle = "#000000"

        // Draw a border
        ctx.fillRect(0, 0, 150, 10)
        ctx.fillRect(0, 0, 10, 150)
        ctx.fillRect(140, 0, 10, 150)
        ctx.fillRect(0, 140, 150, 10)

        // Draw a pattern to simulate QR code
        const blockSize = 10
        for (let i = 1; i < 14; i++) {
          for (let j = 1; j < 14; j++) {
            if (Math.random() > 0.5) {
              ctx.fillRect(i * blockSize, j * blockSize, blockSize, blockSize)
            }
          }
        }

        // Draw position detection patterns
        ctx.fillRect(20, 20, 30, 30)
        ctx.fillRect(100, 20, 30, 30)
        ctx.fillRect(20, 100, 30, 30)

        // Draw inner white squares
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(30, 30, 10, 10)
        ctx.fillRect(110, 30, 10, 10)
        ctx.fillRect(30, 110, 10, 10)

        qrRef.current.innerHTML = ""
        qrRef.current.appendChild(canvas)
      }
    }

    generateQRCode()
  }, [user.id])

  // Get tier color
  const getTierColor = () => {
    switch (tier.toLowerCase()) {
      case "gold":
        return "from-gold-foil to-[#FFD700]"
      case "silver":
        return "from-gray-400 to-[#C0C0C0]"
      default:
        return "from-[#CD7F32] to-[#E6B87A]"
    }
  }

  return (
    <div
      className={`w-full aspect-[1.586/1] rounded-xl overflow-hidden relative bg-gradient-to-r ${getTierColor()} p-[2px]`}
    >
      <div className="bg-[#0A0A0A] rounded-[calc(0.75rem-2px)] h-full w-full p-6 flex flex-col justify-between">
        {/* Card Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold">Broski's Kitchen</h3>
            <p className="text-sm text-gray-400">Loyalty Member</p>
          </div>
          <div className="flex items-center">
            <FaCrown
              className={`mr-2 ${tier.toLowerCase() === "gold" ? "text-gold-foil" : tier.toLowerCase() === "silver" ? "text-gray-400" : "text-[#CD7F32]"}`}
            />
            <span
              className={`font-bold ${tier.toLowerCase() === "gold" ? "text-gold-foil" : tier.toLowerCase() === "silver" ? "text-gray-400" : "text-[#CD7F32]"}`}
            >
              {tier}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-bold text-lg">{user.name}</h4>
            <p className="text-sm text-gray-400">Member #{user.id.substring(0, 8)}</p>
            <div className="mt-2">
              <span className="text-sm text-gray-400">Available Points</span>
              <p className="text-2xl font-bold text-gold-foil">{points}</p>
            </div>
          </div>
          <div className="bg-white p-2 rounded-lg" ref={qrRef}>
            <FaQrcode size={100} className="text-gray-300" />
          </div>
        </div>

        {/* Card Footer */}
        <div className="text-xs text-gray-500 text-center mt-2">
          Present this card when ordering to earn and redeem points
        </div>
      </div>
    </div>
  )
}

export default MembershipCard
