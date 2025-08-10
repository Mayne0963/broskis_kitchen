'use client'

import { useState, useEffect, useCallback } from 'react'
import { realTimeAnalyticsService, type RealTimeMetrics } from '@/lib/services/realTimeAnalyticsService'

export const useRealTimeMetrics = () => {
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = realTimeAnalyticsService.subscribe(
      newMetrics => {
        setMetrics(newMetrics)
        setLoading(false)
        setError(null)
      },
      errorMessage => {
        setError(errorMessage)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [])

  const refresh = useCallback(() => {
    realTimeAnalyticsService.refreshMetrics()
  }, [])

  return { metrics, error, loading, refresh }
}

export default useRealTimeMetrics