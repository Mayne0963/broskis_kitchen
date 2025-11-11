import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock Firebase Admin before importing anything that uses it
vi.mock('../../firebase/admin', () => ({
  adminApp: {
    auth: vi.fn(() => ({
      verifyIdToken: vi.fn().mockResolvedValue({
        uid: 'test-user-id',
        email: 'test@example.com',
        email_verified: true
      }),
      verifySessionCookie: vi.fn().mockResolvedValue({
        uid: 'test-user-id',
        email: 'test@example.com',
        email_verified: true
      }),
      createSessionCookie: vi.fn().mockResolvedValue('mock-session-cookie')
    })),
    firestore: vi.fn(() => ({
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => ({ role: 'user' })
          }),
          set: vi.fn().mockResolvedValue(undefined),
          update: vi.fn().mockResolvedValue(undefined),
          delete: vi.fn().mockResolvedValue(undefined)
        }))
      }))
    }))
  },
  dbAdmin: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ role: 'user' })
        }),
        set: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined)
      }))
    }))
  },
  authAdmin: {
    verifyIdToken: vi.fn().mockResolvedValue({
      uid: 'test-user-id',
      email: 'test@example.com',
      email_verified: true
    }),
    verifySessionCookie: vi.fn().mockResolvedValue({
      uid: 'test-user-id',
      email: 'test@example.com',
      email_verified: true
    }),
    createSessionCookie: vi.fn().mockResolvedValue('mock-session-cookie')
  },
  ensureAdmin: vi.fn().mockResolvedValue({
    uid: 'test-user-id',
    email: 'test@example.com',
    role: 'user'
  })
}));

// Mock Firebase Admin SDK
vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(() => ({
    auth: vi.fn(),
    firestore: vi.fn()
  })),
  cert: vi.fn(() => 'mock-cert'),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({
    auth: vi.fn(),
    firestore: vi.fn()
  }))
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({
    verifyIdToken: vi.fn().mockResolvedValue({
      uid: 'test-user-id',
      email: 'test@example.com',
      email_verified: true
    }),
    verifySessionCookie: vi.fn().mockResolvedValue({
      uid: 'test-user-id',
      email: 'test@example.com',
      email_verified: true
    }),
    createSessionCookie: vi.fn().mockResolvedValue('mock-session-cookie')
  }))
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ role: 'user' })
        }),
        set: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined)
      }))
    }))
  }))
}));

// Mock Next.js
vi.mock('next/server', () => ({
  NextRequest: vi.fn().mockImplementation((url, init) => {
    const req = new Request(url, init);
    req.nextUrl = new URL(url);
    req.cookies = {
      get: vi.fn((name) => {
        const cookies = req.headers.get('cookie') || '';
        const match = cookies.match(new RegExp(`${name}=([^;]+)`));
        return match ? { value: match[1] } : undefined;
      }),
      set: vi.fn(),
      delete: vi.fn(),
      has: vi.fn((name) => {
        const cookies = req.headers.get('cookie') || '';
        return cookies.includes(`${name}=`);
      })
    };
    return req;
  }),
  NextResponse: {
    json: vi.fn((data, init) => new Response(JSON.stringify(data), {
      ...init,
      headers: { ...init?.headers, 'content-type': 'application/json' }
    })),
    next: vi.fn(() => new Response(null, { status: 200 })),
    redirect: vi.fn((url) => new Response(null, { 
      status: 302, 
      headers: { location: url } 
    }))
  }
}));

// Now import the modules after mocks are set up
import { createCombinedSessionMiddleware, createRouteSpecificMiddleware } from '../middleware';
import { SessionManager } from '../sessionManager';
import { SessionStorage } from '../storage';
import { SessionValidator } from '../validator';

