interface OTWConfig {
  apiKey: string;
  baseUrl: string;
  webhookSecret: string;
}

interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  instructions?: string;
}

interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
}

interface DeliveryRequest {
  orderId: string;
  pickupAddress: DeliveryAddress;
  deliveryAddress: DeliveryAddress;
  customerInfo: CustomerInfo;
  orderValue: number;
  items: Array<{
    name: string;
    quantity: number;
    specialInstructions?: string;
  }>;
  scheduledTime?: string;
  priority?: 'standard' | 'express' | 'scheduled';
  specialInstructions?: string;
}

interface DeliveryResponse {
  deliveryId: string;
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  estimatedPickupTime: string;
  estimatedDeliveryTime: string;
  trackingUrl: string;
  driverInfo?: {
    name: string;
    phone: string;
    vehicleInfo: string;
    photo?: string;
  };
  cost: {
    baseFee: number;
    distanceFee: number;
    timeFee: number;
    total: number;
  };
}

interface DeliveryUpdate {
  deliveryId: string;
  status: string;
  location?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  estimatedArrival?: string;
  driverInfo?: {
    name: string;
    phone: string;
    vehicleInfo: string;
  };
  notes?: string;
}

class OTWService {
  private config: OTWConfig;

  constructor(config: OTWConfig) {
    this.config = config;
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: any): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'BroskisKitchen/1.0'
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OTW API Error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('OTW API Request failed:', error);
      throw error;
    }
  }

  async createDelivery(deliveryRequest: DeliveryRequest): Promise<DeliveryResponse> {
    const payload = {
      external_order_id: deliveryRequest.orderId,
      pickup_location: {
        address: {
          street_address: deliveryRequest.pickupAddress.street,
          city: deliveryRequest.pickupAddress.city,
          state: deliveryRequest.pickupAddress.state,
          zip_code: deliveryRequest.pickupAddress.zipCode
        },
        coordinates: deliveryRequest.pickupAddress.latitude && deliveryRequest.pickupAddress.longitude ? {
          lat: deliveryRequest.pickupAddress.latitude,
          lng: deliveryRequest.pickupAddress.longitude
        } : undefined,
        instructions: deliveryRequest.pickupAddress.instructions
      },
      dropoff_location: {
        address: {
          street_address: deliveryRequest.deliveryAddress.street,
          city: deliveryRequest.deliveryAddress.city,
          state: deliveryRequest.deliveryAddress.state,
          zip_code: deliveryRequest.deliveryAddress.zipCode
        },
        coordinates: deliveryRequest.deliveryAddress.latitude && deliveryRequest.deliveryAddress.longitude ? {
          lat: deliveryRequest.deliveryAddress.latitude,
          lng: deliveryRequest.deliveryAddress.longitude
        } : undefined,
        instructions: deliveryRequest.deliveryAddress.instructions
      },
      customer: {
        name: deliveryRequest.customerInfo.name,
        phone: deliveryRequest.customerInfo.phone,
        email: deliveryRequest.customerInfo.email
      },
      order_value: deliveryRequest.orderValue,
      items: deliveryRequest.items,
      scheduled_time: deliveryRequest.scheduledTime,
      priority: deliveryRequest.priority || 'standard',
      special_instructions: deliveryRequest.specialInstructions
    };

    const response = await this.makeRequest('/deliveries', 'POST', payload);
    
    return {
      deliveryId: response.delivery_id,
      status: response.status,
      estimatedPickupTime: response.estimated_pickup_time,
      estimatedDeliveryTime: response.estimated_delivery_time,
      trackingUrl: response.tracking_url,
      driverInfo: response.driver ? {
        name: response.driver.name,
        phone: response.driver.phone,
        vehicleInfo: response.driver.vehicle_info,
        photo: response.driver.photo
      } : undefined,
      cost: {
        baseFee: response.cost.base_fee,
        distanceFee: response.cost.distance_fee,
        timeFee: response.cost.time_fee,
        total: response.cost.total
      }
    };
  }

  async getDeliveryStatus(deliveryId: string): Promise<DeliveryUpdate> {
    const response = await this.makeRequest(`/deliveries/${deliveryId}`, 'GET');
    
    return {
      deliveryId: response.delivery_id,
      status: response.status,
      location: response.current_location ? {
        latitude: response.current_location.lat,
        longitude: response.current_location.lng,
        timestamp: response.current_location.timestamp
      } : undefined,
      estimatedArrival: response.estimated_arrival,
      driverInfo: response.driver ? {
        name: response.driver.name,
        phone: response.driver.phone,
        vehicleInfo: response.driver.vehicle_info
      } : undefined,
      notes: response.notes
    };
  }

  async cancelDelivery(deliveryId: string, reason?: string): Promise<boolean> {
    try {
      await this.makeRequest(`/deliveries/${deliveryId}/cancel`, 'POST', {
        reason: reason || 'Order cancelled by restaurant'
      });
      return true;
    } catch (error) {
      console.error('Failed to cancel delivery:', error);
      return false;
    }
  }

  async updateDeliveryInstructions(deliveryId: string, instructions: string): Promise<boolean> {
    try {
      await this.makeRequest(`/deliveries/${deliveryId}/instructions`, 'PUT', {
        special_instructions: instructions
      });
      return true;
    } catch (error) {
      console.error('Failed to update delivery instructions:', error);
      return false;
    }
  }

  async getDeliveryQuote(pickupAddress: DeliveryAddress, deliveryAddress: DeliveryAddress): Promise<{
    estimatedCost: number;
    estimatedTime: number;
    distance: number;
  }> {
    const payload = {
      pickup_location: {
        street_address: pickupAddress.street,
        city: pickupAddress.city,
        state: pickupAddress.state,
        zip_code: pickupAddress.zipCode
      },
      dropoff_location: {
        street_address: deliveryAddress.street,
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        zip_code: deliveryAddress.zipCode
      }
    };

    const response = await this.makeRequest('/deliveries/quote', 'POST', payload);
    
    return {
      estimatedCost: response.estimated_cost,
      estimatedTime: response.estimated_time_minutes,
      distance: response.distance_miles
    };
  }

  // Webhook signature verification
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  // Process webhook events
  processWebhookEvent(event: any): DeliveryUpdate | null {
    if (!event.delivery_id || !event.status) {
      return null;
    }

    return {
      deliveryId: event.delivery_id,
      status: event.status,
      location: event.location ? {
        latitude: event.location.lat,
        longitude: event.location.lng,
        timestamp: event.location.timestamp
      } : undefined,
      estimatedArrival: event.estimated_arrival,
      driverInfo: event.driver ? {
        name: event.driver.name,
        phone: event.driver.phone,
        vehicleInfo: event.driver.vehicle_info
      } : undefined,
      notes: event.notes
    };
  }
}

// Initialize OTW service with environment variables
const otwConfig: OTWConfig = {
  apiKey: process.env.OTW_API_KEY || '',
  baseUrl: process.env.OTW_BASE_URL || 'https://api.otw.com/v1',
  webhookSecret: process.env.OTW_WEBHOOK_SECRET || ''
};

export const otwService = new OTWService(otwConfig);
export { OTWService, type DeliveryRequest, type DeliveryResponse, type DeliveryUpdate };