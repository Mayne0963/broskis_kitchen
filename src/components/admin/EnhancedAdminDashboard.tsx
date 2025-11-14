import { useEffect, useState } from 'react'
import { DataTable } from '@/components/molecules/DataTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/Card'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { TableColumn } from '@/components/atoms/Table'
import { BarChart3, DollarSign, Users, Package, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Download } from 'lucide-react'

interface Order {
  id: string
  customerName: string
  customerEmail: string
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  createdAt: string
  items: number
  paymentMethod: 'card' | 'cash' | 'online'
  deliveryType: 'delivery' | 'pickup'
  priority: 'low' | 'medium' | 'high'
}

export default function EnhancedAdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrderKeys, setSelectedOrderKeys] = useState<(string | number)[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setTimeout(() => {
        setOrders([
          { 
            id: 'ORD-001', 
            customerName: 'John Doe', 
            customerEmail: 'john@example.com',
            total: 45.99, 
            status: 'pending', 
            createdAt: '2024-01-15T14:30:00Z', 
            items: 3,
            paymentMethod: 'card',
            deliveryType: 'delivery',
            priority: 'high'
          },
          { 
            id: 'ORD-002', 
            customerName: 'Jane Smith', 
            customerEmail: 'jane@example.com',
            total: 67.50, 
            status: 'confirmed', 
            createdAt: '2024-01-15T13:45:00Z', 
            items: 5,
            paymentMethod: 'online',
            deliveryType: 'pickup',
            priority: 'medium'
          },
          { 
            id: 'ORD-003', 
            customerName: 'Mike Johnson', 
            customerEmail: 'mike@example.com',
            total: 23.99, 
            status: 'preparing', 
            createdAt: '2024-01-15T12:15:00Z', 
            items: 2,
            paymentMethod: 'cash',
            deliveryType: 'delivery',
            priority: 'low'
          },
          { 
            id: 'ORD-004', 
            customerName: 'Sarah Wilson', 
            customerEmail: 'sarah@example.com',
            total: 89.99, 
            status: 'ready', 
            createdAt: '2024-01-15T11:30:00Z', 
            items: 7,
            paymentMethod: 'card',
            deliveryType: 'delivery',
            priority: 'high'
          },
          { 
            id: 'ORD-005', 
            customerName: 'David Brown', 
            customerEmail: 'david@example.com',
            total: 34.50, 
            status: 'delivered', 
            createdAt: '2024-01-15T10:00:00Z', 
            items: 4,
            paymentMethod: 'online',
            deliveryType: 'pickup',
            priority: 'medium'
          },
        ])
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setLoading(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'confirmed': return 'info'
      case 'preparing': return 'brand'
      case 'ready': return 'success'
      case 'delivered': return 'success'
      case 'cancelled': return 'error'
      default: return 'default'
    }
  }

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'error'
      case 'medium': return 'warning'
      case 'low': return 'info'
      default: return 'default'
    }
  }

  // Order columns for DataTable
  const orderColumns: TableColumn<Order>[] = [
    {
      key: 'id',
      header: 'Order ID',
      sortable: true,
      render: (value) => <span className="font-mono text-sm">{value}</span>
    },
    {
      key: 'customerName',
      header: 'Customer',
      sortable: true,
      render: (value, record) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-[var(--color-text-secondary)]">{record.customerEmail}</div>
        </div>
      )
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      align: 'right',
      render: (value) => <span className="font-semibold">${value.toFixed(2)}</span>
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value) => (
        <Badge variant={getStatusBadgeVariant(value)}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      )
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (value) => (
        <Badge variant={getPriorityBadgeVariant(value)}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (value) => {
        const date = new Date(value)
        return (
          <span className="text-sm">
            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )
      }
    },
    {
      key: 'paymentMethod',
      header: 'Payment',
      sortable: true,
      render: (value) => (
        <Badge variant="outline">{value.charAt(0).toUpperCase() + value.slice(1)}</Badge>
      )
    },
    {
      key: 'deliveryType',
      header: 'Delivery',
      sortable: true,
      render: (value) => (
        <Badge variant="outline">{value.charAt(0).toUpperCase() + value.slice(1)}</Badge>
      )
    },
    {
      key: 'items',
      header: 'Items',
      sortable: true,
      align: 'center',
      render: (value) => <span className="text-sm">{value}</span>
    }
  ]

  const orderFilters = [
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'preparing', label: 'Preparing' },
        { value: 'ready', label: 'Ready' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' }
      ]
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Priorities' },
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' }
      ]
    },
    {
      key: 'paymentMethod',
      label: 'Payment Method',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Methods' },
        { value: 'card', label: 'Card' },
        { value: 'cash', label: 'Cash' },
        { value: 'online', label: 'Online' }
      ]
    },
    {
      key: 'deliveryType',
      label: 'Delivery Type',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Types' },
        { value: 'delivery', label: 'Delivery' },
        { value: 'pickup', label: 'Pickup' }
      ]
    }
  ]

  const orderBulkActions = [
    {
      key: 'export',
      label: 'Export Selected',
      icon: <Download className="h-4 w-4" />,
      variant: 'outline' as const,
      onClick: (selectedOrders: Order[]) => {
        console.log('Exporting orders:', selectedOrders)
        // Implement export logic
      }
    },
    {
      key: 'refresh',
      label: 'Refresh Status',
      icon: <RefreshCw className="h-4 w-4" />,
      variant: 'outline' as const,
      onClick: (selectedOrders: Order[]) => {
        console.log('Refreshing orders:', selectedOrders)
        // Implement refresh logic
      }
    }
  ]

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Typography variant="h1">Enhanced Admin Dashboard</Typography>
            <Typography variant="body2" className="text-[var(--color-text-secondary)]">
              Advanced order management with comprehensive filtering and data operations
            </Typography>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={fetchDashboardData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
            <Button variant="primary">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Enhanced DataTable */}
        <DataTable
          title="Order Management System"
          subtitle="Comprehensive order tracking with advanced filtering and bulk operations"
          columns={orderColumns}
          data={orders}
          loading={loading}
          rowKey={(record) => record.id}
          searchable={true}
          searchPlaceholder="Search by order ID, customer name, or email..."
          searchFields={['id', 'customerName', 'customerEmail']}
          filters={orderFilters}
          selectable={true}
          selectedRowKeys={selectedOrderKeys}
          onSelectionChange={setSelectedOrderKeys}
          bulkActions={orderBulkActions}
          sortable={true}
          defaultSort={{ key: 'createdAt', direction: 'desc' }}
          pagination={{
            current: 1,
            pageSize: 10,
            total: orders.length,
            onChange: (page) => console.log('Page changed:', page),
            showSizeChanger: true,
            pageSizeOptions: [5, 10, 20, 50],
            showTotal: true
          }}
          exportable={true}
          refreshable={true}
          onRefresh={fetchDashboardData}
          settings={true}
        />
      </div>
    </div>
  )
}