import type React from "react"
interface Opportunity {
  title: string
  icon: React.ReactNode
  description: string
  commitment: string
  skills: string[]
}

interface OpportunityCardProps {
  opportunity: Opportunity
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity }) => {
  return (
    <div className="bg-[#1A1A1A] rounded-lg overflow-hidden shadow-lg border border-[#333333] hover:border-gold-foil transition-colors">
      <div className="p-6">
        <div className="w-16 h-16 bg-gold-foil bg-opacity-20 rounded-full flex items-center justify-center mb-4">
          {opportunity.icon}
        </div>
        <h3 className="text-xl font-bold mb-2">{opportunity.title}</h3>
        <p className="text-gray-400 mb-4">{opportunity.description}</p>
        <div className="mb-4">
          <h4 className="font-bold text-sm text-gold-foil mb-1">Time Commitment:</h4>
          <p className="text-sm text-gray-300">{opportunity.commitment}</p>
        </div>
        <div>
          <h4 className="font-bold text-sm text-gold-foil mb-1">Skills Needed:</h4>
          <ul className="text-sm text-gray-300">
            {opportunity.skills.map((skill, index) => (
              <li key={index} className="mb-1">
                • {skill}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default OpportunityCard
