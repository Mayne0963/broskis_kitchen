import { Timestamp } from 'firebase-admin/firestore';

export function toOrderDocFromSession(session: any, lineItems: any[]) {
  return {
    id: session.id,
    source: "stripe",
    status: "paid",
    userId: session.metadata?.userId || session.client_reference_id || null,
    email: session.customer_details?.email || null,
    amount: session.amount_total ?? null,
    currency: session.currency ?? "usd",
    items: lineItems?.map(i => ({
      name: i.description,
      quantity: i.quantity,
      amount_subtotal: i.amount_subtotal,
      amount_total: i.amount_total
    })) || [],
    createdAt: Timestamp.now()
  };
}