"use client"

import { useState } from 'react'
import { Bell, Check } from 'lucide-react'

interface NotifyButtonProps {
  dropId: string
  userId?: string
}

export default function NotifyButton({ dropId, userId }: NotifyButtonProps) {
  const [isNotifying, setIsNotifying] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  
  const handleNotifyMe = async () => {
    if (!userId) {
      // Redirect to login
      window.location.href = '/auth/login'
      return
    }
    
    setIsNotifying(true)
    try {
      // TODO: Implement notification signup API call
      const response = await fetch('/api/menu-drops/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dropId,
          userId,
          action: isSubscribed ? 'unsubscribe' : 'subscribe'
        })
      })
      
      if (response.ok) {
        setIsSubscribed(!isSubscribed)
      } else {
        throw new Error('Failed to update notification preference')
      }
    } catch (error) {
      console.error('Failed to update notification:', error)
      // TODO: Show error toast
    } finally {
      setIsNotifying(false)
    }
  }
  
  return (
    <button
      onClick={handleNotifyMe}
      disabled={isNotifying}
      className={`w-full ${
        isSubscribed
          ? 'btn-secondary'
          : 'btn-primary'
      }`}
    >
      {isNotifying ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <>
          {isSubscribed ? (
            <>
              <Check className="w-5 h-5" />
              <span>Notifications On</span>
            </>
          ) : (
            <>
              <Bell className="w-5 h-5" />
              <span>Notify Me</span>
            </>
          )}
        </>
      )}
    </button>
  )
}