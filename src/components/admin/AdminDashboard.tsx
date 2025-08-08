'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ShoppingCart, 
  DollarSign, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle,
  Truck,
  Star,
  Gift,
  Zap,
  BarChart3,
  Download,
  FileText,
  Activity
} from 'lucide-react'
import OrdersTab from './OrdersTab'
import MenuDropsTab from './MenuDropsTab'
import RewardsTab from './RewardsTab'
import UserManagement from './UserManagement'

interface AdminDashboardProps {
  data: {
    stats: {
      totalOrders: number
      totalRevenue: number
      activeMenuDrops: number
      totalUsers: number
      rewardsRedeemed: number
      averageOrderValue: number
    }
    recentOrders: Array<{
      id: string
      customerName: string
      items: string[]
      total: number
      status: 'preparing' | 'ready' | 'delivered' | 'cancelled'
      orderTime: Date
      estimatedReady?: Date
      deliveredTime?: Date
    }>
    menuDrops: Array<{
      id: string
      name: string
      status: 'active' | 'scheduled' | 'ended'
      startTime: Date
      endTime: Date
      totalQuantity: number
      soldQuantity: number
      revenue: number
    }>
    rewardsData: {
      totalPointsIssued: number
      totalPointsRedeemed: number
      activeOffers: number
      totalRedemptions: number
      topRedemptions: Array<{
        offer: string
        count: number
        points: number
      }>
    }
  }
}

const StatCard = ({ title, value, icon: Icon, description, trend }: {
  title: string
  value: string | number
  icon: any
  description?: string
  trend?: string
}) => (
  <Card className="relative overflow-hidden border border-[#B7985A]/20 shadow-lg bg-gradient-to-br from-black to-gray-900/50 hover:shadow-xl hover:shadow-[#B7985A]/20 transition-all duration-300 group">
    <div className="absolute inset-0 bg-gradient-to-br from-[#B7985A]/5 to-[#D2BA6A]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
      <CardTitle className="text-sm font-semibold text-white tracking-wide">{title}</CardTitle>
      <div className="p-2 rounded-lg bg-gradient-to-br from-[#B7985A]/20 to-[#D2BA6A]/20 group-hover:from-[#B7985A]/30 group-hover:to-[#D2BA6A]/30 transition-all duration-300">
        <Icon className="h-5 w-5 text-[#FFD700]" />
      </div>
    </CardHeader>
    <CardContent className="relative z-10">
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      {description && (
        <p className="text-sm text-gray-300 mb-2">{description}</p>
      )}
      {trend && (
        <div className="flex items-center space-x-1">
          <TrendingUp className="h-3 w-3 text-[#FFD700]" />
          <p className="text-sm font-medium text-[#D2BA6A]">{trend}</p>
        </div>
      )}
    </CardContent>
  </Card>
)

