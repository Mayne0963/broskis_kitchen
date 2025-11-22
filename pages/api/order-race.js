import { adminDb } from '../../src/lib/firebase/admin'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Determine target delivery date (YYYY-MM-DD)
    const now = new Date()
    const queryDate = typeof req.query?.date === 'string' ? req.query.date : null
    let targetDeliveryDate
    if (queryDate && /^\d{4}-\d{2}-\d{2}$/.test(queryDate)) {
      targetDeliveryDate = queryDate
    } else {
      const tomorrow = new Date(now)
      tomorrow.setDate(now.getDate() + 1)
      targetDeliveryDate = tomorrow.toISOString().slice(0, 10)
    }

    const cutoff = getCutoffForDeliveryDate(targetDeliveryDate)
    const raceClosed = now > cutoff

    // Fetch only orders for the target delivery date
    const allowedShifts = ['1st', '2nd', '3rd']
    const snapshot = await adminDb
      .collection('orders')
      .where('deliveryDate', '==', targetDeliveryDate)
      .where('workplaceShift', 'in', allowedShifts)
      .get()

    const orders = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((o) => {
        const name = (o.workplaceName || '').trim()
        const shift = o.workplaceShift || ''
        return name.length > 0 && allowedShifts.includes(shift)
      })

    // Group by shift, then workplaceName
    const byShift = { '1st': {}, '2nd': {}, '3rd': {} }
    for (const o of orders) {
      const shift = o.workplaceShift
      const name = o.workplaceName.trim()
      byShift[shift][name] = (byShift[shift][name] || 0) + 1
    }

    // Format output arrays per shift
    const formatShift = (obj) =>
      Object.entries(obj)
        .map(([workplaceName, count]) => ({ workplaceName, orders: count }))
        .sort((a, b) => b.orders - a.orders)

    const MAX_PLATES = 22
    const response = {
      maxPlates: MAX_PLATES,
      deliveryDate: targetDeliveryDate,
      raceClosed,
      shifts: {
        '1st': formatShift(byShift['1st']),
        '2nd': formatShift(byShift['2nd']),
        '3rd': formatShift(byShift['3rd']),
      },
    }

    return res.status(200).json(response)
  } catch (err) {
    console.error('order-race error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

function getCutoffForDeliveryDate(deliveryDateStr) {
  const [year, month, day] = deliveryDateStr.split('-').map((v) => parseInt(v, 10))
  const deliveryDate = new Date(year, month - 1, day)
  const cutoffDate = new Date(deliveryDate)
  cutoffDate.setDate(deliveryDate.getDate() - 1)
  cutoffDate.setHours(20, 0, 0, 0) // 8:00 PM local time
  return cutoffDate
}