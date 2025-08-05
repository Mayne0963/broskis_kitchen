import { redirect } from 'next/navigation'
import AdminDashboard from '@/components/admin/AdminDashboard'
import { verifyAdminAccess } from '@/lib/auth/rbac'

// Mock function to fetch admin data
async function getAdminData() {
  // TODO: Replace with actual database queries
  return {
    stats: {
      totalOrders: 1247,
      totalRevenue: 45678.90,
      activeMenuDrops: 3,
      totalUsers: 892,
      rewardsRedeemed: 156,
      averageOrderValue: 36.65
    },
    recentOrders: [
      {
        id: 'BK-1234567890',
        customerName: 'John Doe',
        items: ['Signature Burger', 'Fries'],
        total: 24.99,
        status: 'preparing',
        orderTime: new Date(Date.now() - 15 * 60 * 1000),
        estimatedReady: new Date(Date.now() + 10 * 60 * 1000)
      },
      {
        id: 'BK-1234567891',
        customerName: 'Jane Smith',
        items: ['Chicken Wings', 'Caesar Salad'],
        total: 32.50,
        status: 'ready',
        orderTime: new Date(Date.now() - 25 * 60 * 1000),
        estimatedReady: new Date(Date.now() - 5 * 60 * 1000)
      },
      {
        id: 'BK-1234567892',
        customerName: 'Mike Johnson',
        items: ['Pizza Margherita', 'Garlic Bread'],
        total: 28.75,
        status: 'delivered',
        orderTime: new Date(Date.now() - 45 * 60 * 1000),
        deliveredTime: new Date(Date.now() - 10 * 60 * 1000)
      }
    ],
    menuDrops: [
      {
        id: '1',
        name: 'Weekend BBQ Special',
        status: 'active',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 22 * 60 * 60 * 1000),
        totalQuantity: 50,
        soldQuantity: 23,
        revenue: 1150.00
      },
      {
        id: '2',
        name: 'Taco Tuesday Drop',
        status: 'scheduled',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
        totalQuantity: 75,
        soldQuantity: 0,
        revenue: 0
      },
      {
        id: '3',
        name: 'Friday Fish Fry',
        status: 'ended',
        startTime: new Date(Date.now() - 72 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 48 * 60 * 60 * 1000),
        totalQuantity: 40,
        soldQuantity: 40,
        revenue: 1600.00
      }
    ],
    rewardsData: {
      totalPointsIssued: 125000,
      totalPointsRedeemed: 87500,
      activeOffers: 5,
      totalRedemptions: 234,
      topRedemptions: [
        { offer: 'Free Appetizer', count: 45, points: 22500 },
        { offer: 'Free Delivery', count: 67, points: 20100 },
        { offer: '20% Off Next Order', count: 28, points: 21000 }
      ]
    }
  }
}

export default async function AdminPage() {
  const verification = await verifyAdminAccess()
  
  if (!verification.success) {
    redirect('/auth/login?redirect=/admin')
  }
  
  const adminData = await getAdminData()
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDashboard data={adminData} />
    </div>
  )
}