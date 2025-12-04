export const revalidate = 0
export const fetchCache = 'force-no-store'

import RewardsClient from "./RewardsClient"
import { withAuthGuard } from "@/lib/auth/session"
import { headers } from "next/headers"

function buildBaseUrl() {
  const envBase = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL
  if (envBase) return envBase

  const hdrs = headers()
  const host = hdrs.get("host")
  if (!host) return ""

  const protocol = hdrs.get("x-forwarded-proto") || "https"
  return `${protocol}://${host}`
}

export default async function RewardsPage() {
  return await withAuthGuard(async (_user) => {
    // Prefer internal call to reuse API error shapes
    const base = buildBaseUrl()
    const url = base ? `${base}/api/rewards/me` : "/api/rewards/me"
    let initial: any = { ok: false, reason: "bootstrap" }
    try {
      const res = await fetch(url, { cache: "no-store" })
      initial = await res.json()
    } catch {
      initial = { ok: false, reason: "fetch_failed" }
    }
    return <RewardsClient initial={initial} />
  }, { requireEmailVerification: false }) // Rewards can be viewed without email verification
}
