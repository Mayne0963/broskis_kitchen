"use client"
import { useEffect } from 'react'
import { loadRemoteConfig } from '@/lib/remoteConfig'

export default function RemoteConfigInit() {
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const ok = await loadRemoteConfig()
        if (mounted) {
          console.info('[RemoteConfig] activated:', ok)
        }
      } catch (e) {
        console.warn('[RemoteConfig] activation failed', e)
      }
    })()
    return () => { mounted = false }
  }, [])
  return null
}