import { CATERING_PACKAGES, ADDONS, DEPOSIT_PCT } from "@/config/catering";

export function calcPrice(pkgId: string, guests: number, addons: any[]) {
  const pkg = CATERING_PACKAGES.find(p => p.id === pkgId)!;
  const base = pkg.pricePerGuest * guests;
  
  let addonsTotal = 0;
  for (const a of addons) {
    const def = ADDONS.find(x => x.id === a.id);
    if (!def) continue;
    
    if (def.type === "flat" || def.type === "unit") {
      addonsTotal += def.price * (a.qty || 1);
    }
    if (def.type === "perGuest") {
      addonsTotal += def.price * guests * (a.qty || 1);
    }
    if (def.type === "hour") {
      addonsTotal += def.price * (a.hours || a.qty || 1);
    }
  }
  
  const subtotal = base + addonsTotal;
  const deposit = subtotal * DEPOSIT_PCT;
  
  return {
    subtotal,
    deposit,
    addons: addonsTotal,
    perGuest: pkg.pricePerGuest,
    total: subtotal,
    currency: "USD"
  };
}