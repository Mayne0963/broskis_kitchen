import { PaymentMethods } from '@/components/dashboard/PaymentMethods';
import { SavedAddresses } from '@/components/dashboard/SavedAddresses';
import { PaymentHistory } from '@/components/dashboard/PaymentHistory';
import { OrderHistory } from '@/components/dashboard/OrderHistory';

export default async function DashboardPage() {
  // TODO: Fetch real data from API endpoints (e.g., await fetch('/api/user/payment-methods'))
  // Replace with actual fetching logic in production
  const paymentMethods = [
    { id: 'card1', type: 'Visa', last4: '1234', expiry: '12/25' },
    { id: 'wallet1', type: 'Apple Pay', last4: 'N/A', expiry: 'N/A' },
  ];

  const addresses = [
    { id: 'addr1', label: 'Home', street: '123 Main St', city: 'Anytown', state: 'CA', zip: '12345' },
    { id: 'addr2', label: 'Work', street: '456 Office Blvd', city: 'Busytown', state: 'NY', zip: '67890' },
  ];

  const paymentHistory = [
    { id: 'pay1', date: '2023-10-01', amount: 45.99, method: 'Visa ****1234', status: 'Completed' },
    { id: 'pay2', date: '2023-09-15', amount: 32.50, method: 'Apple Pay', status: 'Refunded' },
  ];

  const orderHistory = [
    { id: 'ord1', date: '2023-10-01', items: 'Burger x1, Fries x1', total: 25.99 },
    { id: 'ord2', date: '2023-09-15', items: 'Sandwich x2', total: 19.98 },
  ];

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