const getStatusColor = (status: string) => {
  switch (status) {
    case 'preparing':
      return 'bg-gradient-to-r from-[#FFD700]/20 to-[#D2BA6A]/20 text-[#FFD700] border border-[#FFD700]/30'
    case 'ready':
      return 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border border-emerald-500/30'
    case 'delivered':
      return 'bg-gradient-to-r from-[#B7985A]/20 to-[#D2BA6A]/20 text-[#D2BA6A] border border-[#B7985A]/30'
    case 'cancelled':
      return 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border border-red-500/30'
    case 'active':
      return 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border border-emerald-500/30'
    case 'scheduled':
      return 'bg-gradient-to-r from-[#B7985A]/20 to-[#D2BA6A]/20 text-[#D2BA6A] border border-[#B7985A]/30'
    case 'ended':
      return 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-400 border border-gray-500/30'
    default:
      return 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-400 border border-gray-500/30'
  }
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export default function AdminDashboard({ data }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Modern Header with Broskis Gold Gradient Background */}
      <div className="bg-gradient-to-r from-black via-gray-900 to-black border-b border-[#B7985A]/20">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#B7985A] to-[#D2BA6A] shadow-lg shadow-[#B7985A]/20">
                  <BarChart3 className="h-8 w-8 text-black" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#FFD700] to-[#D2BA6A] bg-clip-text text-transparent">
                    Admin Dashboard
                  </h1>
                  <p className="text-gray-300 text-lg">
                    Manage orders, menu drops, and rewards from one place
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="bg-[#B7985A]/10 border-[#B7985A]/30 text-[#FFD700] hover:bg-[#B7985A]/20 backdrop-blur-sm">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-[#B7985A] to-[#D2BA6A] hover:from-[#D2BA6A] hover:to-[#B7985A] text-black border-0 shadow-lg shadow-[#B7985A]/30">
                <FileText className="h-4 w-4 mr-2" />
                View Reports
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <StatCard
            title="Total Orders"
            value={data.stats.totalOrders.toLocaleString()}
            icon={ShoppingCart}
            description="All time orders"
            trend="+12% from last month"
          />
          <StatCard
            title="Revenue"
            value={formatCurrency(data.stats.totalRevenue)}
            icon={DollarSign}
            description="Total revenue"
            trend="+8% from last month"
          />
          <StatCard
            title="Active Drops"
            value={data.stats.activeMenuDrops}
            icon={Zap}
            description="Currently running"
          />
          <StatCard
            title="Total Users"
            value={data.stats.totalUsers.toLocaleString()}
            icon={Users}
            description="Registered users"
            trend="+15% from last month"
          />
          <StatCard
            title="Rewards Redeemed"
            value={data.stats.rewardsRedeemed}
            icon={Gift}
            description="This month"
          />
          <StatCard
            title="Avg Order Value"
            value={formatCurrency(data.stats.averageOrderValue)}
            icon={TrendingUp}
            description="Per order"
            trend="+5% from last month"
          />
        </div>

        {/* Modern Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-gradient-to-r from-gray-900 to-black rounded-2xl shadow-lg border border-[#B7985A]/20 p-2">
            <TabsList className="grid w-full grid-cols-5 bg-black/50 rounded-xl p-1 h-14">
              <TabsTrigger 
                value="overview" 
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#B7985A] data-[state=active]:to-[#D2BA6A] data-[state=active]:shadow-md data-[state=active]:text-black text-gray-300 font-medium transition-all duration-200 flex items-center justify-center space-x-2 hover:text-[#FFD700]"
              >
                <Activity className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="orders" 
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#B7985A] data-[state=active]:to-[#D2BA6A] data-[state=active]:shadow-md data-[state=active]:text-black text-gray-300 font-medium transition-all duration-200 flex items-center justify-center space-x-2 hover:text-[#FFD700]"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Orders</span>
              </TabsTrigger>
              <TabsTrigger 
                value="menu-drops" 
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#B7985A] data-[state=active]:to-[#D2BA6A] data-[state=active]:shadow-md data-[state=active]:text-black text-gray-300 font-medium transition-all duration-200 flex items-center justify-center space-x-2 hover:text-[#FFD700]"
              >
                <Zap className="h-4 w-4" />
                <span>Menu Drops</span>
              </TabsTrigger>
              <TabsTrigger 
                value="rewards" 
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#B7985A] data-[state=active]:to-[#D2BA6A] data-[state=active]:shadow-md data-[state=active]:text-black text-gray-300 font-medium transition-all duration-200 flex items-center justify-center space-x-2 hover:text-[#FFD700]"
              >
                <Gift className="h-4 w-4" />
                <span>Rewards</span>
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#B7985A] data-[state=active]:to-[#D2BA6A] data-[state=active]:shadow-md data-[state=active]:text-black text-gray-300 font-medium transition-all duration-200 flex items-center justify-center space-x-2 hover:text-[#FFD700]"
              >
                <Users className="h-4 w-4" />
                <span>Users</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Recent Orders */}
              <Card className="border border-[#B7985A]/20 shadow-lg bg-gradient-to-br from-black to-gray-900/50 hover:shadow-xl hover:shadow-[#B7985A]/20 transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[#B7985A]/20 to-[#D2BA6A]/20">
                      <ShoppingCart className="h-5 w-5 text-[#FFD700]" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-white">Recent Orders</CardTitle>
                      <CardDescription className="text-gray-300">
                        Latest orders from customers
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.recentOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-900/50 to-black/50 border border-[#B7985A]/10 hover:shadow-md hover:border-[#B7985A]/30 transition-all duration-200">
                        <div className="space-y-2">
                          <p className="font-semibold text-white">{order.customerName}</p>
                          <p className="text-sm text-gray-300">
                            {order.items.join(', ')}
                          </p>
                          <p className="text-xs text-gray-400 flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(order.orderTime)}</span>
                          </p>
                        </div>
                        <div className="text-right space-y-2">
                          <p className="font-bold text-lg text-[#FFD700]">
                            {formatCurrency(order.total)}
                          </p>
                          <Badge className={`${getStatusColor(order.status)} font-medium px-3 py-1`}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Menu Drops Performance */}
              <Card className="border border-[#B7985A]/20 shadow-lg bg-gradient-to-br from-black to-gray-900/50 hover:shadow-xl hover:shadow-[#B7985A]/20 transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[#B7985A]/20 to-[#D2BA6A]/20">
                      <Zap className="h-5 w-5 text-[#FFD700]" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-white">Menu Drops Performance</CardTitle>
                      <CardDescription className="text-gray-300">
                        Current and recent menu drops
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.menuDrops.slice(0, 3).map((drop) => (
                      <div key={drop.id} className="p-4 rounded-xl bg-gradient-to-r from-gray-900/50 to-black/50 border border-[#B7985A]/10 hover:shadow-md hover:border-[#B7985A]/30 transition-all duration-200">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-semibold text-white">{drop.name}</p>
                          <Badge className={`${getStatusColor(drop.status)} font-medium px-3 py-1`}>
                            {drop.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-300 mb-3">
                          <span className="font-medium">{drop.soldQuantity}/{drop.totalQuantity} sold</span>
                          <span className="font-bold text-[#FFD700]">{formatCurrency(drop.revenue)}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-[#B7985A] to-[#D2BA6A] h-3 rounded-full transition-all duration-500 ease-out" 
                            style={{ 
                              width: `${(drop.soldQuantity / drop.totalQuantity) * 100}%` 
                            }}
                          />
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          {Math.round((drop.soldQuantity / drop.totalQuantity) * 100)}% completed
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rewards Summary */}
            <Card className="border border-[#B7985A]/20 shadow-lg bg-gradient-to-br from-black to-gray-900/50 hover:shadow-xl hover:shadow-[#B7985A]/20 transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#B7985A]/20 to-[#D2BA6A]/20">
                    <Gift className="h-5 w-5 text-[#FFD700]" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-white">Rewards Program Summary</CardTitle>
                    <CardDescription className="text-gray-300">
                      Overview of rewards and loyalty program
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-[#B7985A]/10 to-[#D2BA6A]/10 border border-[#B7985A]/20">
                    <p className="text-sm font-semibold text-[#D2BA6A] mb-2">Points Issued</p>
                    <p className="text-3xl font-bold text-[#FFD700]">
                      {data.rewardsData.totalPointsIssued.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-900/20 to-green-800/20 border border-green-600/20">
                    <p className="text-sm font-semibold text-green-300 mb-2">Points Redeemed</p>
                    <p className="text-3xl font-bold text-green-400">
                      {data.rewardsData.totalPointsRedeemed.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-orange-900/20 to-orange-800/20 border border-orange-600/20">
                    <p className="text-sm font-semibold text-orange-300 mb-2">Active Offers</p>
                    <p className="text-3xl font-bold text-orange-400">
                      {data.rewardsData.activeOffers}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-[#B7985A]/10 to-[#D2BA6A]/10 border border-[#B7985A]/20">
                    <p className="text-sm font-semibold text-[#D2BA6A] mb-2">Total Redemptions</p>
                    <p className="text-3xl font-bold text-[#FFD700]">
                      {data.rewardsData.totalRedemptions}
                    </p>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                    <Star className="h-5 w-5 text-[#FFD700]" />
                    <span>Top Redemptions</span>
                  </h4>
                  <div className="space-y-3">
                    {data.rewardsData.topRedemptions.map((redemption, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-900/50 to-black/50 border border-[#B7985A]/10 hover:shadow-md hover:border-[#B7985A]/30 transition-all duration-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#B7985A]/20 to-[#D2BA6A]/20 flex items-center justify-center">
                            <span className="text-sm font-bold text-[#FFD700]">#{index + 1}</span>
                          </div>
                          <span className="font-semibold text-white">{redemption.offer}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-[#FFD700]">{redemption.count} times</span>
                          <span className="text-sm text-gray-300 ml-2">
                            ({redemption.points.toLocaleString()} pts)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <OrdersTab initialOrders={data.recentOrders} />
          </TabsContent>

          <TabsContent value="menu-drops">
            <MenuDropsTab menuDrops={data.menuDrops} />
          </TabsContent>

          <TabsContent value="rewards">
            <RewardsTab rewardsData={data.rewardsData} />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}