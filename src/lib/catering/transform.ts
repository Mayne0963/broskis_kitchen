/**
 * Catering Data Transformation Utilities
 * Handles mapping between Firestore documents and normalized catering data structures
 * Supports both new nested format and legacy flat format for backward compatibility
 */

/**
 * Safely converts various timestamp formats to milliseconds epoch
 * Handles Firestore timestamps, ISO strings, numbers, and undefined values
 */
export function toMsEpoch(v: any): number | undefined {
  if (!v) return undefined;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const t = Date.parse(v);
    return Number.isNaN(t) ? undefined : t;
  }
  if (v?._seconds) return v._seconds * 1000;
  return undefined;
}

/**
 * Maps Firestore document data to normalized catering request structure
 * Handles both nested (new) and flat (legacy) document formats
 * Provides fallbacks for all fields to ensure backward compatibility
 */
export function mapDoc(id: string, data: any) {
  const createdAt = toMsEpoch(data?.createdAt) ?? Date.now();
  const perGuest = data?.price?.perGuest ?? data?.price?.perProfit ?? undefined;

  return {
    id: id || data?.id,
    createdAt,
    event: {
      address: data?.event?.address ?? data?.address,
      date: data?.event?.date ?? data?.date,
      guests: data?.event?.guests ?? data?.guests,
    },
    customer: {
      name: data?.customer?.name ?? data?.name,
      email: data?.customer?.email ?? data?.email,
    },
    price: {
      currency: data?.price?.currency ?? "USD",
      addons: data?.price?.addons ?? 0,
      deposit: data?.price?.deposit,
      perGuest,
      subtotal: data?.price?.subtotal,
      total: data?.price?.total ?? data?.totalEstimate,
    },
    stripe: {
      checkoutUrl: data?.stripe?.checkoutUrl,
    },
    packageTier: data?.packageTier ?? data?.package ?? "standard",
    notes: data?.notes ?? "",
    status: (data?.status ?? "new").toString().toLowerCase(),
    
    // Legacy fields for backward compatibility
    name: data?.customer?.name ?? data?.name,
    email: data?.customer?.email ?? data?.email,
    phone: data?.phone,
    guestCount: data?.event?.guests ?? data?.guests,
    eventDate: toMsEpoch(data?.event?.date ?? data?.date),
    totalEstimate: data?.price?.total ?? data?.totalEstimate,
    selections: data?.selections,
    source: data?.source,
    updatedAt: toMsEpoch(data?.updatedAt),
  };
}