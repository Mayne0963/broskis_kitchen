# Session Management System Usage Guide

## Overview

This comprehensive session management system provides secure, scalable, and feature-rich session handling for your Next.js application. It includes authentication state verification, session persistence, timeout handling, error recovery, cross-browser compatibility, and monitoring capabilities.

## Quick Start

### 1. Basic Setup

The session management system is automatically integrated into your middleware. Simply wrap your application with the SessionProvider:

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

### 2. Using Session in Components

#### Basic Session Usage
```tsx
import { useAppSession } from '@/components/providers/SessionProvider';

function MyComponent() {
  const { isAuthenticated, user, refreshSession, logout } = useAppSession();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <p>Welcome, {user.email}!</p>
      <button onClick={refreshSession}>Refresh Session</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

#### Advanced Session Management
```tsx
import { useSessionManagement } from '@/hooks/useSessionManagement';

function MyComponent() {
  const {
    isAuthenticated,
    user,
    isRefreshing,
    refreshError,
    validateSession,
    needsRefresh,
    manualRefresh,
    getSessionHealth,
  } = useSessionManagement({
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    showWarnings: true,
  });

  const handleValidate = async () => {
    const isValid = await validateSession();
    console.log('Session is valid:', isValid);
  };

  return (
    <div>
      {isRefreshing && <div>Refreshing session...</div>}
      {refreshError && <div>Error: {refreshError}</div>}
      <button onClick={handleValidate}>Validate Session</button>
      <button onClick={manualRefresh}>Manual Refresh</button>
    </div>
  );
}
```

### 3. Protected Routes

#### Using Protected Session Hook
```tsx
import { useProtectedSession } from '@/hooks/useSessionManagement';

function ProtectedPage() {
  const { isAuthenticated, user, isLoading } = useProtectedSession();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Protected Content</h1>
      <p>Welcome, {user?.email}!</p>
    </div>
  );
}
```

#### Using Admin Session Hook
```tsx
import { useAdminSession } from '@/hooks/useSessionManagement';

function AdminPage() {
  const { isAuthenticated, user, isLoading } = useAdminSession();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {user?.email}!</p>
    </div>
  );
}
```

### 4. Session-Aware API Calls

```tsx
import { useSessionAwareAPI } from '@/hooks/useSessionManagement';

function MyComponent() {
  const { makeAuthenticatedRequest, isAuthenticated } = useSessionAwareAPI();

  const fetchData = async () => {
    try {
      const data = await makeAuthenticatedRequest('/api/user-data');
      console.log('Data:', data);
    } catch (error) {
      console.error('Request failed:', error);
    }
  };

  return (
    <button onClick={fetchData} disabled={!isAuthenticated}>
      Fetch Protected Data
    </button>
  );
}
```

### 5. Session Status Indicators

#### Basic Status Indicator
```tsx
import { SessionStatusIndicator } from '@/components/SessionStatusIndicator';

function App() {
  return (
    <div>
      <SessionStatusIndicator 
        showDetails={true}
        position="top-right"
        autoHide={false}
      />
      {/* Your app content */}
    </div>
  );
}
```

#### Compact Status Indicator
```tsx
import { CompactSessionStatus } from '@/components/SessionStatusIndicator';

function Header() {
  return (
    <header>
      <CompactSessionStatus />
      {/* Other header content */}
    </header>
  );
}
```

#### Session Health Check
```tsx
import { SessionHealthCheck } from '@/components/SessionStatusIndicator';

function Dashboard() {
  const handleHealthChange = (isHealthy: boolean) => {
    console.log('Session health changed:', isHealthy);
  };

  return (
    <div>
      <SessionHealthCheck onHealthChange={handleHealthChange} />
      {/* Dashboard content */}
    </div>
  );
}
```

## Configuration

### Middleware Configuration

The middleware is pre-configured with sensible defaults, but you can customize it:

```typescript
// src/middleware.ts
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
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
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

Configure different authentication requirements for different routes:

```typescript
const routeConfigs = {
  public: {
    paths: ["/", "/menu", "/about", "/contact", "/api/public"],
    config: { validation: { requireAuth: false } },
  },
  auth: {
    paths: ["/auth/login", "/auth/signup", "/login", "/signup", "/api/auth"],
    config: { validation: { requireAuth: false } },
  },
  protected: {
    paths: ["/dashboard", "/profile", "/orders", "/loyalty", "/rewards", "/cart", "/checkout"],
    config: { validation: { requireAuth: true, requireEmailVerification: true } },
  },
  admin: {
    paths: ["/admin"],
    config: { 
      validation: { 
        requireAuth: true, 
        requireEmailVerification: true, 
        allowedRoles: ["admin", "superadmin"] 
      } 
    },
  },
  api: {
    paths: ["/api"],
    config: { 
      validation: { requireAuth: false },
      errorHandling: { enableRateLimiting: true },
    },
  },
};
```

