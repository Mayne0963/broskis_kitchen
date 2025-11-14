export type PersistedItem = {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  customizations?: Record<string, any[]>
}

export type OrderPayload = {
  items: PersistedItem[]
  subtotal: number
  tax: number
  total: number
  updatedAt: string
}

const SESSION_KEY = 'bk_current_order'
const SNAPSHOT_KEY = 'bk_order_snapshot'
const TTL_MS = 24 * 60 * 60 * 1000

function safeParse<T>(s: string | null): T | null {
  if (!s) return null
  try {
    return JSON.parse(s) as T
  } catch {
    return null
  }
}

function nowISO() {
  return new Date().toISOString()
}

export function isExpired(savedAt: string, ttlMs: number = TTL_MS) {
  const t = Date.parse(savedAt)
  if (Number.isNaN(t)) return true
  return Date.now() - t > ttlMs
}

function normalizeItem(it: any): PersistedItem | null {
  const id = String(it?.id ?? '')
  const name = typeof it?.name === 'string' ? it.name : String(it?.name ?? 'Item')
  const price = Number(it?.price ?? 0)
  const quantity = Math.max(1, Number(it?.quantity ?? 1))
  if (!id) return null
  if (!Number.isFinite(price) || price < 0) return null
  if (!Number.isFinite(quantity) || quantity < 1) return null
  const customizations = it?.customizations ? Object.fromEntries(Object.entries(it.customizations).map(([k, v]) => [k, Array.isArray(v) ? v : [v].filter(Boolean)])) : undefined
  return { id, name, price, quantity, image: it?.image, customizations }
}

function computeTotals(items: PersistedItem[]) {
  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0)
  const tax = subtotal * 0.0825
  const total = subtotal + tax
  return { subtotal, tax, total }
}

export function validateOrder(order: any): OrderPayload | null {
  const rawItems = Array.isArray(order?.items) ? order.items : []
  const items = rawItems.map(normalizeItem).filter(Boolean) as PersistedItem[]
  const { subtotal, tax, total } = computeTotals(items)
  const updatedAt = typeof order?.updatedAt === 'string' ? order.updatedAt : nowISO()
  if (items.length === 0) return null
  return { items, subtotal, tax, total, updatedAt }
}

export function saveSessionOrder(order: OrderPayload) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(order))
  } catch {}
}

export function loadSessionOrder(): OrderPayload | null {
  if (typeof window === 'undefined') return null
  try {
    const parsed = safeParse<any>(sessionStorage.getItem(SESSION_KEY))
    const valid = validateOrder(parsed)
    return valid
  } catch {
    return null
  }
}

export function clearSessionOrder() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {}
}

export function saveLocalSnapshot(order: OrderPayload) {
  if (typeof window === 'undefined') return
  try {
    const payload = { order, savedAt: nowISO() }
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(payload))
  } catch {}
}

export function loadLocalSnapshot(): { order: OrderPayload, savedAt: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const parsed = safeParse<any>(localStorage.getItem(SNAPSHOT_KEY))
    if (!parsed || !parsed.order || !parsed.savedAt) return null
    const validOrder = validateOrder(parsed.order)
    if (!validOrder) return null
    return { order: validOrder, savedAt: String(parsed.savedAt) }
  } catch {
    return null
  }
}

export function clearLocalSnapshot() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(SNAPSHOT_KEY)
  } catch {}
}

export function makeOrderPayload(items: PersistedItem[]): OrderPayload {
  const { subtotal, tax, total } = computeTotals(items)
  return { items, subtotal, tax, total, updatedAt: nowISO() }
}