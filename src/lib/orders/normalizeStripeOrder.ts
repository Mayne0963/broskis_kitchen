import { Timestamp } from 'firebase-admin/firestore';
import { isTestOrder, markAsTestOrder } from './isTestOrder';

function normalizeCurrency(currency?: string | null) {
  return currency?.toLowerCase?.() || 'usd';
}

export function toOrderDocFromSession(session: any, lineItems: any[]) {
  const email = session.metadata?.userEmail || session.customer_details?.email || session.customer_email || null;
  const normalizedEmail = email ? String(email).toLowerCase() : null;

  const items = (lineItems || []).map((i: any) => ({
    id: i.id,
    productId: typeof i?.price?.product === 'string' ? i.price.product : null,
    priceId: i?.price?.id || null,
    name: i?.description || i?.price?.nickname || 'Item',
    quantity: i?.quantity ?? 0,
    amount_subtotal: i?.amount_subtotal ?? null,
    amount_total: i?.amount_total ?? null,
  }));

  const createdAt = session.created
    ? Timestamp.fromMillis(session.created * 1000)
    : Timestamp.now();

  const amountTotalCents = typeof session.amount_total === 'number' ? session.amount_total : null;
  const amountSubtotalCents = typeof session.amount_subtotal === 'number' ? session.amount_subtotal : null;
  const totalDollars = typeof amountTotalCents === 'number' ? amountTotalCents / 100 : null;
  const subtotalDollars = typeof amountSubtotalCents === 'number' ? amountSubtotalCents / 100 : null;

  const initialTags = session.metadata?.tags;
  const tags = Array.isArray(initialTags)
    ? [...initialTags]
    : typeof initialTags === 'string'
    ? initialTags.split(',').map((t: string) => t.trim()).filter(Boolean)
    : [];

  const baseOrder: any = {
    id: session.id,
    source: "stripe",
    status: session.payment_status === "paid" ? "paid" : session.payment_status || "pending",
    userId: session.metadata?.userId || session.client_reference_id || null,
    userEmail: normalizedEmail,
    userEmailRaw: email,
    customerName: session.customer_details?.name || session.metadata?.customerName || null,
    customerPhone: session.customer_details?.phone || session.metadata?.customerPhone || null,
    // Lunch Drop fields (optional)
    workplaceName: session.metadata?.workplaceName || null,
    workplaceShift: session.metadata?.workplaceShift || null,
    // Delivery date (YYYY-MM-DD): prefer metadata.deliveryDate if valid, else tomorrow
    deliveryDate: (() => {
      const v = session.metadata?.deliveryDate;
      const isValid = typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
      if (isValid) return v;
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      return tomorrow.toISOString().slice(0, 10);
    })(),
    amount: amountTotalCents,
    amount_total: amountTotalCents,
    amount_subtotal: amountSubtotalCents,
    totalCents: amountTotalCents,
    subtotalCents: amountSubtotalCents,
    total: totalDollars,
    subtotal: subtotalDollars,
    currency: normalizeCurrency(session.currency),
    items,
    metadata: {
      stripeSessionId: session.id,
      ...session.metadata,
    },
    tags,
    createdAt,
    updatedAt: Timestamp.now(),
  };

  const testCheck = {
    ...baseOrder,
    amount_total: session.amount_total,
    currency: session.currency,
  };

  const finalOrder = isTestOrder(testCheck) ? markAsTestOrder(baseOrder) : baseOrder;
  if (finalOrder.userEmail && !finalOrder.userEmailLower) {
    finalOrder.userEmailLower = String(finalOrder.userEmail).toLowerCase();
  }

  return finalOrder;
}
