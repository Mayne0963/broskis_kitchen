"use client"

import { useState, useEffect } from 'react'
import useSWR from 'swr'

interface SessionUser {
  id: string
  uid: string
  email: string
  name: string
  role: string
}

interface SessionData {
  ok: boolean
  user: SessionUser | null
}

const fetcher = async (url: string): Promise<SessionData> => {
  const response = await fetch(url, {
    credentials: 'include',
    cache: 'no-store'
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch session')
  }
  
  return response.json()
}

export function useSession() {
  const { data, error, mutate, isLoading } = useSWR<SessionData>('/api/session', fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000, // Dedupe requests within 5 seconds
    errorRetryCount: 3,
    errorRetryInterval: 1000,
    fallbackData: { ok: false, user: null }
  })

  const logout = async () => {
    try {
      await fetch('/api/session', {
        method: 'DELETE',
        credentials: 'include'
      })
      // Immediately update the local state
      mutate({ ok: false, user: null }, false)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return {
    user: data?.user || null,
    isAuthenticated: data?.ok || false,
    isLoading: isLoading,
    error,
    logout,
    mutate
  }
}