import type React from "react"

interface PasswordStrengthMeterProps {
  strength: "weak" | "medium" | "strong" | "very-strong"
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ strength }) => {
  const getColor = () => {
    switch (strength) {
      case "weak":
        return "bg-blood-red"
      case "medium":
        return "bg-citrus-orange"
      case "strong":
        return "bg-emerald-green"
      case "very-strong":
        return "bg-emerald-green"
      default:
        return "bg-blood-red"
    }
  }

  const getLabel = () => {
    switch (strength) {
      case "weak":
        return "Weak"
      case "medium":
        return "Medium"
      case "strong":
        return "Strong"
      case "very-strong":
        return "Very Strong"
      default:
        return "Weak"
    }
  }

  const getWidth = () => {
    switch (strength) {
      case "weak":
        return "w-1/4"
      case "medium":
        return "w-2/4"
      case "strong":
        return "w-3/4"
      case "very-strong":
        return "w-full"
      default:
        return "w-1/4"
    }
  }

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <div className="h-2 w-full bg-[#333333] rounded-full">
          <div className={`h-full rounded-full ${getColor()} ${getWidth()} transition-all duration-300`}></div>
        </div>
        <span className="ml-4 text-xs whitespace-nowrap">{getLabel()}</span>
      </div>
    </div>
  )
}

export default PasswordStrengthMeter
