"use client";

import { PaymentMethods } from "../../components/dashboard/PaymentMethods";
import { SavedAddresses } from "../../components/dashboard/SavedAddresses";
import { PaymentHistory } from "../../components/dashboard/PaymentHistory";
import { OrderHistory } from "../../components/dashboard/OrderHistory";
import { useEffect, useState } from "react";
import { useAuth } from "../../lib/context/AuthContext"; // Assuming AuthContext provides user info

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      if (!currentUser || !currentUser.uid) {
        setLoading(false);
        return;
      }

      try {
        // Fetch Order History
        const ordersRes = await fetch(`/api/orders?userId=${currentUser.uid}`);
        if (!ordersRes.ok) {
          throw new Error(`HTTP error! status: ${ordersRes.status}`);
        }
        const ordersData = await ordersRes.json();
        setOrderHistory(ordersData.orders || []);

        // TODO: Implement API endpoints for payment methods, saved addresses, and payment history
        // For now, using placeholder data or empty arrays
        setPaymentMethods([]); // Replace with actual fetch from /api/payment-methods
        setAddresses([]); // Replace with actual fetch from /api/addresses
        setPaymentHistory([]); // Replace with actual fetch from /api/payment-history

      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentUser]);

  if (loading) {
    return <div className="min-h-screen bg-[#1A1A1A] p-4 md:p-8 text-white text-center">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-[#1A1A1A] p-4 md:p-8 text-white text-center text-red-500">Error: {error}</div>;
  }

  if (!currentUser) {
    return <div className="min-h-screen bg-[#1A1A1A] p-4 md:p-8 text-white text-center">Please log in to view your dashboard.</div>;
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] p-4 md:p-8 text-white">
      <h1 className="text-3xl font-bold mb-6 text-center text-[var(--color-harvest-gold)]">User Dashboard</h1>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <PaymentMethods methods={paymentMethods} />
        <SavedAddresses addresses={addresses} />
        <PaymentHistory history={paymentHistory} />
        <OrderHistory orders={orderHistory} />
      </div>
    </div>
  );
}
