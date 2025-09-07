import { Order } from '@/types/order';

export interface NotificationPreferences {
  push: boolean;
}

export interface NotificationData {
  type: 'order_confirmation' | 'order_update' | 'order_ready' | 'order_delivered' | 'order_cancelled';
  order: Order;
  customerEmail: string;
  customerPhone?: string;
  preferences?: NotificationPreferences;
  additionalData?: any;
}

export class NotificationService {
  static async sendOrderNotification(data: NotificationData): Promise<void> {
    const { type, order, preferences } = data;

    try {
      // Send push notification if enabled
      if (preferences?.push !== false) {
        await this.sendPushNotification(type, order, data.additionalData);
      }

      console.log(`Push notification sent for order ${order.id}`);
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }



  private static async sendPushNotification(
    type: string,
    order: Order,
    additionalData?: any
  ): Promise<void> {
    // TODO: Implement push notifications using Firebase Cloud Messaging
    // This would require setting up FCM tokens and sending push notifications
    console.log(`Push notification would be sent for ${type} - Order ${order.orderNumber}`);
  }

  // Utility methods for specific notification types
  static async sendOrderConfirmation(order: Order, preferences?: NotificationPreferences): Promise<void> {
    await this.sendOrderNotification({
      type: 'order_confirmation',
      order,
      customerEmail: order.customerInfo.email,
      customerPhone: order.customerInfo.phone,
      preferences
    });
  }

  static async sendOrderStatusUpdate(
    order: Order,
    message?: string,
    preferences?: NotificationPreferences
  ): Promise<void> {
    await this.sendOrderNotification({
      type: 'order_update',
      order,
      customerEmail: order.customerInfo.email,
      customerPhone: order.customerInfo.phone,
      preferences,
      additionalData: { message }
    });
  }

  static async sendOrderReady(order: Order, preferences?: NotificationPreferences): Promise<void> {
    await this.sendOrderNotification({
      type: 'order_ready',
      order,
      customerEmail: order.customerInfo.email,
      customerPhone: order.customerInfo.phone,
      preferences
    });
  }

  static async sendOrderDelivered(order: Order, preferences?: NotificationPreferences): Promise<void> {
    await this.sendOrderNotification({
      type: 'order_delivered',
      order,
      customerEmail: order.customerInfo.email,
      customerPhone: order.customerInfo.phone,
      preferences
    });
  }

  static async sendOrderCancelled(
    order: Order,
    reason?: string,
    preferences?: NotificationPreferences
  ): Promise<void> {
    await this.sendOrderNotification({
      type: 'order_cancelled',
      order,
      customerEmail: order.customerInfo.email,
      customerPhone: order.customerInfo.phone,
      preferences,
      additionalData: { reason }
    });
  }
}