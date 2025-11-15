'use client';

import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import StatusPill from './StatusPill';
import { toast } from 'sonner';

// Types
interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  createdAt: string;
  status: string;
  userId?: string;
  userName?: string;
  totalCents: number;
  items: OrderItem[];
}

interface OrdersKanbanProps {
  orders: Order[];
  onMoved?: (orderId: string, newStatus: string) => void;
}

// Column definitions
const COLUMNS = [
  { id: 'pending', title: 'Pending', color: 'bg-yellow-500/20' },
  { id: 'preparing', title: 'Preparing', color: 'bg-orange-500/20' },
  { id: 'ready', title: 'Ready', color: 'bg-green-500/20' },
  { id: 'out_for_delivery', title: 'Out for Delivery', color: 'bg-purple-500/20' },
  { id: 'delivered', title: 'Delivered', color: 'bg-emerald-500/20' },
  { id: 'completed', title: 'Completed', color: 'bg-blue-500/20' },
  { id: 'cancelled', title: 'Cancelled', color: 'bg-red-500/20' }
];

// Utility functions
const formatCurrency = (cents: number): string => {
  return `$${(cents / 100).toFixed(2)}`;
};

const generateItemSummary = (items: OrderItem[]): string => {
  if (items.length === 0) return 'No items';
  if (items.length === 1) return `1 item: ${items[0].name}`;
  if (items.length === 2) return `2 items: ${items[0].name}, ${items[1].name}`;
  return `${items.length} items: ${items[0].name}, ${items[1].name}, +${items.length - 2} more`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Order Card Component
interface OrderCardProps {
  order: Order;
  index: number;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, index }) => {
  const hasTestItem = order.items.some(item => 
    item.id === 'test-item-5c' || item.name?.includes('Test Item')
  );
  const isProduction = process.env.NODE_ENV === 'production';
  const showTestWarning = hasTestItem && isProduction;
  
  return (
    <Draggable draggableId={order.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            rounded-xl ring-1 ring-white/10 p-4 mb-3 cursor-grab
            hover:bg-zinc-900/80 transition-all duration-200
            ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-blue-500/50 rotate-2 scale-105' : ''}
            ${showTestWarning ? 'bg-red-900/40 ring-red-500/50' : 'bg-zinc-900/60'}
          `}
        >
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-zinc-100 text-sm truncate">
                #{order.id.slice(-8)}
              </h3>
              <div className="flex items-center gap-2">
                {hasTestItem && (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    showTestWarning 
                      ? 'bg-red-100 text-red-800 border border-red-200' 
                      : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  }`}>
                    {showTestWarning ? '⚠️ TEST' : 'TEST'}
                  </span>
                )}
                <StatusPill status={order.status} />
              </div>
            </div>

            {/* Customer Info */}
            {(order.userId || order.userName) && (
              <div className="text-xs text-zinc-400">
                {order.userName && (
                  <div className="font-medium text-zinc-300">{order.userName}</div>
                )}
                {order.userId && (
                  <div className="truncate">{order.userId}</div>
                )}
              </div>
            )}

            {/* Items Summary */}
            <div className="text-xs text-zinc-400">
              {generateItemSummary(order.items)}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-700/50">
              <div className="text-sm font-semibold text-zinc-100">
                {formatCurrency(order.totalCents)}
              </div>
              <div className="text-xs text-zinc-500">
                {formatDate(order.createdAt)}
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

// Column Component
interface ColumnProps {
  column: typeof COLUMNS[0];
  orders: Order[];
}

const Column: React.FC<ColumnProps> = ({ column, orders }) => {
  return (
    <div className="flex-1 min-w-[280px] max-w-[320px]">
      <div className={`rounded-lg ${column.color} p-3 mb-4`}>
        <h2 className="font-semibold text-zinc-100 text-sm flex items-center justify-between">
          {column.title}
          <span className="bg-zinc-700/50 text-zinc-300 px-2 py-1 rounded-full text-xs">
            {orders.length}
          </span>
        </h2>
      </div>
      
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              min-h-[200px] rounded-lg p-2 transition-colors duration-200
              ${snapshot.isDraggingOver ? 'bg-zinc-800/50 ring-2 ring-blue-500/30' : 'bg-zinc-900/20'}
            `}
          >
            {orders.map((order, index) => (
              <OrderCard key={order.id} order={order} index={index} />
            ))}
            {provided.placeholder}
            
            {orders.length === 0 && (
              <div className="text-center text-zinc-500 text-sm py-8">
                No orders
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

// Main Kanban Component
export default function OrdersKanban({ orders, onMoved }: OrdersKanbanProps) {
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Update local orders when props change
  React.useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  // Group orders by status
  const ordersByStatus = React.useMemo(() => {
    const grouped: Record<string, Order[]> = {};
    COLUMNS.forEach(column => {
      grouped[column.id] = localOrders.filter(order => order.status === column.id);
    });
    return grouped;
  }, [localOrders]);

  // Handle drag end
  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // No destination or same position
    if (!destination || (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )) {
      return;
    }

    const orderId = draggableId;
    const newStatus = destination.droppableId;
    const oldStatus = source.droppableId;

    // Find the order being moved
    const orderToMove = localOrders.find(order => order.id === orderId);
    if (!orderToMove) return;

    // Optimistic update
    const updatedOrders = localOrders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setLocalOrders(updatedOrders);
    setIsUpdating(orderId);

    try {
      // Call API to update status
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update order status: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update order status');
      }

      // Success - call onMoved callback if provided
      onMoved?.(orderId, newStatus);
      toast.success(`Order #${orderId.slice(-8)} moved to ${newStatus.replace('_', ' ')}`);
      
    } catch (error) {
      // Revert optimistic update on error
      const revertedOrders = localOrders.map(order => 
        order.id === orderId ? { ...order, status: oldStatus } : order
      );
      setLocalOrders(revertedOrders);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to update order status';
      toast.error(errorMessage);
      console.error('Error updating order status:', error);
    } finally {
      setIsUpdating(null);
    }
  }, [localOrders, onMoved]);

  return (
    <div className="w-full">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map(column => (
            <Column
              key={column.id}
              column={column}
              orders={ordersByStatus[column.id] || []}
            />
          ))}
        </div>
      </DragDropContext>
      
      {/* Loading overlay for updating order */}
      {isUpdating && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-lg p-4 text-zinc-100">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              Updating order status...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}