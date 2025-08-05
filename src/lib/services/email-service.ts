import sgMail from '@sendgrid/mail';
import { Order } from '@/types/order';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface EmailData {
  to: string;
  subject: string;
  template: string;
  data: any;
}

export interface EmailTemplate {
  html: string;
  text: string;
}

export class EmailService {
  private static readonly FROM_EMAIL = process.env.FROM_EMAIL || 'orders@broskiskitchen.com';
  private static readonly FROM_NAME = 'Broski\'s Kitchen';

  static async sendEmail(emailData: EmailData): Promise<void> {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured. Email not sent.');
      return;
    }

    try {
      const template = this.getEmailTemplate(emailData.template, emailData.data);
      
      const msg = {
        to: emailData.to,
        from: {
          email: this.FROM_EMAIL,
          name: this.FROM_NAME
        },
        subject: emailData.subject,
        html: template.html,
        text: template.text
      };

      await sgMail.send(msg);
      console.log(`Email sent successfully to ${emailData.to}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  private static getEmailTemplate(templateName: string, data: any): EmailTemplate {
    switch (templateName) {
      case 'order-confirmation':
        return this.getOrderConfirmationTemplate(data);
      case 'order-update':
        return this.getOrderUpdateTemplate(data);
      case 'order-ready':
        return this.getOrderReadyTemplate(data);
      case 'order-delivered':
        return this.getOrderDeliveredTemplate(data);
      case 'order-cancelled':
        return this.getOrderCancelledTemplate(data);
      default:
        throw new Error(`Unknown email template: ${templateName}`);
    }
  }

  private static getOrderConfirmationTemplate(data: any): EmailTemplate {
    const { order, customerName, orderNumber, total, items, estimatedTime, deliveryType, trackingUrl } = data;
    
    const itemsList = items.map((item: any) => 
      `<li style="margin-bottom: 10px;">
        <strong>${item.name}</strong> x${item.quantity}
        ${item.customizations?.length ? `<br><small style="color: #666;">Customizations: ${item.customizations.join(', ')}</small>` : ''}
        <span style="float: right;">$${item.subtotal.toFixed(2)}</span>
      </li>`
    ).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #DAA520; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .items-list { list-style: none; padding: 0; }
          .total { font-size: 18px; font-weight: bold; border-top: 2px solid #DAA520; padding-top: 10px; }
          .button { display: inline-block; background: #DAA520; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmed!</h1>
            <p>Thank you for your order, ${customerName}!</p>
          </div>
          
          <div class="content">
            <div class="order-details">
              <h2>Order Details</h2>
              <p><strong>Order Number:</strong> ${orderNumber}</p>
              <p><strong>Estimated Time:</strong> ${estimatedTime} minutes</p>
              <p><strong>Order Type:</strong> ${deliveryType === 'delivery' ? 'Delivery' : 'Pickup'}</p>
              
              <h3>Items Ordered:</h3>
              <ul class="items-list">
                ${itemsList}
              </ul>
              
              <div class="total">
                Total: $${total.toFixed(2)}
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="${trackingUrl}" class="button">Track Your Order</a>
            </div>
            
            <p>We'll send you updates as your order progresses. You can also track your order anytime using the link above.</p>
          </div>
          
          <div class="footer">
            <p>Questions? Contact us at orders@broskiskitchen.com or (555) 123-4567</p>
            <p>&copy; 2024 Broski's Kitchen. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Order Confirmed!
      
      Thank you for your order, ${customerName}!
      
      Order Details:
      Order Number: ${orderNumber}
      Estimated Time: ${estimatedTime} minutes
      Order Type: ${deliveryType === 'delivery' ? 'Delivery' : 'Pickup'}
      
      Items Ordered:
      ${items.map((item: any) => `- ${item.name} x${item.quantity} - $${item.subtotal.toFixed(2)}`).join('\n')}
      
      Total: $${total.toFixed(2)}
      
      Track your order: ${trackingUrl}
      
      We'll send you updates as your order progresses.
      
      Questions? Contact us at orders@broskiskitchen.com or (555) 123-4567
    `;

    return { html, text };
  }

  private static getOrderUpdateTemplate(data: any): EmailTemplate {
    const { order, orderNumber, status, message, trackingUrl } = data;
    
    const statusMessages = {
      confirmed: 'Your order has been confirmed and is being prepared.',
      preparing: 'Your order is currently being prepared by our kitchen team.',
      ready: 'Your order is ready!',
      out_for_delivery: 'Your order is out for delivery.',
      delivered: 'Your order has been delivered.',
      cancelled: 'Your order has been cancelled.'
    };

    const defaultMessage = statusMessages[status as keyof typeof statusMessages] || 'Your order status has been updated.';
    const updateMessage = message || defaultMessage;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #DAA520; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .update-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #DAA520; }
          .button { display: inline-block; background: #DAA520; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Update</h1>
            <p>Order ${orderNumber}</p>
          </div>
          
          <div class="content">
            <div class="update-box">
              <h2>Status: ${status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}</h2>
              <p>${updateMessage}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${trackingUrl}" class="button">View Order Details</a>
            </div>
          </div>
          
          <div class="footer">
            <p>Questions? Contact us at orders@broskiskitchen.com or (555) 123-4567</p>
            <p>&copy; 2024 Broski's Kitchen. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Order Update - ${orderNumber}
      
      Status: ${status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      
      ${updateMessage}
      
      View order details: ${trackingUrl}
      
      Questions? Contact us at orders@broskiskitchen.com or (555) 123-4567
    `;

    return { html, text };
  }

  private static getOrderReadyTemplate(data: any): EmailTemplate {
    const { orderNumber, deliveryType, trackingUrl } = data;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Ready</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .ready-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
          .button { display: inline-block; background: #DAA520; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Your Order is Ready!</h1>
            <p>Order ${orderNumber}</p>
          </div>
          
          <div class="content">
            <div class="ready-box">
              <h2>${deliveryType === 'pickup' ? 'Ready for Pickup!' : 'Out for Delivery!'}</h2>
              <p>${deliveryType === 'pickup' 
                ? 'Your order is ready for pickup at our location. Please bring your order confirmation.' 
                : 'Your order is on its way! Our delivery driver will be with you shortly.'}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${trackingUrl}" class="button">View Order Details</a>
            </div>
          </div>
          
          <div class="footer">
            <p>Questions? Contact us at orders@broskiskitchen.com or (555) 123-4567</p>
            <p>&copy; 2024 Broski's Kitchen. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      🎉 Your Order is Ready! - ${orderNumber}
      
      ${deliveryType === 'pickup' 
        ? 'Your order is ready for pickup at our location. Please bring your order confirmation.' 
        : 'Your order is on its way! Our delivery driver will be with you shortly.'}
      
      View order details: ${trackingUrl}
      
      Questions? Contact us at orders@broskiskitchen.com or (555) 123-4567
    `;

    return { html, text };
  }

  private static getOrderDeliveredTemplate(data: any): EmailTemplate {
    const { orderNumber, trackingUrl } = data;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Delivered</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .delivered-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
          .button { display: inline-block; background: #DAA520; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Order Delivered!</h1>
            <p>Order ${orderNumber}</p>
          </div>
          
          <div class="content">
            <div class="delivered-box">
              <h2>Enjoy Your Meal!</h2>
              <p>Your order has been successfully delivered. We hope you enjoy your delicious meal from Broski's Kitchen!</p>
              <p>We'd love to hear about your experience. Please consider leaving us a review.</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${trackingUrl}/review" class="button">Leave a Review</a>
              <a href="${trackingUrl}" class="button">View Order Details</a>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing Broski's Kitchen!</p>
            <p>Questions? Contact us at orders@broskiskitchen.com or (555) 123-4567</p>
            <p>&copy; 2024 Broski's Kitchen. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ✅ Order Delivered! - ${orderNumber}
      
      Enjoy Your Meal!
      
      Your order has been successfully delivered. We hope you enjoy your delicious meal from Broski's Kitchen!
      
      We'd love to hear about your experience: ${trackingUrl}/review
      
      View order details: ${trackingUrl}
      
      Thank you for choosing Broski's Kitchen!
      Questions? Contact us at orders@broskiskitchen.com or (555) 123-4567
    `;

    return { html, text };
  }

  private static getOrderCancelledTemplate(data: any): EmailTemplate {
    const { orderNumber, reason, trackingUrl } = data;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Cancelled</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #EF4444; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .cancelled-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .button { display: inline-block; background: #DAA520; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Cancelled</h1>
            <p>Order ${orderNumber}</p>
          </div>
          
          <div class="content">
            <div class="cancelled-box">
              <h2>We're Sorry</h2>
              <p>Your order has been cancelled. ${reason || 'We apologize for any inconvenience.'}</p>
              <p>If you were charged for this order, a full refund will be processed within 3-5 business days.</p>
            </div>
            
            <div style="text-align: center;">
              <a href="/menu" class="button">Order Again</a>
            </div>
          </div>
          
          <div class="footer">
            <p>Questions? Contact us at orders@broskiskitchen.com or (555) 123-4567</p>
            <p>&copy; 2024 Broski's Kitchen. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Order Cancelled - ${orderNumber}
      
      We're Sorry
      
      Your order has been cancelled. ${reason || 'We apologize for any inconvenience.'}
      
      If you were charged for this order, a full refund will be processed within 3-5 business days.
      
      Order again: /menu
      
      Questions? Contact us at orders@broskiskitchen.com or (555) 123-4567
    `;

    return { html, text };
  }
}

export const emailService = new EmailService();

// Export convenience functions for backward compatibility
export const sendEmail = (options: {
  to: string;
  template: string;
  data: any;
}) => emailService.sendEmail(options.to, options.template, options.data);

export const getEmailTemplate = (template: string, data: any) => 
  emailService.getEmailTemplate(template, data);