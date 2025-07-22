"use client";

import { PaymentMethods } from "../../components/dashboard/PaymentMethods";
import { SavedAddresses } from "../../components/dashboard/SavedAddresses";
import { PaymentHistory } from "../../components/dashboard/PaymentHistory";
import { OrderHistory } from "../../components/dashboard/OrderHistory";
import { useAuth } from "@/lib/context/AuthContext";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { user: currentUser } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      // Fetch payment methods
      const pmRes = await fetch('/api/user/payment-methods');
      if (pmRes.ok) setPaymentMethods(await pmRes.json());

      // Fetch addresses
      const addrRes = await fetch('/api/user/addresses');
      if (addrRes.ok) setAddresses(await addrRes.json());

      // Fetch payment history
      const phRes = await fetch('/api/user/payment-history');
      if (phRes.ok) setPaymentHistory(await phRes.json());

      // Fetch order history
      const ohRes = await fetch(`/api/orders?userId=${currentUser.id}`);
      if (ohRes.ok) {
        const { orders } = await ohRes.json();
        setOrderHistory(orders.map((order: { id: string; createdAt: string; items: { name: string }[]; total: number }) => ({
          id: order.id,
          date: order.createdAt,
          items: order.items.map(item => item.name).join(', '),
          total: order.total
        })));
      }
    };
    fetchData();
  }, [currentUser]);

  if (!currentUser) {
    return <div className="text-center py-8 text-[var(--color-harvest-gold)]">Please log in to view your dashboard.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-[#1A1A1A] text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-[var(--color-harvest-gold)]">User Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <OrderHistory orders={orderHistory} />
          <PaymentMethods methods={paymentMethods} />
          <SavedAddresses addresses={addresses} />
          <PaymentHistory history={paymentHistory} />
        </div>
      </div>
    </div>
  );
}
