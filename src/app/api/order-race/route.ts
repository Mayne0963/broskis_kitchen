import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

type ShiftKey = "1st" | "2nd" | "3rd";

const ALLOWED_SHIFTS: ShiftKey[] = ["1st", "2nd", "3rd"];
const MAX_PLATES = 22;

function isValidDateString(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getTargetDeliveryDate(searchParams: URLSearchParams): string {
  const queryDate = searchParams.get("date");
  if (isValidDateString(queryDate)) return queryDate;

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

function getCutoffForDeliveryDate(deliveryDateStr: string): Date {
  const [year, month, day] = deliveryDateStr.split("-").map((v) => parseInt(v, 10));
  const deliveryDate = new Date(year, month - 1, day);
  const cutoffDate = new Date(deliveryDate);
  cutoffDate.setDate(deliveryDate.getDate() - 1);
  cutoffDate.setHours(20, 0, 0, 0); // 8:00 PM local time
  return cutoffDate;
}

export async function GET(req: NextRequest) {
  try {
    const targetDeliveryDate = getTargetDeliveryDate(req.nextUrl.searchParams);
    const now = new Date();
    const cutoff = getCutoffForDeliveryDate(targetDeliveryDate);
    const raceClosed = now > cutoff;

    const snapshot = await adminDb
      .collection("orders")
      .where("deliveryDate", "==", targetDeliveryDate)
      .where("workplaceShift", "in", ALLOWED_SHIFTS)
      .get();

    const byShift: Record<ShiftKey, Record<string, number>> = {
      "1st": {},
      "2nd": {},
      "3rd": {},
    };

    snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .forEach((order) => {
        const name = typeof order.workplaceName === "string" ? order.workplaceName.trim() : "";
        const shift = order.workplaceShift as ShiftKey | undefined;
        if (!name || !shift || !ALLOWED_SHIFTS.includes(shift)) return;
        byShift[shift][name] = (byShift[shift][name] || 0) + 1;
      });

    const formatShift = (obj: Record<string, number>) =>
      Object.entries(obj)
        .map(([workplaceName, count]) => ({ workplaceName, orders: count }))
        .sort((a, b) => b.orders - a.orders);

    return NextResponse.json({
      maxPlates: MAX_PLATES,
      deliveryDate: targetDeliveryDate,
      raceClosed,
      shifts: {
        "1st": formatShift(byShift["1st"]),
        "2nd": formatShift(byShift["2nd"]),
        "3rd": formatShift(byShift["3rd"]),
      },
    });
  } catch (err) {
    console.error("order-race error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
