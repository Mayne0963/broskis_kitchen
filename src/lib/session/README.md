# Session Management System

A comprehensive, production-ready session management system for Next.js applications with advanced features for security, monitoring, and cross-browser compatibility.

## 🚀 Features

### 🔐 Security
- **Secure Cookie Management**: HttpOnly, Secure, SameSite protection
- **Session Fixation Protection**: Automatic session ID rotation
- **Rate Limiting**: Configurable request limits per user/IP
- **Input Validation**: Comprehensive token and role validation
- **CSRF Protection**: Built-in CSRF attack prevention

### 📊 Session Management
- **Automatic Session Validation**: Real-time authentication state verification
- **Session Timeout Handling**: Idle and absolute timeout with warnings
- **Session Refresh**: Automatic refresh for active users
- **Cross-Browser Compatibility**: Works across all modern browsers
- **Storage Fallbacks**: LocalStorage fallback when cookies are disabled

### 📈 Monitoring & Analytics
- **Real-time Metrics**: Session duration, success rates, error tracking
- **Health Monitoring**: Continuous session health checks
- **Event Tracking**: Comprehensive session event logging
- **Performance Monitoring**: Request timing and success rates

### 🛠 Developer Experience
- **TypeScript Support**: Full type safety throughout
- **Comprehensive Testing**: Unit and integration test suites
- **Debug Tools**: Detailed logging and debugging utilities
- **Easy Integration**: Drop-in replacement for existing systems

## 📦 Installation

The session management system is included in your Next.js project. Simply import and use:

```typescript
import { SessionProvider } from '@/components/providers/SessionProvider';
import { useSessionManagement } from '@/hooks/useSessionManagement';
```

## 🔧 Quick Start

### 1. Wrap Your App

```tsx
// app/layout.tsx or pages/_app.tsx
import { SessionProvider } from '@/components/providers/SessionProvider';

export default function RootLayout({ children }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
```

### 2. Use Session in Components

```tsx
import { useAppSession } from '@/components/providers/SessionProvider';

function MyComponent() {
  const { isAuthenticated, user, refreshSession, logout } = useAppSession();

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {user.email}!</p>
          <button onClick={refreshSession}>Refresh</button>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}
```

### 3. Protected Routes

```tsx
import { useProtectedSession } from '@/hooks/useSessionManagement';

function ProtectedPage() {
  const { isAuthenticated, user, isLoading } = useProtectedSession();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Access denied</div>;

  return <div>Welcome, {user.email}!</div>;
}
```

## 🏗 Architecture

### Core Components

#### SessionManager
Central session management class handling:
- Session creation and validation
- Token management
- Session refresh and invalidation
- Cross-browser compatibility
- Error handling and recovery

#### Middleware Integration
Comprehensive middleware system providing:
- Route-specific authentication requirements
- Automatic session validation
- Rate limiting and security
- CORS handling
- Performance monitoring

#### Client-Side Provider
React context provider offering:
- Session state management
- Automatic refresh handling
- Timeout warnings
- Health monitoring
- Event tracking

### Storage Strategy

#### Primary: Secure Cookies
- HttpOnly, Secure, SameSite attributes
- Encrypted session data
- Automatic expiration handling

#### Fallback: LocalStorage
- When cookies are disabled
- Synchronized with cookie state
- Automatic cleanup

#### Emergency: SessionStorage
- For incognito/private browsing
- Temporary session persistence
- Limited functionality

## 🔒 Security Features

### Session Security
- **Secure Token Generation**: Cryptographically secure random tokens
- **Session Rotation**: New sessions on authentication/privilege changes
- **Timeout Protection**: Idle and absolute timeouts
- **Rate Limiting**: Request-based and time-based limits
- **Input Validation**: Comprehensive validation of all session data

### Browser Security
- **CSRF Protection**: SameSite cookies and token validation
- **XSS Prevention**: HttpOnly cookies and input sanitization
- **CORS Handling**: Configurable origin restrictions
- **Secure Headers**: Security-focused HTTP headers

### Data Protection
- **Encryption**: Session data encryption at rest
- **Integrity Checks**: Cryptographic integrity verification
- **Secure Transmission**: HTTPS enforcement in production
- **Data Minimization**: Minimal session data storage

## 📊 Monitoring & Observability

### Session Metrics
- Authentication success/failure rates
- Session duration and lifecycle
- Timeout frequency and patterns
- Error rates and types
- Performance metrics

### Health Monitoring
- Continuous session validation
- Storage availability checks
- Network connectivity monitoring
- Performance degradation detection

### Event Tracking
- Session creation and destruction
- Authentication attempts
- Timeout events
- Error occurrences
- User activity patterns

### Debug Tools
```typescript
// Enable debug logging
const sessionManager = new SessionManager({ debug: true });

// Check session health
const health = await getSessionHealthSummary();
console.log('Session health:', health);

// Get detailed session info
const info = await getSessionInfo();
console.log('Session info:', info);
```

## 🧪 Testing

### Unit Tests
```bash
npm test src/lib/session/__tests__/
```

### Integration Tests
```bash
npm test src/lib/session/__tests__/integration.test.ts
```

### End-to-End Tests
```bash
npm run test:e2e
```

### Test Coverage
- Session creation and validation
- Timeout handling
- Error recovery
- Cross-browser compatibility
- Security features
- Performance scenarios

## 🌐 Browser Compatibility

### Supported Browsers
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- Mobile browsers (iOS Safari, Chrome Mobile)

