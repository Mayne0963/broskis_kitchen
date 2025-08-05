import twilio from 'twilio';

interface SMSConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

interface SMSMessage {
  to: string;
  message: string;
  orderId?: string;
}

class SMSService {
  private client: twilio.Twilio;
  private fromNumber: string;

  constructor(config: SMSConfig) {
    this.client = twilio(config.accountSid, config.authToken);
    this.fromNumber = config.fromNumber;
  }

  async sendSMS(data: SMSMessage): Promise<boolean> {
    try {
      const message = await this.client.messages.create({
        body: data.message,
        from: this.fromNumber,
        to: data.to
      });

      console.log(`SMS sent successfully: ${message.sid}`);
      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  }

  async sendOrderConfirmation(phoneNumber: string, orderNumber: string, estimatedTime: number): Promise<boolean> {
    const message = `🍔 Broski's Kitchen: Your order ${orderNumber} has been confirmed! Estimated time: ${estimatedTime} minutes. Track your order at broskiskitchen.com/orders/${orderNumber}`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      orderId: orderNumber
    });
  }

  async sendOrderUpdate(phoneNumber: string, orderNumber: string, status: string, estimatedTime?: number): Promise<boolean> {
    let message = '';
    
    switch (status) {
      case 'preparing':
        message = `🍳 Your order ${orderNumber} is now being prepared! ${estimatedTime ? `Estimated time: ${estimatedTime} minutes.` : ''}`;
        break;
      case 'ready':
        message = `✅ Your order ${orderNumber} is ready for pickup! Please come to Broski's Kitchen to collect your order.`;
        break;
      case 'out_for_delivery':
        message = `🚗 Your order ${orderNumber} is out for delivery! Your driver will arrive soon.`;
        break;
      case 'delivered':
        message = `🎉 Your order ${orderNumber} has been delivered! Thank you for choosing Broski's Kitchen!`;
        break;
      case 'cancelled':
        message = `❌ Your order ${orderNumber} has been cancelled. If you have any questions, please contact us.`;
        break;
      default:
        message = `📱 Update for order ${orderNumber}: Status changed to ${status}.`;
    }
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      orderId: orderNumber
    });
  }

  async sendDeliveryUpdate(phoneNumber: string, orderNumber: string, driverName: string, estimatedArrival: string): Promise<boolean> {
    const message = `🚗 Your order ${orderNumber} is on the way! Driver: ${driverName}. Estimated arrival: ${estimatedArrival}. Track live at broskiskitchen.com/orders/${orderNumber}`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      orderId: orderNumber
    });
  }

  async sendPromotionalMessage(phoneNumber: string, promoCode: string, discount: string): Promise<boolean> {
    const message = `🎁 Special offer from Broski's Kitchen! Use code ${promoCode} for ${discount} off your next order. Valid for 7 days. Order now at broskiskitchen.com`;
    
    return this.sendSMS({
      to: phoneNumber,
      message
    });
  }

  // Validate phone number format
  validatePhoneNumber(phoneNumber: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber.replace(/[\s-()]/g, ''));
  }

  // Format phone number to E.164 format
  formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      return `+${cleaned}`;
    }
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    return cleaned;
  }
}

// Initialize SMS service with environment variables
const smsConfig: SMSConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID || '',
  authToken: process.env.TWILIO_AUTH_TOKEN || '',
  fromNumber: process.env.TWILIO_FROM_NUMBER || ''
};

export const smsService = new SMSService(smsConfig);
export { SMSService, type SMSMessage, type SMSConfig };

// Export convenience function for backward compatibility
export const sendSMS = (options: {
  to: string;
  message: string;
  orderId?: string;
}) => smsService.sendSMS(options);