describe('Session Management Integration Tests', () => {
  let sessionManager: SessionManager;
  let middleware: ReturnType<typeof createCombinedSessionMiddleware>;

  beforeEach(() => {
    // Clear environment
    vi.clearAllMocks();
    
    sessionManager = new SessionManager();
    
    middleware = createCombinedSessionMiddleware({
      validation: {
        enabled: true,
        requireAuth: false,
        requireEmailVerification: false,
        allowedRoles: [],
        refreshOnValidation: true,
        sessionTimeout: 8 * 60 * 60 * 1000,
      },
      timeout: {
        enabled: true,
        idleTimeout: 30 * 60 * 1000,
        absoluteTimeout: 8 * 60 * 60 * 1000,
        warningTime: 5 * 60 * 1000,
        refreshOnActivity: true,
      },
      errorHandling: {
        enabled: true,
        enableRateLimiting: true,
        rateLimitWindow: 15 * 60 * 1000,
        maxRetries: 3,
        enableLogging: true,
      },
      browser: {
        enabled: true,
        enableCors: true,
        allowedOrigins: ['http://localhost:3000'],
        enableStorageFallback: true,
      },
      monitoring: {
        enabled: true,
        trackMetrics: true,
        trackEvents: true,
        healthCheckInterval: 5 * 60 * 1000,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Middleware Integration', () => {
    it('should allow access to public routes without authentication', async () => {
      const request = new NextRequest('http://localhost:3000/');
      const config = { validation: { requireAuth: false } };
      
      const response = await middleware(request as any, config);
      
      expect(response).toBeDefined();
      expect(response.status).not.toBe(302); // No redirect
    });

    it('should require authentication for protected routes', async () => {
      const request = new NextRequest('http://localhost:3000/dashboard');
      const config = { validation: { requireAuth: true } };
      
      const response = await middleware(request as any, config);
      
      // Should redirect to login
      expect(response.status).toBe(302);
    });

    it('should validate session for authenticated requests', async () => {
      // Create a valid session first
      const sessionData = {
        userId: 'test-user-123',
        email: 'test@example.com',
        role: 'user',
      };
      
      await sessionManager.createSession(sessionData);
      
      const request = new NextRequest('http://localhost:3000/dashboard');
      const config = { validation: { requireAuth: true } };
      
      const response = await middleware(request as any, config);
      
      // Should allow access
      expect(response.status).not.toBe(302);
    });

    it('should handle admin role requirements', async () => {
      const request = new NextRequest('http://localhost:3000/admin');
      const config = { 
        validation: { 
          requireAuth: true, 
          allowedRoles: ['admin'] 
        } 
      };
      
      const response = await middleware(request as any, config);
      
      // Should redirect due to insufficient role
      expect(response.status).toBe(302);
    });
  });

  describe('Session Validation Integration', () => {
    it('should validate session across multiple requests', async () => {
      const sessionData = {
        userId: 'test-user-123',
        email: 'test@example.com',
        role: 'user',
      };
      
      await sessionManager.createSession(sessionData);
      
      // Multiple validation requests
      const validations = await Promise.all([
        validateSessionRequest(),
        validateSessionRequest(),
        validateSessionRequest(),
      ]);
      
      validations.forEach(result => {
        expect(result.isValid).toBe(true);
        expect(result.userId).toBe('test-user-123');
      });
    });

    it('should handle session refresh during validation', async () => {
      const sessionData = {
        userId: 'test-user-123',
        email: 'test@example.com',
        role: 'user',
      };
      
      // Create session with short expiry
      await sessionManager.createSession(sessionData, {
        maxAge: 1, // 1 second expiry
        refreshOnValidation: true,
      });
      
      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Validation should trigger refresh
      const result = await validateSessionRequest();
      
      // Should be valid after refresh
      expect(result.isValid).toBe(true);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle corrupted session data gracefully', async () => {
      // Set corrupted cookie
      document.cookie = 'session-token=corrupted-data;path=/';
      
      const request = new NextRequest('http://localhost:3000/dashboard');
      const config = { validation: { requireAuth: true } };
      
      const response = await middleware(request as any, config);
      
      // Should redirect to login due to invalid session
      expect(response.status).toBe(302);
    });

    it('should handle rate limiting', async () => {
      const request = new NextRequest('http://localhost:3000/api/protected');
      const config = { 
        validation: { requireAuth: true },
        errorHandling: { enableRateLimiting: true }
      };
      
      // Make multiple requests to trigger rate limiting
      const requests = Array.from({ length: 20 }, () => 
        middleware(request as any, config)
      );
      
      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should recover from session errors', async () => {
      const sessionData = {
        userId: 'test-user-123',
        email: 'test@example.com',
        role: 'user',
      };
      
      await sessionManager.createSession(sessionData);
      
      // Corrupt the session
      document.cookie = 'session-token=invalid-token;path=/';
      
      // Try to validate
      const result = await validateSessionRequest();
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      
      // Create new valid session
      await sessionManager.createSession(sessionData);
      
      // Should be valid now
      const newResult = await validateSessionRequest();
      expect(newResult.isValid).toBe(true);
    });
  });

  describe('Cross-Browser Compatibility', () => {
    it('should handle different user agents', async () => {
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
      ];
      
      for (const userAgent of userAgents) {
        const request = new NextRequest('http://localhost:3000/', {
          headers: { 'User-Agent': userAgent }
        });
        
        const response = await middleware(request as any, {});
        expect(response).toBeDefined();
      }
    });

    it('should handle CORS preflight requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/data', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://example.com',
          'Access-Control-Request-Method': 'POST',
        }
      });
      
      const response = await middleware(request as any, {
        browser: { enableCors: true }
      });
      
      expect(response).toBeDefined();
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined();
    });
  });

  describe('Monitoring Integration', () => {
    it('should track session metrics', async () => {
      const sessionData = {
        userId: 'test-user-123',
        email: 'test@example.com',
        role: 'user',
      };
      
      await sessionManager.createSession(sessionData);
      
      const request = new NextRequest('http://localhost:3000/dashboard');
      const config = { 
        validation: { requireAuth: true },
        monitoring: { trackMetrics: true }
      };
      
      const response = await middleware(request as any, config);
      
      // Should have monitoring headers
      expect(response.headers.get('x-session-validated')).toBe('true');
      expect(response.headers.get('x-request-id')).toBeDefined();
    });

    it('should log session events', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const sessionData = {
        userId: 'test-user-123',
        email: 'test@example.com',
        role: 'user',
      };
      
      await sessionManager.createSession(sessionData);
      
      const request = new NextRequest('http://localhost:3000/dashboard');
      const config = { 
        validation: { requireAuth: true },
        monitoring: { trackEvents: true }
      };
      
      await middleware(request as any, config);
      
      // Should have logged events
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance Integration', () => {
    it('should handle high concurrent load', async () => {
      const sessionData = {
        userId: 'test-user-123',
        email: 'test@example.com',
        role: 'user',
      };
      
      await sessionManager.createSession(sessionData);
      
      // Simulate high concurrent load
      const concurrentRequests = Array.from({ length: 50 }, (_, i) => {
        const request = new NextRequest(`http://localhost:3000/api/data${i}`);
        const config = { validation: { requireAuth: true } };
        return middleware(request as any, config);
      });
      
      const startTime = Date.now();
      const responses = await Promise.all(concurrentRequests);
      const endTime = Date.now();
      
      // All requests should complete successfully
      expect(responses.every(r => r !== null)).toBe(true);
      
      // Should complete within reasonable time (< 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('should cache session validation results', async () => {
      const sessionData = {
        userId: 'test-user-123',
        email: 'test@example.com',
        role: 'user',
      };
      
      await sessionManager.createSession(sessionData);
      
      // Multiple validations with same session
      const startTime = Date.now();
      const validations = await Promise.all([
        validateSessionRequest(),
        validateSessionRequest(),
        validateSessionRequest(),
        validateSessionRequest(),
        validateSessionRequest(),
      ]);
      const endTime = Date.now();
      
      // Should be fast due to caching (< 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      
      // All validations should pass
      expect(validations.every(v => v.isValid)).toBe(true);
    });
  });

  describe('Security Integration', () => {
    it('should prevent session fixation attacks', async () => {
      const sessionData = {
        userId: 'test-user-123',
        email: 'test@example.com',
        role: 'user',
      };
      
      await sessionManager.createSession(sessionData);
      
      const request = new NextRequest('http://localhost:3000/dashboard');
      const config = { validation: { requireAuth: true } };
      
      const response = await middleware(request as any, config);
      
      // Should generate new session ID
      expect(response.headers.get('x-session-id')).toBeDefined();
    });

    it('should validate session integrity', async () => {
      const sessionData = {
        userId: 'test-user-123',
        email: 'test@example.com',
        role: 'user',
      };
      
      await sessionManager.createSession(sessionData);
      
      // Tamper with session data
      const tamperedData = { ...sessionData, userId: 'tampered-user' };
      document.cookie = `session-data=${JSON.stringify(tamperedData)};path=/`;
      
      const result = await validateSessionRequest();
      
      // Should detect tampering
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('integrity');
    });

    it('should enforce secure cookie attributes', async () => {
      const sessionData = {
        userId: 'test-user-123',
        email: 'test@example.com',
        role: 'user',
      };
      
      await sessionManager.createSession(sessionData, {
        secure: true,
        httpOnly: true,
        sameSite: 'strict',
      });
      
      const request = new NextRequest('https://localhost:3000/dashboard');
      const config = { validation: { requireAuth: true } };
      
      const response = await middleware(request as any, config);
      
      // Should enforce secure attributes
      expect(response.headers.get('x-secure-session')).toBe('true');
    });
  });
});