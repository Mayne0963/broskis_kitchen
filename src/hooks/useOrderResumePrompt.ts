"use client"

import { useEffect, useMemo, useState } from "react"
import { loadSessionOrder, loadLocalSnapshot, clearLocalSnapshot, saveSessionOrder } from "@/lib/utils/orderPersistence"

export function useOrderResumePrompt() {
  const [shouldPrompt, setShouldPrompt] = useState(false)
  const [summary, setSummary] = useState<{ items: number; total: number; savedAt: string } | null>(null)
  const [snapshotOrder, setSnapshotOrder] = useState<any>(null)

  useEffect(() => {
    const session = loadSessionOrder()
    if (session && session.items.length > 0) {
      setShouldPrompt(false)
      return
    }
    const snap = loadLocalSnapshot()
    if (snap && snap.order && snap.order.items.length > 0) {
      setSnapshotOrder(snap.order)
      setSummary({ items: snap.order.items.length, total: snap.order.total, savedAt: snap.savedAt })
      setShouldPrompt(true)
    }
  }, [])

  const accept = () => {
    if (!snapshotOrder) return
    saveSessionOrder(snapshotOrder)
    setShouldPrompt(false)
  }

  const decline = () => {
    clearLocalSnapshot()
    setShouldPrompt(false)
  }

  return { shouldPrompt, summary, accept, decline }
}