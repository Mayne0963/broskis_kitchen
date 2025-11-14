import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/Card';
import { Typography } from '@/components/atoms/Typography';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { BarChart3, DollarSign, Users, Package, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface KPIData {
  totalOrders: number;
  revenue: number;
  activeUsers: number;
  pendingOrders: number;
  conversionRate: number;
  averageOrderValue: number;
}

interface OrderStatus {
  pending: number;
  confirmed: number;
  preparing: number;
  ready: number;
  delivered: number;
  cancelled: number;
}

interface RecentOrder {
  id: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
  items: number;
}

export default function AdminDashboard() {
  const [kpiData, setKpiData] = useState<KPIData>({
    totalOrders: 0,
    revenue: 0,
    activeUsers: 0,
    pendingOrders: 0,
    conversionRate: 0,
    averageOrderValue: 0,
  });
  
  const [orderStatus, setOrderStatus] = useState<OrderStatus>({
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    delivered: 0,
    cancelled: 0,
  });
  
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Simulate API call
      setTimeout(() => {
        setKpiData({
          totalOrders: 1247,
          revenue: 45678.50,
          activeUsers: 892,
          pendingOrders: 23,
          conversionRate: 3.2,
          averageOrderValue: 36.58,
        });
        
        setOrderStatus({
          pending: 23,
          confirmed: 45,
          preparing: 32,
          ready: 18,
          delivered: 156,
          cancelled: 8,
        });
        
        setRecentOrders([
          { id: 'ORD-001', customerName: 'John Doe', total: 45.99, status: 'pending', createdAt: '2 minutes ago', items: 3 },
          { id: 'ORD-002', customerName: 'Jane Smith', total: 67.50, status: 'confirmed', createdAt: '5 minutes ago', items: 5 },
          { id: 'ORD-003', customerName: 'Mike Johnson', total: 23.99, status: 'preparing', createdAt: '12 minutes ago', items: 2 },
          { id: 'ORD-004', customerName: 'Sarah Wilson', total: 89.99, status: 'ready', createdAt: '18 minutes ago', items: 7 },
          { id: 'ORD-005', customerName: 'David Brown', total: 34.50, status: 'delivered', createdAt: '1 hour ago', items: 4 },
        ]);
        
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'preparing':
        return 'brand';
      case 'ready':
        return 'success';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'preparing':
        return <Package className="h-4 w-4" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} variant="elevated" glow="sm">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-[var(--color-border-primary)] rounded mb-2"></div>
                    <div className="h-8 bg-[var(--color-border-primary)] rounded mb-2"></div>
                    <div className="h-3 bg-[var(--color-border-primary)] rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Typography variant="h1" color="brand" className="mb-2">
            Admin Dashboard
          </Typography>
          <Typography variant="body1" color="secondary">
            Manage your store operations and monitor performance metrics
          </Typography>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card variant="elevated" glow="sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="overline" color="secondary" className="mb-1">
                    Total Orders
                  </Typography>
                  <Typography variant="h3" color="primary" className="mb-1">
                    {kpiData.totalOrders.toLocaleString()}
                  </Typography>
                  <div className="flex items-center text-green-500">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <Typography variant="caption">+12.5%</Typography>
                  </div>
                </div>
                <div className="p-3 bg-[var(--color-brand-gold)]/10 rounded-full">
                  <BarChart3 className="h-6 w-6 text-[var(--color-brand-gold)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" glow="sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="overline" color="secondary" className="mb-1">
                    Revenue
                  </Typography>
                  <Typography variant="h3" color="primary" className="mb-1">
                    ${kpiData.revenue.toLocaleString()}
                  </Typography>
                  <div className="flex items-center text-green-500">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <Typography variant="caption">+8.3%</Typography>
                  </div>
                </div>
                <div className="p-3 bg-green-500/10 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" glow="sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="overline" color="secondary" className="mb-1">
                    Active Users
                  </Typography>
                  <Typography variant="h3" color="primary" className="mb-1">
                    {kpiData.activeUsers.toLocaleString()}
                  </Typography>
                  <div className="flex items-center text-green-500">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <Typography variant="caption">+15.2%</Typography>
                  </div>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-full">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" glow="sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="overline" color="secondary" className="mb-1">
                    Pending Orders
                  </Typography>
                  <Typography variant="h3" color="primary" className="mb-1">
                    {kpiData.pendingOrders}
                  </Typography>
                  <div className="flex items-center text-yellow-500">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <Typography variant="caption">Needs attention</Typography>
                  </div>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-full">
                  <Package className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Status Overview */}
          <div className="lg:col-span-2">
            <Card variant="elevated" glow="sm">
              <CardHeader>
                <CardTitle>Order Status Overview</CardTitle>
                <CardDescription>Current status distribution of all orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(orderStatus).map(([status, count]) => (
                    <div key={status} className="p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)]">
                      <div className="flex items-center justify-between mb-2">
                        <Typography variant="overline" color="secondary" className="capitalize">
                          {status}
                        </Typography>
                        {getStatusIcon(status)}
                      </div>
                      <Typography variant="h4" color="primary">
                        {count}
                      </Typography>
                      <div className="mt-2 h-2 bg-[var(--color-border-primary)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[var(--color-brand-gold)] rounded-full transition-all duration-300"
                          style={{ width: `${(count / Math.max(...Object.values(orderStatus))) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card variant="elevated" glow="sm">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="primary" size="sm" className="w-full">
                  View All Orders
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Manage Menu
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  User Management
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Analytics Report
                </Button>
                <Button variant="secondary" size="sm" className="w-full">
                  System Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="mt-6">
          <Card variant="elevated" glow="sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest customer orders</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] hover:border-[var(--color-border-secondary)] transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-[var(--color-brand-gold)]/10 rounded-full">
                        <Package className="h-5 w-5 text-[var(--color-brand-gold)]" />
                      </div>
                      <div>
                        <Typography variant="body1" color="primary" className="font-semibold">
                          {order.id}
                        </Typography>
                        <Typography variant="caption" color="secondary">
                          {order.customerName} • {order.items} items
                        </Typography>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <Typography variant="body1" color="primary" className="font-semibold">
                          ${order.total.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="secondary">
                          {order.createdAt}
                        </Typography>
                      </div>
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}