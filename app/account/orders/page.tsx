import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OrdersTable from "./OrdersTable";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session) return <div className="p-6">Please sign in.</div>;
  const userId = session.user.id;
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">My Orders</h1>
      <OrdersTable userId={userId} />
    </main>
  );
}