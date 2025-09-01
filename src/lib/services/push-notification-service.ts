interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  requireInteraction?: boolean;
}

interface UserSubscription {
  userId: string;
  subscription: PushSubscription;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  userAgent: string;
  createdAt: string;
  lastUsed: string;
}

class PushNotificationService {
  private vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || ''
  };

  // Client-side methods
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      throw new Error('Notifications are blocked. Please enable them in browser settings.');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  async subscribeToPushNotifications(userId: string): Promise<PushSubscription | null> {
    try {
      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker not supported');
      }

      // Check if push messaging is supported
      if (!('PushManager' in window)) {
        throw new Error('Push messaging not supported');
      }

      // Request notification permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidKeys.publicKey)
      });

      // Save subscription to server
      await this.saveSubscription(userId, subscription);

      return subscription.toJSON() as PushSubscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  }

  async unsubscribeFromPushNotifications(userId: string): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        return false;
      }

      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        return false;
      }

      // Unsubscribe from push notifications
      const success = await subscription.unsubscribe();
      
      if (success) {
        // Remove subscription from server
        await this.removeSubscription(userId, subscription.endpoint);
      }

      return success;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  // Show local notification (for immediate feedback)
  showLocalNotification(payload: NotificationPayload): void {
    if (Notification.permission === 'granted') {
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/badge-72x72.png',
        image: payload.image,
        data: payload.data,
        tag: payload.tag,
        requireInteraction: payload.requireInteraction || false
      });

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        if (payload.data?.url) {
          window.open(payload.data.url, '_blank');
        }
        
        notification.close();
      };

      // Auto close after 5 seconds if not requiring interaction
      if (!payload.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }
    }
  }

  // Server-side methods
  async saveSubscription(userId: string, subscription: any): Promise<void> {
    try {
      const subscriptionData: UserSubscription = {
        userId,
        subscription: subscription.toJSON(),
        deviceType: this.getDeviceType(),
        userAgent: navigator.userAgent,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      };

      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify(subscriptionData)
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }
    } catch (error) {
      console.error('Error saving subscription:', error);
      throw error;
    }
  }

  async removeSubscription(userId: string, endpoint: string): Promise<void> {
    try {
      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({ userId, endpoint })
      });

      if (!response.ok) {
        throw new Error('Failed to remove subscription');
      }
    } catch (error) {
      console.error('Error removing subscription:', error);
      throw error;
    }
  }

  // Send push notification to specific user
  async sendPushNotification(userId: string, payload: NotificationPayload): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/send-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({ userId, payload })
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  // Send order-specific notifications
  async sendOrderNotification(userId: string, orderData: any): Promise<void> {
    const { orderNumber, status, estimatedTime } = orderData;
    
    let payload: NotificationPayload;
    
    switch (status) {
      case 'confirmed':
        payload = {
          title: '🍔 Order Confirmed!',
          body: `Your order ${orderNumber} has been confirmed. Estimated time: ${estimatedTime} minutes.`,
          icon: '/icons/order-confirmed.png',
          data: { 
            orderId: orderNumber, 
            url: `/orders/${orderNumber}`,
            type: 'order_confirmed'
          },
          actions: [
            { action: 'view', title: 'View Order', icon: '/icons/view.png' },
            { action: 'track', title: 'Track Order', icon: '/icons/track.png' }
          ],
          tag: `order-${orderNumber}`
        };
        break;
        
      case 'preparing':
        payload = {
          title: '🍳 Order Being Prepared',
          body: `Your order ${orderNumber} is now being prepared in our kitchen!`,
          icon: '/icons/cooking.png',
          data: { 
            orderId: orderNumber, 
            url: `/orders/${orderNumber}`,
            type: 'order_preparing'
          },
          tag: `order-${orderNumber}`
        };
        break;
        
      case 'ready':
        payload = {
          title: '✅ Order Ready!',
          body: `Your order ${orderNumber} is ready for pickup!`,
          icon: '/icons/ready.png',
          data: { 
            orderId: orderNumber, 
            url: `/orders/${orderNumber}`,
            type: 'order_ready'
          },
          requireInteraction: true,
          actions: [
            { action: 'directions', title: 'Get Directions', icon: '/icons/directions.png' }
          ],
          tag: `order-${orderNumber}`
        };
        break;
        
      case 'out_for_delivery':
        payload = {
          title: '🚗 Order Out for Delivery',
          body: `Your order ${orderNumber} is on the way! ${estimatedTime ? `ETA: ${estimatedTime} minutes` : ''}`,
          icon: '/icons/delivery.png',
          data: { 
            orderId: orderNumber, 
            url: `/orders/${orderNumber}`,
            type: 'order_delivery'
          },
          actions: [
            { action: 'track', title: 'Track Delivery', icon: '/icons/track.png' }
          ],
          tag: `order-${orderNumber}`
        };
        break;
        
      case 'delivered':
        payload = {
          title: '🎉 Order Delivered!',
          body: `Your order ${orderNumber} has been delivered. Enjoy your meal!`,
          icon: '/icons/delivered.png',
          data: { 
            orderId: orderNumber, 
            url: `/orders/${orderNumber}`,
            type: 'order_delivered'
          },
          actions: [
            { action: 'rate', title: 'Rate Order', icon: '/icons/star.png' },
            { action: 'reorder', title: 'Reorder', icon: '/icons/reorder.png' }
          ],
          tag: `order-${orderNumber}`
        };
        break;
        
      default:
        return; // Don't send notification for unknown status
    }
    
    await this.sendPushNotification(userId, payload);
  }

  // Utility methods
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const userAgent = navigator.userAgent;
    
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    
    return 'desktop';
  }

  private async getAuthToken(): Promise<string> {
    // This should be implemented to get the current user's auth token
    // For now, return empty string - this will be implemented when integrating with auth
    return '';
  }

  // Check if push notifications are supported
  static isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  // Get current notification permission status
  static getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }
}

export const pushNotificationService = new PushNotificationService();
export { PushNotificationService, type NotificationPayload, type UserSubscription };