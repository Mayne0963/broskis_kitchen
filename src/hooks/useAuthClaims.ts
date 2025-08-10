"use client"

import { getAuth, onIdTokenChanged, type User } from 'firebase/auth'
import { useEffect, useState } from 'react'

type Claims = { isAdmin?: boolean }

export function useAuthClaims() {
  const [user, setUser] = useState<User | null>(null)
  const [claims, setClaims] = useState<Claims>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getAuth()
    return onIdTokenChanged(auth, async (u) => {
      if (!u) {
        setUser(null)
        setClaims({})
        setLoading(false)
        return
      }

      // Force refresh to ensure custom claims are immediately available
      const tokenResult = await u.getIdTokenResult(true)
      setUser(u)
      setClaims(tokenResult.claims as Claims)
      setLoading(false)
    })
  }, [])

  return { user, claims, loading }
}