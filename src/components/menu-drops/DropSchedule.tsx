"use client"

import Image from 'next/image'
import { Calendar, Users, Clock } from 'lucide-react'
import NotifyButton from './NotifyButton'

interface ScheduledDrop {
  id: string
  name: string
  description: string
  image: string
  price: number
  scheduledFor: Date
  notifyCount?: number
}

interface DropScheduleProps {
  drops: ScheduledDrop[]
  userId?: string
}

export default function DropSchedule({ drops, userId }: DropScheduleProps) {
  const formatScheduledTime = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 24) {
      return `In ${diffInHours} hours`
    } else if (diffInHours < 48) {
      return 'Tomorrow'
    } else {
      const days = Math.ceil(diffInHours / 24)
      return `In ${days} days`
    }
  }
  
  if (drops.length === 0) {
    return (
      <div className="text-center py-12 bg-[var(--color-dark-charcoal)] rounded-lg border border-[var(--color-harvest-gold)]/20">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-400 text-lg">No scheduled drops yet. Stay tuned!</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {drops.map((drop) => (
        <div 
          key={drop.id}
          className="bg-[var(--color-dark-charcoal)] rounded-lg border border-[var(--color-harvest-gold)]/20 hover:border-[var(--color-harvest-gold)]/40 transition-all duration-300 overflow-hidden"
        >
          <div className="md:flex">
            {/* Image */}
            <div className="md:w-1/3 relative h-48 md:h-auto">
              <Image
                src={drop.image}
                alt={drop.name}
                fill
                className="object-cover"
              />
              <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                Scheduled
              </div>
            </div>
            
            {/* Content */}
            <div className="md:w-2/3 p-6">
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-[var(--color-harvest-gold)] mb-2">
                        {drop.name}
                      </h3>
                      <p className="text-gray-300 mb-4">
                        {drop.description}
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-white ml-4">
                      ${drop.price.toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Schedule Info */}
                  <div className="flex items-center space-x-6 mb-6">
                    <div className="flex items-center text-[var(--color-harvest-gold)]">
                      <Calendar className="w-5 h-5 mr-2" />
                      <span className="font-medium">
                        {formatScheduledTime(drop.scheduledFor)}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-400">
                      <span className="text-sm">
                        {drop.scheduledFor.toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    {drop.notifyCount && (
                      <div className="flex items-center text-gray-400">
                        <Users className="w-4 h-4 mr-1" />
                        <span className="text-sm">
                          {drop.notifyCount} waiting
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Button */}
                <div className="md:w-48">
                  <NotifyButton dropId={drop.id} userId={userId} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}