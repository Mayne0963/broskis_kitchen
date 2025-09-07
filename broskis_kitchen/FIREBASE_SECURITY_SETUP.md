# Firebase Security Setup Guide

This guide covers the complete security setup for Broski's Kitchen Firebase project, including Firestore rules, Storage rules, and security best practices.

## Table of Contents

1. [Overview](#overview)
2. [Firestore Security Rules](#firestore-security-rules)
3. [Storage Security Rules](#storage-security-rules)
4. [Authentication Setup](#authentication-setup)
5. [Admin Role Configuration](#admin-role-configuration)
6. [Security Testing](#security-testing)
7. [Monitoring and Alerts](#monitoring-and-alerts)
8. [Best Practices](#best-practices)

## Overview

Our Firebase security implementation follows the principle of least privilege, ensuring users can only access data they own or are authorized to view. The security model includes:

- **Role-based access control** (User, Admin)
- **Resource-level permissions** (own data, public data)
- **Data validation** at the database level
- **File type and size restrictions** for uploads

## Firestore Security Rules

### Rule Structure

Our Firestore rules are organized into the following collections:

- `users` - User profiles and settings
- `orders` - Order data and history
- `products` - Product catalog (admin-managed)
- `categories` - Product categories (admin-managed)
- `menuItems` - Restaurant menu (admin-managed)
- `loyalty` - Loyalty program data
- `rewards` - Available rewards
- `events` - Restaurant events
- `bookings` - Event bookings
- `payments` - Payment records

### Key Security Features

1. **Authentication Required**: Most operations require user authentication
2. **Owner-based Access**: Users can only access their own data
3. **Admin Privileges**: Admins have elevated permissions for content management
4. **Data Validation**: All writes are validated for required fields and data types
5. **Rate Limiting**: Built-in protection against abuse

### Helper Functions

```javascript
// Check if user is authenticated
function isAuthenticated() {
  return request.auth != null;
}

// Check if user owns the resource
function isOwner(userId) {
  return request.auth.uid == userId;
}

// Check if user has admin privileges
function isAdmin() {
  return request.auth != null && 
         request.auth.token.admin == true;
}
```

## Storage Security Rules

### File Organization

- `/public/` - Publicly readable assets (logos, etc.)
- `/products/` - Product images (admin-managed)
- `/menu/` - Menu item images (admin-managed)
- `/events/` - Event images (admin-managed)
- `/users/{userId}/` - User-specific files
- `/orders/{orderId}/` - Order-related documents
- `/admin/` - Admin-only files
- `/temp/` - Temporary uploads (24-hour expiry)

### File Restrictions

- **Image files**: 10MB maximum, image MIME types only
- **Documents**: 5MB maximum
- **User uploads**: Must be file owner
- **Admin uploads**: Admin privileges required

## Authentication Setup

### Supported Providers

1. **Email/Password** - Primary authentication method
2. **Google** - Social login option
3. **Phone** - SMS verification for orders

### User Claims

Custom claims are used for role management:

```javascript
{
  "admin": true,           // Admin privileges
  "verified": true,       // Email verified
  "loyaltyTier": "gold"   // Loyalty program tier
}
```

## Admin Role Configuration

### Setting Admin Claims

Use Firebase Admin SDK to set custom claims:

```javascript
const admin = require('firebase-admin');

// Set admin claim
await admin.auth().setCustomUserClaims(uid, { admin: true });
```

### Admin Permissions

Admins can:
- Manage products and menu items
- View all orders and bookings
- Access user data for support
- Upload and manage media files
- Configure system settings

## Security Testing

### Firestore Rules Testing

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Run Firestore rules tests
firebase emulators:exec --only firestore "npm test"
```

### Storage Rules Testing

```bash
# Test storage rules
firebase emulators:exec --only storage "npm run test:storage"
```

### Manual Testing Checklist

- [ ] Unauthenticated users cannot access private data
- [ ] Users can only access their own orders
- [ ] Admins can access all data
- [ ] File uploads respect size and type restrictions
- [ ] Data validation prevents invalid writes

## Monitoring and Alerts

### Firebase Console Monitoring

1. **Authentication**: Monitor sign-in methods and user activity
2. **Firestore**: Track read/write operations and security rule denials
3. **Storage**: Monitor file uploads and access patterns
4. **Functions**: Track function executions and errors

### Security Alerts

Set up alerts for:
- Unusual authentication patterns
- High number of security rule denials
- Large file uploads
- Failed payment attempts

### Logging

Enable audit logging for:
- Admin actions
- Data exports
- Security rule changes
- User role modifications

## Best Practices

### Development

1. **Use Emulators**: Test security rules locally before deployment
2. **Version Control**: Keep security rules in version control
3. **Code Reviews**: Review all security rule changes
4. **Testing**: Write comprehensive tests for security rules

### Production

1. **Regular Audits**: Review access patterns and permissions
2. **Principle of Least Privilege**: Grant minimum necessary permissions
3. **Data Encryption**: Use HTTPS and enable encryption at rest
4. **Backup Strategy**: Regular backups with proper access controls

### User Data Protection

1. **Data Minimization**: Collect only necessary user data
2. **Anonymization**: Remove PII from analytics data
3. **Retention Policies**: Implement data retention and deletion policies
4. **Consent Management**: Proper consent for data collection and processing

## Deployment

### Deploy Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage

# Deploy all rules
firebase deploy --only firestore:rules,storage
```

### Environment-Specific Rules

Use different rule sets for different environments:

- `firestore.rules` - Production rules
- `firestore.rules.dev` - Development rules (more permissive)
- `firestore.rules.test` - Test rules (for automated testing)

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check user authentication status
   - Verify custom claims are set correctly
   - Review security rule logic

2. **File Upload Failures**
   - Check file size and type restrictions
   - Verify user permissions for upload path
   - Review storage rules

3. **Data Validation Errors**
   - Check required fields in validation functions
   - Verify data types match expectations
   - Review field constraints

### Debug Tools

1. **Firebase Console**: View real-time security rule evaluations
2. **Emulator Suite**: Test rules locally with debug output
3. **Cloud Logging**: Review detailed logs for rule evaluations

## Support

For security-related issues:

1. Check this documentation first
2. Review Firebase security documentation