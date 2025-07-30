import { Suspense } from 'react'
import DropCard from '@/components/menu-drops/DropCard'
import DropSchedule from '@/components/menu-drops/DropSchedule'
import { getSessionCookie } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// Mock data for now - will be replaced with actual API calls
const mockActiveDrops = [
  {
    id: '1',
    name: 'Truffle Mac & Cheese Drop',
    description: 'Limited edition truffle-infused mac & cheese with aged gruyere',
    image: '/images/truffle-fries.jpg',
    price: 18.99,
    availableQuantity: 25,
    totalQuantity: 50,
    endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    isActive: true
  },
  {
    id: '2', 
    name: 'Wagyu Slider Trio',
    description: 'Three premium wagyu sliders with house-made sauces',
    image: '/images/wagyu-sandwich.jpg',
    price: 24.99,
    availableQuantity: 12,
    totalQuantity: 30,
    endsAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
    isActive: true
  }
]

const mockScheduledDrops = [
  {
    id: '3',
    name: 'Infused Brownie Bites',
    description: 'Premium cannabis-infused chocolate brownies (21+ only)',
    image: '/images/infused-brownie.jpg',
    price: 15.99,
    scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    notifyCount: 47
  }
]

export default async function MenuDropsPage() {
  const session = await getSessionCookie()
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-[#1A1A1A] text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[var(--color-harvest-gold)]">
            Limited Menu Drops
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Exclusive, limited-time menu items crafted by our chefs. When they're gone, they're gone!
          </p>
        </div>
        
        {/* Active Drops Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-semibold text-[var(--color-harvest-gold)]">
              Available Now
            </h2>
            <div className="flex items-center text-green-400">
              <div className="w-3 h-3 bg-gold-foil rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm font-medium">Live</span>
            </div>
          </div>
          
          {mockActiveDrops.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mockActiveDrops.map(drop => (
                <Suspense key={drop.id} fallback={
                  <div className="bg-[var(--color-dark-charcoal)] rounded-lg p-6 animate-pulse">
                    <div className="h-48 bg-gray-700 rounded mb-4"></div>
                    <div className="h-6 bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-700 rounded"></div>
                  </div>
                }>
                  <DropCard drop={drop} isActive={true} userId={session?.uid} />
                </Suspense>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-[var(--color-dark-charcoal)] rounded-lg border border-[var(--color-harvest-gold)]/20">
              <p className="text-gray-400 text-lg">No active drops right now. Check back soon!</p>
            </div>
          )}
        </section>
        
        {/* Scheduled Drops Section */}
        <section>
          <h2 className="text-3xl font-semibold mb-8 text-[var(--color-harvest-gold)]">
            Coming Soon
          </h2>
          <Suspense fallback={
            <div className="bg-[var(--color-dark-charcoal)] rounded-lg p-6 animate-pulse">
              <div className="h-32 bg-gray-700 rounded"></div>
            </div>
          }>
            <DropSchedule drops={mockScheduledDrops} userId={session?.uid} />
          </Suspense>
        </section>
      </div>
    </div>
  )
}