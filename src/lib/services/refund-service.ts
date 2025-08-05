import Stripe from 'stripe';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, addDoc, collection } from 'firebase/firestore';
import { emailService } from './email-service';
import { smsService } from './sms-service';
import { otwService } from './otw-service';

interface RefundRequest {
  orderId: string;
  amount?: number; // If not provided, full refund
  reason: string;
  refundType: 'full' | 'partial';
  adminUserId?: string;
  customerRequested?: boolean;
}

interface RefundResponse {
  refundId: string;
  amount: number;
  status: 'pending' | 'succeeded' | 'failed';
  estimatedArrival: string; // When customer will receive refund
}

interface CancellationRequest {
  orderId: string;
  reason: string;
  cancelledBy: 'customer' | 'admin' | 'system';
  userId?: string;
  refundAmount?: number;
}

class RefundService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16'
    });
  }

  async processRefund(refundRequest: RefundRequest): Promise<RefundResponse> {
    try {
      // Get order details
      const orderRef = doc(db, 'orders', refundRequest.orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        throw new Error('Order not found');
      }

      const orderData = orderSnap.data();
      const paymentIntentId = orderData.paymentInfo?.stripePaymentIntentId;
      
      if (!paymentIntentId) {
        throw new Error('No payment information found for this order');
      }

      // Calculate refund amount
      const orderTotal = orderData.pricing?.total || 0;
      const refundAmount = refundRequest.amount || orderTotal;
      
      if (refundAmount > orderTotal) {
        throw new Error('Refund amount cannot exceed order total');
      }

      // Check if order can be refunded
      if (orderData.status === 'delivered' && !refundRequest.customerRequested) {
        throw new Error('Cannot refund delivered orders without customer request');
      }

      // Create refund with Stripe
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: this.mapRefundReason(refundRequest.reason),
        metadata: {
          orderId: refundRequest.orderId,
          refundType: refundRequest.refundType,
          adminUserId: refundRequest.adminUserId || '',
          originalReason: refundRequest.reason
        }
      });

      // Update order status
      const newStatus = refundRequest.refundType === 'full' ? 'refunded' : 'partially_refunded';
      
      await updateDoc(orderRef, {
        status: newStatus,
        refundInfo: {
          refundId: refund.id,
          amount: refundAmount,
          reason: refundRequest.reason,
          processedAt: new Date().toISOString(),
          status: refund.status,
          estimatedArrival: this.calculateRefundArrival(refund.status)
        },
        updatedAt: new Date().toISOString(),
        timeline: [
          ...(orderData.timeline || []),
          {
            status: 'refund_processed',
            timestamp: new Date().toISOString(),
            description: `${refundRequest.refundType === 'full' ? 'Full' : 'Partial'} refund of $${refundAmount.toFixed(2)} processed. Reason: ${refundRequest.reason}`,
            userId: refundRequest.adminUserId || 'system'
          }
        ]
      });

      // Log refund transaction
      await addDoc(collection(db, 'refunds'), {
        orderId: refundRequest.orderId,
        stripeRefundId: refund.id,
        amount: refundAmount,
        reason: refundRequest.reason,
        refundType: refundRequest.refundType,
        processedBy: refundRequest.adminUserId || 'system',
        customerRequested: refundRequest.customerRequested || false,
        createdAt: new Date().toISOString(),
        status: refund.status
      });

      // Send notifications
      await this.sendRefundNotifications(orderData, refundAmount, refundRequest.reason);

      return {
        refundId: refund.id,
        amount: refundAmount,
        status: refund.status as 'pending' | 'succeeded' | 'failed',
        estimatedArrival: this.calculateRefundArrival(refund.status)
      };

    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  async cancelOrder(cancellationRequest: CancellationRequest): Promise<boolean> {
    try {
      // Get order details
      const orderRef = doc(db, 'orders', cancellationRequest.orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        throw new Error('Order not found');
      }

      const orderData = orderSnap.data();
      
      // Check if order can be cancelled
      if (['delivered', 'cancelled', 'refunded'].includes(orderData.status)) {
        throw new Error(`Cannot cancel order with status: ${orderData.status}`);
      }

      // Cancel delivery if exists
      if (orderData.deliveryInfo?.otwDeliveryId) {
        await otwService.cancelDelivery(
          orderData.deliveryInfo.otwDeliveryId,
          cancellationRequest.reason
        );
      }

      // Process refund if payment was made
      let refundInfo = null;
      if (orderData.paymentInfo?.status === 'succeeded') {
        const refundAmount = cancellationRequest.refundAmount || orderData.pricing?.total || 0;
        
        if (refundAmount > 0) {
          const refundResponse = await this.processRefund({
            orderId: cancellationRequest.orderId,
            amount: refundAmount,
            reason: cancellationRequest.reason,
            refundType: 'full',
            adminUserId: cancellationRequest.userId
          });
          
          refundInfo = {
            refundId: refundResponse.refundId,
            amount: refundResponse.amount,
            status: refundResponse.status,
            estimatedArrival: refundResponse.estimatedArrival
          };
        }
      }

      // Update order status
      await updateDoc(orderRef, {
        status: 'cancelled',
        cancellationInfo: {
          reason: cancellationRequest.reason,
          cancelledBy: cancellationRequest.cancelledBy,
          cancelledAt: new Date().toISOString(),
          userId: cancellationRequest.userId
        },
        refundInfo,
        updatedAt: new Date().toISOString(),
        timeline: [
          ...(orderData.timeline || []),
          {
            status: 'cancelled',
            timestamp: new Date().toISOString(),
            description: `Order cancelled by ${cancellationRequest.cancelledBy}. Reason: ${cancellationRequest.reason}`,
            userId: cancellationRequest.userId || 'system'
          }
        ]
      });

      // Send cancellation notifications
      await this.sendCancellationNotifications(orderData, cancellationRequest.reason, refundInfo);

      return true;

    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }

  async getRefundStatus(refundId: string): Promise<any> {
    try {
      const refund = await this.stripe.refunds.retrieve(refundId);
      return {
        id: refund.id,
        amount: refund.amount / 100, // Convert from cents
        status: refund.status,
        reason: refund.reason,
        created: new Date(refund.created * 1000).toISOString()
      };
    } catch (error) {
      console.error('Error getting refund status:', error);
      throw error;
    }
  }

  private mapRefundReason(reason: string): Stripe.RefundCreateParams.Reason {
    const lowerReason = reason.toLowerCase();
    
    if (lowerReason.includes('duplicate')) return 'duplicate';
    if (lowerReason.includes('fraud')) return 'fraudulent';
    if (lowerReason.includes('customer') || lowerReason.includes('request')) return 'requested_by_customer';
    
    return 'requested_by_customer'; // Default
  }

  private calculateRefundArrival(status: string): string {
    const now = new Date();
    
    switch (status) {
      case 'succeeded':
        // Immediate for most cards, 5-10 days for bank transfers
        now.setDate(now.getDate() + 7);
        break;
      case 'pending':
        now.setDate(now.getDate() + 10);
        break;
      default:
        now.setDate(now.getDate() + 14);
    }
    
    return now.toISOString();
  }

  private async sendRefundNotifications(orderData: any, refundAmount: number, reason: string): Promise<void> {
    const customerEmail = orderData.customerInfo?.email;
    const customerPhone = orderData.customerInfo?.phone;
    const orderNumber = orderData.orderNumber || orderData.id;

    // Send email notification
    if (customerEmail) {
      await emailService.sendRefundConfirmation(
        customerEmail,
        orderData.customerInfo?.name || 'Customer',
        {
          orderNumber,
          refundAmount,
          reason,
          estimatedArrival: '5-10 business days',
          originalTotal: orderData.pricing?.total || 0
        }
      );
    }

    // Send SMS notification
    if (customerPhone && smsService.validatePhoneNumber(customerPhone)) {
      const formattedPhone = smsService.formatPhoneNumber(customerPhone);
      const message = `💰 Refund processed for order ${orderNumber}. Amount: $${refundAmount.toFixed(2)}. You'll receive it in 5-10 business days. Questions? Contact Broski's Kitchen.`;
      
      await smsService.sendSMS({
        to: formattedPhone,
        message,
        orderId: orderNumber
      });
    }
  }

  private async sendCancellationNotifications(orderData: any, reason: string, refundInfo: any): Promise<void> {
    const customerEmail = orderData.customerInfo?.email;
    const customerPhone = orderData.customerInfo?.phone;
    const orderNumber = orderData.orderNumber || orderData.id;

    // Send email notification
    if (customerEmail) {
      await emailService.sendOrderCancellation(
        customerEmail,
        orderData.customerInfo?.name || 'Customer',
        {
          orderNumber,
          reason,
          refundInfo,
          items: orderData.items || []
        }
      );
    }

    // Send SMS notification
    if (customerPhone && smsService.validatePhoneNumber(customerPhone)) {
      const formattedPhone = smsService.formatPhoneNumber(customerPhone);
      let message = `❌ Order ${orderNumber} has been cancelled. Reason: ${reason}.`;
      
      if (refundInfo) {
        message += ` Refund of $${refundInfo.amount.toFixed(2)} is being processed.`;
      }
      
      await smsService.sendSMS({
        to: formattedPhone,
        message,
        orderId: orderNumber
      });
    }
  }
}

export const refundService = new RefundService();
export { RefundService, type RefundRequest, type RefundResponse, type CancellationRequest };