### Fallback Support
- LocalStorage when cookies disabled
- SessionStorage for private browsing
- In-memory storage for restricted environments
- Graceful degradation for older browsers

## ⚙️ Configuration

### Middleware Configuration
```typescript
const sessionMiddleware = createCombinedSessionMiddleware({
  validation: {
    enabled: true,
    requireAuth: false,
    requireEmailVerification: false,
    allowedRoles: [],
    refreshOnValidation: true,
    sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours
  },
  timeout: {
    enabled: true,
    idleTimeout: 30 * 60 * 1000, // 30 minutes
    absoluteTimeout: 8 * 60 * 60 * 1000, // 8 hours
    warningTime: 5 * 60 * 1000, // 5 minutes warning
    refreshOnActivity: true,
  },
  errorHandling: {
    enabled: true,
    enableRateLimiting: true,
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    maxRetries: 3,
    enableLogging: true,
  },
  browser: {
    enabled: true,
    enableCors: true,
    allowedOrigins: ["https://yourdomain.com"],
    enableStorageFallback: true,
  },
  monitoring: {
    enabled: true,
    trackMetrics: true,
    trackEvents: true,
    healthCheckInterval: 5 * 60 * 1000, // 5 minutes
  },
});
```

### Route Configuration
```typescript
const routeConfigs = {
  public: {
    paths: ["/", "/menu", "/about"],
    config: { validation: { requireAuth: false } },
  },
  protected: {
    paths: ["/dashboard", "/profile", "/orders"],
    config: { validation: { requireAuth: true } },
  },
  admin: {
    paths: ["/admin"],
    config: { 
      validation: { 
        requireAuth: true, 
        allowedRoles: ["admin", "superadmin"] 
      } 
    },
  },
};
```

## 🎯 Best Practices

### Security
- Always use HTTPS in production
- Implement proper CORS settings
- Regularly rotate session secrets
- Monitor authentication patterns
- Implement rate limiting

### Performance
- Enable caching for frequently accessed data
- Use lazy loading for non-critical features
- Implement proper error boundaries
- Monitor session metrics
- Optimize storage usage

### User Experience
- Provide clear session timeout warnings
- Implement smooth session refresh
- Handle errors gracefully
- Provide helpful error messages
- Ensure cross-browser compatibility

### Development
- Use TypeScript for type safety
- Write comprehensive tests
- Follow security best practices
- Monitor application health
- Document configuration changes

## 🔧 Troubleshooting

### Common Issues

#### Session Not Persisting
1. Check cookie settings in browser
2. Verify HTTPS in production
3. Check CORS configuration
4. Validate middleware setup

#### Authentication Failures
1. Verify NextAuth configuration
2. Check Firebase setup
3. Validate user roles
4. Review middleware logs

#### Performance Issues
1. Enable caching
2. Check rate limiting settings
3. Optimize storage usage
4. Monitor session metrics

#### Cross-Browser Issues
1. Test in different browsers
2. Check storage fallbacks
3. Validate CORS settings
4. Review browser console logs

### Debug Tools
```typescript
// Enable debug mode
const sessionManager = new SessionManager({ debug: true });

// Check session health
const health = await getSessionHealthSummary();

// Get session info
const info = await getSessionInfo();

// Validate session
const isValid = await validateSessionRequest();
```

## 📚 API Reference

### SessionManager
```typescript
class SessionManager {
  createSession(data: SessionData, options?: SessionOptions): Promise<void>
  validateSession(): Promise<SessionValidationResult>
  refreshSession(): Promise<void>
  invalidateSession(): Promise<void>
  getSessionMetadata(): Promise<SessionMetadata>
}
```

### Hooks
```typescript
useAppSession(): SessionContextType
useSessionManagement(options?: UseSessionManagementOptions): SessionManagementResult
useProtectedSession(options?: UseSessionManagementOptions): SessionManagementResult
useAdminSession(options?: UseSessionManagementOptions): SessionManagementResult
useSessionAwareAPI(): SessionAwareAPIResult
```

### Components
```typescript
SessionStatusIndicator(props: SessionStatusIndicatorProps): JSX.Element
CompactSessionStatus(): JSX.Element
SessionHealthCheck(props: SessionHealthCheckProps): JSX.Element
```

### Utilities
```typescript
validateSessionRequest(): Promise<SessionValidationResult>
getSessionInfo(): Promise<SessionInfo>
isSessionExpiringSoon(): Promise<boolean>
clearAllSessionData(): Promise<void>
handleSessionError(error: SessionError): Promise<void>
```

## 🔄 Migration Guide

### From Basic Session Management
1. Update middleware configuration
2. Replace existing session hooks
3. Add SessionProvider to layout
4. Update protected route handling
5. Test thoroughly

### From NextAuth Only
1. Integrate with existing NextAuth setup
2. Add Firebase session support if needed
3. Update middleware for combined authentication
4. Add session monitoring
5. Test cross-authentication flows

### From Custom Session System
1. Map existing session data
2. Update authentication logic
3. Migrate user roles and permissions
4. Update API endpoints
5. Test session migration

## 📄 License

This session management system is part of your Next.js project and follows the same license terms.

## 🤝 Contributing

When contributing to the session management system:

1. Follow TypeScript best practices
2. Write comprehensive tests
3. Update documentation
4. Follow security guidelines
5. Test cross-browser compatibility

## 📞 Support

For issues and questions:

1. Check the troubleshooting section
2. Review the API documentation
3. Run the test suite
4. Check browser console logs
5. Review middleware configuration

---

This comprehensive session management system provides everything needed for secure, scalable, and user-friendly session handling in your Next.js application.