import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function GET() {
  const session = await getServerSession(authOptions as any);
  if (!session || (session.user as any)?.role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Return mock data until Prisma or Firestore integration is ready
  const mock = [
    { id: "1", clientName: "Acme Corp", date: "2025-11-05", status: "pending" },
    { id: "2", clientName: "Tech Bros LLC", date: "2025-11-06", status: "confirmed" },
    { id: "3", clientName: "Broskis Kitchen", date: "2025-11-07", status: "archived" },
  ];
  return NextResponse.json(mock);
}