## Security Features

### 1. Secure Cookie Configuration
- **HttpOnly**: Prevents XSS attacks
- **Secure**: HTTPS only in production
- **SameSite**: CSRF protection
- **Domain and Path**: Proper scoping

### 2. Session Fixation Protection
- New session ID on authentication
- Session regeneration on privilege changes
- Invalidation of old sessions

### 3. Rate Limiting
- Configurable request limits
- Time-based windows
- Per-user and per-IP tracking

### 4. Input Validation
- Token validation
- Role verification
- Permission checks

### 5. Error Handling
- Graceful degradation
- Secure error messages
- Audit logging

## Performance Optimizations

### 1. Caching
- Session validation caching
- User data caching
- Permission caching

### 2. Lazy Loading
- On-demand session validation
- Deferred monitoring setup
- Conditional feature loading

### 3. Concurrent Request Handling
- Request batching
- Connection pooling
- Async processing

### 4. Storage Optimization
- Efficient cookie size
- LocalStorage fallback
- Compression support

## Browser Compatibility

### Supported Browsers
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- Mobile browsers

### Fallbacks
- LocalStorage when cookies disabled
- SessionStorage for temporary data
- In-memory storage for incognito mode

### CORS Handling
- Configurable allowed origins
- Preflight request support
- Credentials handling

## Monitoring and Debugging

### Session Metrics
- Authentication success/failure rates
- Session duration statistics
- Timeout frequency
- Error rates

### Health Checks
- Session validation health
- Storage availability
- Network connectivity
- Performance metrics

### Debugging Tools
```typescript
// Enable debug logging
const sessionManager = new SessionManager({
  debug: true,
  enableMetrics: true,
});

// Check session health
const health = await getSessionHealthSummary();
console.log('Session health:', health);

// Get session info
const info = await getSessionInfo();
console.log('Session info:', info);
```

## Error Handling

### Common Errors and Solutions

#### Session Expired
```typescript
// Automatic redirect to login
const { onSessionExpired } = useSessionManagement({
  onSessionExpired: () => {
    window.location.href = '/auth/login?error=session_expired';
  },
});
```

#### Rate Limited
```typescript
// Handle rate limiting
const response = await fetch('/api/protected', {
  headers: { 'X-Session-Valid': 'true' }
});

if (response.status === 429) {
  toast.error('Too many requests. Please try again later.');
}
```

#### Network Errors
```typescript
// Retry mechanism
const { makeAuthenticatedRequest } = useSessionAwareAPI();

try {
  const data = await makeAuthenticatedRequest('/api/data');
} catch (error) {
  if (error.message === 'Session expired') {
    // Handle expiration
  } else if (error.message.includes('Network')) {
    // Handle network error
  }
}
```

## Testing

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

## Troubleshooting

### Session Not Persisting
1. Check cookie settings in browser
2. Verify HTTPS in production
3. Check CORS configuration
4. Validate middleware configuration

### Authentication Failures
1. Verify NextAuth configuration
2. Check Firebase setup
3. Validate user roles
4. Review middleware logs

### Performance Issues
1. Enable caching
2. Check rate limiting settings
3. Optimize storage usage
4. Monitor session metrics

### Cross-Browser Issues
1. Test in different browsers
2. Check storage fallbacks
3. Validate CORS settings
4. Review browser console logs

## Best Practices

### 1. Security
- Always use HTTPS in production
- Implement proper CORS settings
- Use secure cookie attributes
- Regularly rotate session secrets

### 2. Performance
- Enable caching for frequently accessed data
- Use lazy loading for non-critical features
- Implement proper error boundaries
- Monitor performance metrics

### 3. User Experience
- Provide clear session timeout warnings
- Implement smooth session refresh
- Handle errors gracefully
- Provide helpful error messages

### 4. Development
- Use TypeScript for type safety
- Implement comprehensive testing
- Follow security best practices
- Monitor application health

## API Reference

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

### Session Validation
```typescript
function validateSessionRequest(): Promise<SessionValidationResult>
function getSessionInfo(): Promise<SessionInfo>
function isSessionExpiringSoon(): Promise<boolean>
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

## Migration Guide

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

This comprehensive session management system provides everything needed for secure, scalable, and user-friendly session handling in your Next.js application.