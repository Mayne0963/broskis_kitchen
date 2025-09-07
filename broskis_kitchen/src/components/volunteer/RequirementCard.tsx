import type React from "react"
import { FaCheckCircle } from "react-icons/fa"

interface Requirement {
  title: string
  description: string
  items: string[]
}

interface RequirementCardProps {
  requirement: Requirement
}

const RequirementCard: React.FC<RequirementCardProps> = ({ requirement }) => {
  return (
    <div className="bg-[#1A1A1A] rounded-lg p-6 border border-[#333333]">
      <h3 className="text-xl font-bold mb-2">{requirement.title}</h3>
      <p className="text-gray-400 mb-4">{requirement.description}</p>
      <ul className="space-y-2">
        {requirement.items.map((item, index) => (
          <li key={index} className="flex items-start">
            <FaCheckCircle className="text-gold-foil mt-1 mr-2 flex-shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default RequirementCard
