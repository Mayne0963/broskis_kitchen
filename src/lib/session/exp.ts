/**
 * Session expiry utility for conditional background refresh
 * Checks JWT expiration and performs non-blocking refresh when needed
 */

// Helper function to decode JWT payload
function decodeJWTPayload(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    // Decode base64url payload with proper padding
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const payload = JSON.parse(atob(base64));
    return payload;
  } catch (error) {
    console.log('[decodeJWTPayload] Error decoding token:', error);
    return null;
  }
}

// Get session cookie from document.cookie
function getSessionCookie(): string | null {
  if (typeof document === 'undefined') {
    return null; // Server-side
  }
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === '__session' || name === 'session') {
      return value;
    }
  }
  return null;
}

// Check if session is near expiry (< 5 minutes)
export function isSessionNearExpiry(): boolean {
  const sessionCookie = getSessionCookie();
  if (!sessionCookie) {
    return false;
  }
  
  const payload = decodeJWTPayload(sessionCookie);
  if (!payload || !payload.exp) {
    return false;
  }
  
  const now = Math.floor(Date.now() / 1000);
  const timeRemaining = payload.exp - now;
  
  // Return true if less than 5 minutes (300 seconds) remaining
  return timeRemaining < 300;
}

// Get time remaining until expiry in seconds
export function getTimeUntilExpiry(): number | null {
  const sessionCookie = getSessionCookie();
  if (!sessionCookie) {
    return null;
  }
  
  const payload = decodeJWTPayload(sessionCookie);
  if (!payload || !payload.exp) {
    return null;
  }
  
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - now);
}

// Perform background refresh without blocking UI
export function performBackgroundRefresh(): void {
  // Only refresh if session is near expiry
  if (!isSessionNearExpiry()) {
    return;
  }
  
  // Use low-priority fetch with no await to avoid blocking
  if ('scheduler' in window && 'postTask' in (window as any).scheduler) {
    // Use scheduler API for low priority if available
    (window as any).scheduler.postTask(() => {
      refreshSession();
    }, { priority: 'background' });
  } else if ('requestIdleCallback' in window) {
    // Fallback to requestIdleCallback
    requestIdleCallback(() => {
      refreshSession();
    });
  } else {
    // Fallback to setTimeout with low priority
    setTimeout(() => {
      refreshSession();
    }, 0);
  }
}

// Internal refresh function
function refreshSession(): void {
  // Use navigator.sendBeacon if available for fire-and-forget
  if ('sendBeacon' in navigator) {
    try {
      navigator.sendBeacon('/api/auth/refresh', new Blob(['{}'], {
        type: 'application/json'
      }));
      return;
    } catch (error) {
      console.log('[refreshSession] sendBeacon failed, falling back to fetch:', error);
    }
  }
  
  // Fallback to low-priority fetch
  fetch('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: '{}',
    // Use low priority if supported
    ...(('priority' in Request.prototype) && { priority: 'low' })
  }).catch(error => {
    // Silently fail - middleware will handle real expiration on next navigation
    console.log('[refreshSession] Background refresh failed:', error);
  });
}

// Hook for components to check and conditionally refresh
export function useConditionalSessionRefresh() {
  if (typeof window === 'undefined') {
    return; // Server-side
  }
  
  // Check expiry and refresh if needed, but don't block
  performBackgroundRefresh();
}

// Utility to check if session exists and is valid
export function hasValidSession(): boolean {
  const sessionCookie = getSessionCookie();
  if (!sessionCookie) {
    return false;
  }
  
  const payload = decodeJWTPayload(sessionCookie);
  if (!payload || !payload.exp || !payload.uid) {
    return false;
  }
  
  const now = Math.floor(Date.now() / 1000);
  return payload.exp > now;
}

// Export for debugging purposes
export function getSessionInfo() {
  const sessionCookie = getSessionCookie();
  if (!sessionCookie) {
    return null;
  }
  
  const payload = decodeJWTPayload(sessionCookie);
  if (!payload) {
    return null;
  }
  
  const now = Math.floor(Date.now() / 1000);
  const timeRemaining = payload.exp ? payload.exp - now : null;
  
  return {
    uid: payload.uid,
    role: payload.role,
    exp: payload.exp,
    timeRemaining,
    isNearExpiry: timeRemaining ? timeRemaining < 300 : false,
    isExpired: timeRemaining ? timeRemaining <= 0 : true
  };
}