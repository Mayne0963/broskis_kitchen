# OTW (On The Way) Integration Guide

This document explains how Broski's Kitchen integrates with the OTW delivery platform for seamless order management and real-time tracking.

## Overview

The OTW integration allows Broski's Kitchen to:
- Automatically submit delivery orders to OTW
- Receive real-time status updates via webhooks
- Provide customers with live delivery tracking
- Handle driver assignment and location updates

## Architecture

### Components

1. **OTW Integration Service** (`src/lib/services/otw-integration.ts`)
   - Handles API communication with OTW
   - Converts order formats between systems
   - Manages order lifecycle

2. **Webhook Handler** (`src/app/api/otw/webhook/route.ts`)
   - Receives status updates from OTW
   - Updates order status in real-time
   - Handles driver assignment notifications

3. **OTW Tracker Component** (`src/components/orders/OTWTracker.tsx`)
   - Displays real-time tracking information
   - Shows driver details and location
   - Provides customer communication tools

4. **Order Context Integration** (`src/lib/context/OrderContext.tsx`)
   - Automatically submits delivery orders to OTW
   - Stores OTW order IDs for tracking

## Setup

### Environment Variables

Add the following to your `.env.local` file:

```env
# OTW Integration
OTW_API_KEY="your_otw_api_key_here"
OTW_API_URL="https://api.otw-delivery.com/v1"
OTW_WEBHOOK_SECRET="your_otw_webhook_secret_here"
OTW_RESTAURANT_ID="your_otw_restaurant_id_here"
```

### OTW Account Setup

1. Register your restaurant with OTW
2. Obtain API credentials from OTW dashboard
3. Configure webhook URL: `https://yourdomain.com/api/otw/webhook`
4. Set up restaurant profile and delivery zones

## API Integration

### Order Submission

When a customer places a delivery order:

1. Order is created in Broski's system
2. Order data is converted to OTW format
3. Order is submitted to OTW API
4. OTW order ID is stored for tracking

```typescript
const otwResult = await submitOrderToOTW(order)
if (otwResult.success) {
  // Store OTW order ID
  order.otwOrderId = otwResult.otw_order_id
}
```

### Status Updates

OTW sends webhook notifications for:
- Order acceptance/rejection
- Driver assignment
- Pickup confirmation
- Delivery completion
- Order cancellation

### Real-time Tracking

Customers can track their orders through:
- Order status updates
- Driver information display
- Live location tracking
- Estimated delivery time

## Webhook Events

### Event Types

| Event | Description | Status Update |
|-------|-------------|---------------|
| `order_accepted` | OTW accepts the order | `confirmed` |
| `driver_assigned` | Driver assigned to order | `preparing` |
| `driver_pickup` | Driver picks up order | `out_for_delivery` |
| `order_delivered` | Order delivered to customer | `delivered` |
| `order_cancelled` | Order cancelled | `cancelled` |

### Webhook Payload Example

```json
{
  "event_type": "driver_assigned",
  "order_id": "otw_12345",
  "restaurant_order_id": "broski_67890",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "driver": {
      "name": "John Doe",
      "phone": "+1234567890",
      "vehicle": "Honda Civic - ABC123",
      "location": {
        "lat": 40.7128,
        "lng": -74.0060
      }
    },
    "estimated_delivery": "2024-01-15T11:00:00Z"
  }
}
```

## Error Handling

### Fallback Mechanisms

1. **OTW API Unavailable**: Orders are marked for internal delivery
2. **Webhook Failures**: Status polling as backup
3. **Network Issues**: Retry logic with exponential backoff

### Error Scenarios

- **Order Rejection**: Customer is notified, refund processed
- **Driver Cancellation**: Order reassigned or handled internally
- **Delivery Failure**: Customer support contacted automatically

## Testing

### Development Environment

1. Use OTW sandbox API for testing
2. Mock webhook events for development
3. Test order flow end-to-end

### Test Cases

- Order submission success/failure
- Webhook event processing
- Status update propagation
- Error handling scenarios

## Monitoring

### Metrics to Track

- Order submission success rate
- Webhook processing latency
- Delivery completion rate
- Customer satisfaction scores

### Logging

- All OTW API calls are logged
- Webhook events are recorded
- Error conditions are tracked

## Security

### Webhook Verification

```typescript
function verifyWebhookSignature(payload: string, signature: string): boolean {
  const webhookSecret = process.env.OTW_WEBHOOK_SECRET
  // Verify HMAC signature
  return signature === generateHMAC(payload, webhookSecret)
}
```

### API Security

- API keys stored in environment variables
- HTTPS required for all communications
- Request signing for sensitive operations

## Troubleshooting

### Common Issues

1. **Orders not appearing in OTW**
   - Check API credentials
   - Verify restaurant ID
   - Review order format conversion

2. **Webhook not receiving updates**
   - Confirm webhook URL configuration
   - Check firewall settings
   - Verify signature validation

3. **Tracking information not updating**
   - Check OTW API status
   - Review error logs
   - Verify order ID mapping

### Debug Tools

- OTW API status dashboard
- Webhook event logs
- Order tracking console

## Support

For technical issues:
- OTW Developer Support: dev-support@otw-delivery.com
- API Documentation: https://docs.otw-delivery.com
- Status Page: https://status.otw-delivery.com

## Changelog

### v1.0.0 (Current)
- Initial OTW integration
- Real-time order tracking
- Webhook event handling
- Driver information display

### Planned Features
- Bulk order management
- Advanced analytics
- Custom delivery zones
- Multi-restaurant support