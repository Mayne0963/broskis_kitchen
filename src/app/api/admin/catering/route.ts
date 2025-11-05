import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions as any);
  if (!session || (session.user as any)?.role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Try Prisma cateringOrder model; if it doesn't exist, return mock data
    // @ts-expect-error model may not exist yet
    if (prisma.cateringOrder?.findMany) {
      // @ts-expect-error model may not exist yet
      const orders = await prisma.cateringOrder.findMany({ orderBy: { createdAt: "desc" } });
      return NextResponse.json(orders);
    }
  } catch (err) {
    console.warn("Prisma cateringOrder model not available, using mock data");
  }

  const mock = [
    { id: "1", clientName: "Acme Corp", date: "2025-11-05", status: "pending" },
    { id: "2", clientName: "Tech Bros LLC", date: "2025