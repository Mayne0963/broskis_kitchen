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
  Zap
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
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {trend && (
        <p className="text-xs text-green-600 mt-1">{trend}</p>
      )}
    </CardContent>
  </Card>
)

const getStatusColor = (status: string) => {
  switch (status) {
    case 'preparing':
      return 'bg-[var(--color-harvest-gold)]/20 text-[var(--color-harvest-gold)]'
    case 'ready':
      return 'bg-gold-foil/20 text-gold-foil'
    case 'delivered':
      return 'bg-harvest-gold/20 text-harvest-gold'
    case 'cancelled':
      return 'bg-gold-foil/20 text-gold-foil'
    case 'active':
      return 'bg-gold-foil/20 text-gold-foil'
    case 'scheduled':
      return 'bg-harvest-gold/20 text-harvest-gold'
    case 'ended':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage orders, menu drops, and rewards from one place
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            Export Data
          </Button>
          <Button size="sm">
            View Reports
          </Button>
        </div>
      </div>

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

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="menu-drops">Menu Drops</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>
                  Latest orders from customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recentOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.items.join(', ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(order.orderTime)}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-sm font-medium">
                          {formatCurrency(order.total)}
                        </p>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Menu Drops Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Menu Drops Performance</CardTitle>
                <CardDescription>
                  Current and recent menu drops
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.menuDrops.slice(0, 3).map((drop) => (
                    <div key={drop.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{drop.name}</p>
                        <Badge className={getStatusColor(drop.status)}>
                          {drop.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{drop.soldQuantity}/{drop.totalQuantity} sold</span>
                        <span>{formatCurrency(drop.revenue)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gold-foil h-2 rounded-full" 
                          style={{ 
                            width: `${(drop.soldQuantity / drop.totalQuantity) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rewards Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Rewards Program Summary</CardTitle>
              <CardDescription>
                Overview of rewards and loyalty program
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Points Issued</p>
                  <p className="text-2xl font-bold">
                    {data.rewardsData.totalPointsIssued.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Points Redeemed</p>
                  <p className="text-2xl font-bold">
                    {data.rewardsData.totalPointsRedeemed.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Active Offers</p>
                  <p className="text-2xl font-bold">
                    {data.rewardsData.activeOffers}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Total Redemptions</p>
                  <p className="text-2xl font-bold">
                    {data.rewardsData.totalRedemptions}
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">Top Redemptions</h4>
                <div className="space-y-2">
                  {data.rewardsData.topRedemptions.map((redemption, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{redemption.offer}</span>
                      <div className="text-right">
                        <span className="text-sm font-medium">{redemption.count} times</span>
                        <span className="text-xs text-muted-foreground ml-2">
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
  )
}