interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  email?: string;
  vehicle: {
    type: 'car' | 'bike' | 'scooter' | 'walking';
    make?: string;
    model?: string;
    color?: string;
    licensePlate?: string;
  };
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: string;
  };
  status: 'available' | 'busy' | 'offline' | 'on_delivery';
  rating: number;
  totalDeliveries: number;
}

interface DeliveryUpdate {
  deliveryId: string;
  driverId: string;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  location?: {
    latitude: number;
    longitude: number;
  };
  estimatedArrival?: string;
  notes?: string;
  timestamp: string;
}

interface ChatMessage {
  id: string;
  deliveryId: string;
  senderId: string;
  senderType: 'customer' | 'driver' | 'restaurant';
  message: string;
  messageType: 'text' | 'location' | 'image' | 'system';
  timestamp: string;
  read: boolean;
}

interface DeliveryInstructions {
  deliveryId: string;
  customerInstructions?: string;
  restaurantNotes?: string;
  specialRequirements?: string[];
  contactPreference: 'call' | 'text' | 'app' | 'any';
  deliveryWindow?: {
    start: string;
    end: string;
  };
}

class DriverCommunicationService {
  private baseUrl = '/api/driver';

  // Driver Management
  async getDriverInfo(driverId: string): Promise<DriverInfo | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${driverId}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get driver info');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting driver info:', error);
      return null;
    }
  }

  async updateDriverLocation(driverId: string, location: { latitude: number; longitude: number }): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${driverId}/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          location: {
            ...location,
            timestamp: new Date().toISOString()
          }
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating driver location:', error);
      return false;
    }
  }

  async updateDriverStatus(driverId: string, status: DriverInfo['status']): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${driverId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({ status })
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating driver status:', error);
      return false;
    }
  }

  // Delivery Updates
  async sendDeliveryUpdate(update: Omit<DeliveryUpdate, 'timestamp'>): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/delivery-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          ...update,
          timestamp: new Date().toISOString()
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending delivery update:', error);
      return false;
    }
  }

  async getDeliveryUpdates(deliveryId: string): Promise<DeliveryUpdate[]> {
    try {
      const response = await fetch(`${this.baseUrl}/delivery/${deliveryId}/updates`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get delivery updates');
      }

      const data = await response.json();
      return data.updates || [];
    } catch (error) {
      console.error('Error getting delivery updates:', error);
      return [];
    }
  }

  // Chat/Messaging
  async sendMessage(message: Omit<ChatMessage, 'id' | 'timestamp' | 'read'>): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          ...message,
          timestamp: new Date().toISOString(),
          read: false
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  async getMessages(deliveryId: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/${deliveryId}?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get messages');
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  async markMessagesAsRead(deliveryId: string, messageIds: string[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/${deliveryId}/mark-read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({ messageIds })
      });

      return response.ok;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }

  // Delivery Instructions
  async getDeliveryInstructions(deliveryId: string): Promise<DeliveryInstructions | null> {
    try {
      const response = await fetch(`${this.baseUrl}/delivery/${deliveryId}/instructions`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get delivery instructions');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting delivery instructions:', error);
      return null;
    }
  }

  async updateDeliveryInstructions(instructions: DeliveryInstructions): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/delivery/${instructions.deliveryId}/instructions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify(instructions)
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating delivery instructions:', error);
      return false;
    }
  }

  // Emergency and Support
  async reportIssue(deliveryId: string, issue: {
    type: 'customer_unavailable' | 'address_issue' | 'vehicle_problem' | 'safety_concern' | 'other';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    location?: { latitude: number; longitude: number };
  }): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/delivery/${deliveryId}/report-issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          ...issue,
          timestamp: new Date().toISOString()
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error reporting issue:', error);
      return false;
    }
  }

  async requestSupport(deliveryId: string, supportType: 'technical' | 'customer_service' | 'emergency'): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/delivery/${deliveryId}/request-support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          supportType,
          timestamp: new Date().toISOString()
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error requesting support:', error);
      return false;
    }
  }

  // Real-time Communication
  subscribeToDeliveryUpdates(deliveryId: string, callback: (update: DeliveryUpdate) => void): () => void {
    // This would typically use WebSocket or Server-Sent Events
    // For now, we'll use polling as a fallback
    const pollInterval = setInterval(async () => {
      try {
        const updates = await this.getDeliveryUpdates(deliveryId);
        if (updates.length > 0) {
          // Get the latest update
          const latestUpdate = updates[updates.length - 1];
          callback(latestUpdate);
        }
      } catch (error) {
        console.error('Error polling delivery updates:', error);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }

  subscribeToMessages(deliveryId: string, callback: (message: ChatMessage) => void): () => void {
    // This would typically use WebSocket or Server-Sent Events
    // For now, we'll use polling as a fallback
    let lastMessageId: string | null = null;
    
    const pollInterval = setInterval(async () => {
      try {
        const messages = await this.getMessages(deliveryId, 10);
        const newMessages = lastMessageId 
          ? messages.filter(msg => msg.timestamp > lastMessageId!)
          : messages.slice(-1); // Get only the latest message on first load
        
        newMessages.forEach(callback);
        
        if (messages.length > 0) {
          lastMessageId = messages[messages.length - 1].timestamp;
        }
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }

  // Customer Communication Helpers
  async notifyCustomerOfDelay(deliveryId: string, newEstimatedTime: string, reason?: string): Promise<boolean> {
    const message = `Your delivery has been delayed. New estimated arrival: ${newEstimatedTime}${reason ? `. Reason: ${reason}` : ''}`;
    
    return await this.sendMessage({
      deliveryId,
      senderId: 'system',
      senderType: 'driver',
      message,
      messageType: 'system'
    });
  }

  async notifyCustomerOfArrival(deliveryId: string): Promise<boolean> {
    const message = 'Your driver has arrived! Please come to the delivery location.';
    
    return await this.sendMessage({
      deliveryId,
      senderId: 'system',
      senderType: 'driver',
      message,
      messageType: 'system'
    });
  }

  async shareLocationWithCustomer(deliveryId: string, location: { latitude: number; longitude: number }): Promise<boolean> {
    return await this.sendMessage({
      deliveryId,
      senderId: 'driver',
      senderType: 'driver',
      message: `Driver location: ${location.latitude}, ${location.longitude}`,
      messageType: 'location'
    });
  }

  // Utility methods
  private async getAuthToken(): Promise<string> {
    // This should be implemented to get the current driver's auth token
    // For now, return empty string - this will be implemented when integrating with auth
    return '';
  }

  // Calculate estimated arrival time based on current location and destination
  calculateEstimatedArrival(
    currentLocation: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    transportMode: 'driving' | 'walking' | 'bicycling' = 'driving'
  ): Promise<string> {
    // This would typically integrate with Google Maps API or similar
    // For now, return a simple calculation
    const distance = this.calculateDistance(currentLocation, destination);
    const speed = transportMode === 'driving' ? 30 : transportMode === 'bicycling' ? 15 : 5; // km/h
    const timeInMinutes = Math.round((distance / speed) * 60);
    
    const arrivalTime = new Date(Date.now() + timeInMinutes * 60000);
    return Promise.resolve(arrivalTime.toISOString());
  }

  private calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    // Haversine formula for calculating distance between two points
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const driverCommunicationService = new DriverCommunicationService();
export { DriverCommunicationService, type DriverInfo, type DeliveryUpdate, type ChatMessage, type DeliveryInstructions };