"use client"

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface CountdownTimerProps {
  endTime: Date
}

interface TimeLeft {
  hours: number
  minutes: number
  seconds: number
}

export default function CountdownTimer({ endTime }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 })
  const [isExpired, setIsExpired] = useState(false)
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endTime.getTime() - new Date().getTime()
      
      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)
        
        setTimeLeft({ hours, minutes, seconds })
        setIsExpired(false)
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
        setIsExpired(true)
      }
    }
    
    // Calculate immediately
    calculateTimeLeft()
    
    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000)
    
    return () => clearInterval(timer)
  }, [endTime])
  
  if (isExpired) {
    return (
      <div className="bg-gold-foil/20 border border-gold-foil/30 rounded-lg p-3 text-center">
        <span className="text-[var(--color-harvest-gold)] font-medium">Drop Ended</span>
      </div>
    )
  }
  
  const isUrgent = timeLeft.hours === 0 && timeLeft.minutes < 30
  
  return (
    <div className={`rounded-lg p-3 border ${
      isUrgent 
        ? 'bg-gold-foil/20 border-gold-foil/30' 
        : 'bg-[var(--color-harvest-gold)]/10 border-[var(--color-harvest-gold)]/30'
    }`}>
      <div className="flex items-center justify-center space-x-2 mb-2">
        <Clock className={`w-4 h-4 ${
          isUrgent ? 'text-[var(--color-harvest-gold)]' : 'text-[var(--color-harvest-gold)]'
        }`} />
        <span className={`text-sm font-medium ${
          isUrgent ? 'text-[var(--color-harvest-gold)]' : 'text-[var(--color-harvest-gold)]'
        }`}>
          {isUrgent ? 'Ending Soon!' : 'Time Remaining'}
        </span>
      </div>
      
      <div className="flex items-center justify-center space-x-4">
        {timeLeft.hours > 0 && (
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              isUrgent ? 'text-[var(--color-harvest-gold)]' : 'text-white'
            }`}>
              {timeLeft.hours.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">Hours</div>
          </div>
        )}
        
        <div className="text-center">
          <div className={`text-2xl font-bold ${
            isUrgent ? 'text-[var(--color-harvest-gold)]' : 'text-white'
          }`}>
            {timeLeft.minutes.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">Min</div>
        </div>
        
        <div className="text-center">
          <div className={`text-2xl font-bold ${
            isUrgent ? 'text-[var(--color-harvest-gold)]' : 'text-white'
          } ${isUrgent ? 'animate-pulse' : ''}`}>
            {timeLeft.seconds.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">Sec</div>
        </div>
      </div>
    </div>
  )
}