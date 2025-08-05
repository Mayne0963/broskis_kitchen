import { sendEmail } from './email-service';
import { sendSMS } from './sms-service';
import { Order } from '@/types/order';

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
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
    const { type, order, customerEmail, customerPhone, preferences } = data;

    try {
      // Send email notification if enabled
      if (preferences?.email !== false) {
        await this.sendEmailNotification(type, order, customerEmail, data.additionalData);
      }

      // Send SMS notification if enabled and phone number provided
      if (preferences?.sms && customerPhone) {
        await this.sendSMSNotification(type, order, customerPhone, data.additionalData);
      }

      // Send push notification if enabled
      if (preferences?.push !== false) {
        await this.sendPushNotification(type, order, data.additionalData);
      }

      console.log(`Notification sent successfully for order ${order.id}`);
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  private static async sendEmailNotification(
    type: string,
    order: Order,
    email: string,
    additionalData?: any
  ): Promise<void> {
    const templates = {
      order_confirmation: {
        subject: `Order Confirmation - ${order.orderNumber}`,
        template: 'order-confirmation'
      },
      order_update: {
        subject: `Order Update - ${order.orderNumber}`,
        template: 'order-update'
      },
      order_ready: {
        subject: `Your Order is Ready - ${order.orderNumber}`,
        template: 'order-ready'
      },
      order_delivered: {
        subject: `Order Delivered - ${order.orderNumber}`,
        template: 'order-delivered'
      },
      order_cancelled: {
        subject: `Order Cancelled - ${order.orderNumber}`,
        template: 'order-cancelled'
      }
    };

    const template = templates[type as keyof typeof templates];
    if (!template) {
      throw new Error(`Unknown notification type: ${type}`);
    }

    await sendEmail({
      to: email,
      subject: template.subject,
      template: template.template,
      data: {
        order,
        customerName: order.customerInfo.name,
        orderNumber: order.orderNumber,
        total: order.pricing.total,
        items: order.items,
        estimatedTime: order.estimatedTime,
        deliveryType: order.deliveryType,
        status: order.status,
        trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}`,
        ...additionalData
      }
    });
  }

  private static async sendSMSNotification(
    type: string,
    order: Order,
    phone: string,
    additionalData?: any
  ): Promise<void> {
    const messages = {
      order_confirmation: `Hi ${order.customerInfo.name}! Your order ${order.orderNumber} has been confirmed. Estimated time: ${order.estimatedTime} mins. Track: ${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}`,
      order_update: `Order ${order.orderNumber} update: ${order.status}. ${additionalData?.message || ''} Track: ${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}`,
      order_ready: `Great news! Your order ${order.orderNumber} is ready for ${order.deliveryType === 'pickup' ? 'pickup' : 'delivery'}. ${additionalData?.message || ''}`,
      order_delivered: `Your order ${order.orderNumber} has been delivered! Thank you for choosing Broski's Kitchen. Rate your experience: ${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}/review`,
      order_cancelled: `Your order ${order.orderNumber} has been cancelled. ${additionalData?.reason || ''} Any charges will be refunded within 3-5 business days.`
    };

    const message = messages[type as keyof typeof messages];
    if (!message) {
      throw new Error(`Unknown SMS notification type: ${type}`);
    }

    await sendSMS({
      to: phone,
      message
    });
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