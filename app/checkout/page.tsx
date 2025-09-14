"use client"

import CheckoutClient from '../../src/components/checkout/CheckoutClient'

// minimal client helper to start payment
async function startPayment(currentItems: any[]) {
  const res = await fetch("/api/checkout/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: currentItems }),
  });
  const j = await res.json();
  if (j?.url) window.location.href = j.url;
}

export default function CheckoutPage() {
  // Provide default props to prevent undefined errors
  const defaultCartData = {
    items: [],
    subtotal: 0,
    tax: 0,
    deliveryFee: 0,
    total: 0
  };
  
  const defaultAddresses: any[] = [];
  const defaultPaymentMethods: any[] = [];
  
  return (
    <CheckoutClient 
      cartData={defaultCartData}
      addresses={defaultAddresses}
      paymentMethods={defaultPaymentMethods}
      userId=""
      isAuthenticated={false}
      userEmail=""
    />
  )
}