import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import CheckoutClient from '@/components/checkout/CheckoutClient'

// Mock function to get cart data - replace with actual implementation
async function getCartData(userId: string) {
  // TODO: Replace with actual API call to get cart data
  return {
    items: [
      {
        id: '1',
        name: 'Broski Burger Deluxe',
        description: 'Wagyu beef, truffle aioli, aged cheddar',
        price: 24.99,
        quantity: 2,
        image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=gourmet_burger_with_wagyu_beef_truffle_aioli_aged_cheddar_restaurant_photography&image_size=square',
        customizations: ['Extra cheese', 'No pickles']
      },
      {
        id: '2',
        name: 'Truffle Fries',
        description: 'Hand-cut fries with truffle oil and parmesan',
        price: 12.99,
        quantity: 1,
        image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=truffle_fries_hand_cut_parmesan_gourmet_food_photography&image_size=square',
        customizations: []
      }
    ],
    subtotal: 62.97,
    tax: 5.67,
    deliveryFee: 3.99,
    total: 72.63
  }
}

// Mock function to get user addresses - replace with actual implementation
async function getUserAddresses(userId: string) {
  // TODO: Replace with actual API call
  return [
    {
      id: '1',
      type: 'home',
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      isDefault: true
    },
    {
      id: '2',
      type: 'work',
      street: '456 Market St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      isDefault: false
    }
  ]
}

// Mock function to get user payment methods - replace with actual implementation
async function getPaymentMethods(userId: string) {
  // TODO: Replace with actual API call
  return [
    {
      id: '1',
      type: 'card',
      last4: '4242',
      brand: 'visa',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true
    },
    {
      id: '2',
      type: 'card',
      last4: '5555',
      brand: 'mastercard',
      expiryMonth: 8,
      expiryYear: 2026,
      isDefault: false
    }
  ]
}

export default async function CheckoutPage() {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get('session')
  
  if (!sessionCookie) {
    redirect('/login?redirect=/checkout')
  }
  
  // TODO: Verify session and get user ID
  const userId = 'mock-user-id' // Replace with actual user ID from session
  
  try {
    const [cartData, addresses, paymentMethods] = await Promise.all([
      getCartData(userId),
      getUserAddresses(userId),
      getPaymentMethods(userId)
    ])
    
    return (
      <div className="min-h-screen bg-[var(--color-rich-black)] py-8">
        <div className="container mx-auto px-4">
          <CheckoutClient 
            cartData={cartData}
            addresses={addresses}
            paymentMethods={paymentMethods}
            userId={userId}
          />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Failed to load checkout data:', error)
    return (
      <div className="min-h-screen bg-[var(--color-rich-black)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Unable to Load Checkout</h1>
          <p className="text-gray-400 mb-6">Please try again or contact support if the problem persists.</p>
          <a 
            href="/cart" 
            className="bg-[var(--color-harvest-gold)] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[var(--color-harvest-gold)]/90 transition-colors"
          >
            Return to Cart
          </a>
        </div>
      </div>
    )
  }
}