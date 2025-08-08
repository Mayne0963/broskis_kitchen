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
  <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 hover:shadow-xl transition-all duration-300 group">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
      <CardTitle className="text-sm font-semibold text-gray-700 tracking-wide">{title}</CardTitle>
      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-orange-100 group-hover:from-blue-200 group-hover:to-orange-200 transition-all duration-300">
        <Icon className="h-5 w-5 text-blue-600" />
      </div>
    </CardHeader>
    <CardContent className="relative z-10">
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      {description && (
        <p className="text-sm text-gray-600 mb-2">{description}</p>
      )}
      {trend && (
        <div className="flex items-center space-x-1">
          <TrendingUp className="h-3 w-3 text-green-600" />
          <p className="text-sm font-medium text-green-700">{trend}</p>
        </div>
      )}
    </CardContent>
  </Card>
)

const getStatusColor = (status: string) => {
  switch (status) {
    case 'preparing':
      return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200'
    case 'ready':
      return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200'
    case 'delivered':
      return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-200'
    case 'cancelled':
      return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-200'
    case 'active':
      return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200'
    case 'scheduled':
      return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200'
    case 'ended':
      return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-200'
    default:
      return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-200'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Modern Header with Gradient Background */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-orange-500 shadow-lg">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                    Admin Dashboard
                  </h1>
                  <p className="text-gray-300 text-lg">
                    Manage orders, menu drops, and rewards from one place
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white border-0 shadow-lg">
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
          <div className="bg-white rounded-2xl shadow-lg border-0 p-2">
            <TabsList className="grid w-full grid-cols-5 bg-gray-50 rounded-xl p-1 h-14">
              <TabsTrigger 
                value="overview" 
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-gray-900 text-gray-600 font-medium transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Activity className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="orders" 
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-gray-900 text-gray-600 font-medium transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Orders</span>
              </TabsTrigger>
              <TabsTrigger 
                value="menu-drops" 
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-gray-900 text-gray-600 font-medium transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Zap className="h-4 w-4" />
                <span>Menu Drops</span>
              </TabsTrigger>
              <TabsTrigger 
                value="rewards" 
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-gray-900 text-gray-600 font-medium transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Gift className="h-4 w-4" />
                <span>Rewards</span>
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-gray-900 text-gray-600 font-medium transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>Users</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Recent Orders */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200">
                      <ShoppingCart className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">Recent Orders</CardTitle>
                      <CardDescription className="text-gray-600">
                        Latest orders from customers
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.recentOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:shadow-md transition-all duration-200">
                        <div className="space-y-2">
                          <p className="font-semibold text-gray-900">{order.customerName}</p>
                          <p className="text-sm text-gray-600">
                            {order.items.join(', ')}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(order.orderTime)}</span>
                          </p>
                        </div>
                        <div className="text-right space-y-2">
                          <p className="font-bold text-lg text-gray-900">
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
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200">
                      <Zap className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">Menu Drops Performance</CardTitle>
                      <CardDescription className="text-gray-600">
                        Current and recent menu drops
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.menuDrops.slice(0, 3).map((drop) => (
                      <div key={drop.id} className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-semibold text-gray-900">{drop.name}</p>
                          <Badge className={`${getStatusColor(drop.status)} font-medium px-3 py-1`}>
                            {drop.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                          <span className="font-medium">{drop.soldQuantity}/{drop.totalQuantity} sold</span>
                          <span className="font-bold text-gray-900">{formatCurrency(drop.revenue)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-orange-500 h-3 rounded-full transition-all duration-500 ease-out" 
                            style={{ 
                              width: `${(drop.soldQuantity / drop.totalQuantity) * 100}%` 
                            }}
                          />
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          {Math.round((drop.soldQuantity / drop.totalQuantity) * 100)}% completed
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rewards Summary */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-green-200">
                    <Gift className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">Rewards Program Summary</CardTitle>
                    <CardDescription className="text-gray-600">
                      Overview of rewards and loyalty program
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                    <p className="text-sm font-semibold text-blue-700 mb-2">Points Issued</p>
                    <p className="text-3xl font-bold text-blue-900">
                      {data.rewardsData.totalPointsIssued.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                    <p className="text-sm font-semibold text-green-700 mb-2">Points Redeemed</p>
                    <p className="text-3xl font-bold text-green-900">
                      {data.rewardsData.totalPointsRedeemed.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
                    <p className="text-sm font-semibold text-orange-700 mb-2">Active Offers</p>
                    <p className="text-3xl font-bold text-orange-900">
                      {data.rewardsData.activeOffers}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                    <p className="text-sm font-semibold text-blue-700 mb-2">Total Redemptions</p>
                    <p className="text-3xl font-bold text-blue-900">
                      {data.rewardsData.totalRedemptions}
                    </p>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                    <Star className="h-5 w-5 text-orange-500" />
                    <span>Top Redemptions</span>
                  </h4>
                  <div className="space-y-3">
                    {data.rewardsData.topRedemptions.map((redemption, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-orange-100 flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-700">#{index + 1}</span>
                          </div>
                          <span className="font-semibold text-gray-900">{redemption.offer}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-gray-900">{redemption.count} times</span>
                          <span className="text-sm text-gray-600 ml-2">
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