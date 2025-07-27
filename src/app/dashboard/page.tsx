import { headers } from "next/headers";
import { getSessionCookie } from "@/lib/auth/session";
import DashboardClient from "@/components/dashboard/DashboardClient";
import ProductionErrorBoundary from "@/components/common/ProductionErrorBoundary";
import { handleServerError } from "@/lib/utils/errorLogger";

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  try {
    const session = await getSessionCookie();

    if (!session) {
      return (
        <ProductionErrorBoundary>
          <div className="text-center py-8 text-[var(--color-harvest-gold)]">Please log in to view your dashboard.</div>
        </ProductionErrorBoundary>
      );
    }

    const headersList = await headers();
    const cookieHeader = headersList.get('cookie') || '';
    
    // Get the base URL for absolute fetch calls
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Add timeout and better error handling for fetch calls
    const fetchWithTimeout = async (url: string, options: any, timeout = 30000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          cache: 'no-store'
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
         clearTimeout(timeoutId);
         if (error.name === 'AbortError') {
           console.warn(`Request timeout for ${url}`);
           return new Response(JSON.stringify({ error: 'Request timeout' }), { status: 408 });
         }
         handleServerError(error as Error, `Dashboard fetch: ${url}`);
         throw error;
       }
    };

    let pmRes, addrRes, phRes, ohRes;
    
    try {
      [pmRes, addrRes, phRes, ohRes] = await Promise.allSettled([
        fetchWithTimeout(`${baseUrl}/api/user/payment-methods`, { cache: 'no-store', headers: { cookie: cookieHeader } }),
        fetchWithTimeout(`${baseUrl}/api/user/addresses`, { cache: 'no-store', headers: { cookie: cookieHeader } }),
        fetchWithTimeout(`${baseUrl}/api/user/payment-history`, { cache: 'no-store', headers: { cookie: cookieHeader } }),
        fetchWithTimeout(`${baseUrl}/api/orders?userId=${session.uid}`, { cache: 'no-store', headers: { cookie: cookieHeader } }),
      ]);
    } catch (error) {
      console.error('Promise.allSettled failed:', error);
      // Return with empty data if all requests fail
      pmRes = { status: 'rejected', reason: error };
      addrRes = { status: 'rejected', reason: error };
      phRes = { status: 'rejected', reason: error };
      ohRes = { status: 'rejected', reason: error };
    }
    
    // Handle API responses with proper error handling
    let paymentMethods = [];
    let addresses = [];
    let paymentHistory = [];
    let orderHistory = [];
    
    try {
      if (pmRes.status === 'fulfilled' && pmRes.value.ok) {
        paymentMethods = await pmRes.value.json();
      }
    } catch (error) {
      console.error('Failed to parse payment methods:', error);
    }
    
    try {
      if (addrRes.status === 'fulfilled' && addrRes.value.ok) {
        addresses = await addrRes.value.json();
      }
    } catch (error) {
      console.error('Failed to parse addresses:', error);
    }
    
    try {
      if (phRes.status === 'fulfilled' && phRes.value.ok) {
        paymentHistory = await phRes.value.json();
      }
    } catch (error) {
      console.error('Failed to parse payment history:', error);
    }
    
    try {
      if (ohRes.status === 'fulfilled' && ohRes.value.ok) {
        const orderData = await ohRes.value.json();
        const orders = orderData.orders || [];
        orderHistory = orders.map((order: any) => ({
          id: order.id,
          date: order.createdAt,
          items: order.items?.map((item: any) => item.name).join(', ') || 'No items',
          total: order.total
        }));
      }
    } catch (error) {
      console.error('Failed to parse order history:', error);
    }

    return (
      <ProductionErrorBoundary>
        <DashboardClient
          initialPaymentMethods={paymentMethods}
          initialAddresses={addresses}
          initialPaymentHistory={paymentHistory}
          initialOrderHistory={orderHistory}
          userId={session.uid}
        />
      </ProductionErrorBoundary>
    );
  } catch (error) {
     const errorDetails = handleServerError(error as Error, 'Dashboard page main');
     console.error('Dashboard page error:', errorDetails);
    
    return (
      <ProductionErrorBoundary>
        <div className="text-center py-8 text-[var(--color-harvest-gold)]">
          <h2 className="text-xl mb-4">Dashboard Error</h2>
          <p>Unable to load dashboard. Please try again later.</p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-4 text-xs bg-gray-900 p-4 rounded text-left overflow-auto">
              {error.message}
            </pre>
          )}
        </div>
      </ProductionErrorBoundary>
    );
  }
}