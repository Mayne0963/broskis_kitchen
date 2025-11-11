import { NextRequest, NextResponse } from "next/server";
import { SESSION_CONFIG } from "./sessionManager";

export interface BrowserInfo {
  userAgent: string;
  browser: {
    name: string;
    version: string;
    major: string;
  };
  os: {
    name: string;
    version: string;
  };
  device: {
    type: string;
    vendor?: string;
    model?: string;
  };
  screen?: {
    width: number;
    height: number;
    colorDepth: number;
  };
  timezone: string;
  language: string;
  cookiesEnabled: boolean;
  localStorageEnabled: boolean;
  sessionStorageEnabled: boolean;
  fingerprint?: string;
}

export interface SessionStorageConfig {
  cookieName: string;
  localStorageKey: string;
  sessionStorageKey: string;
  useSecureStorage: boolean;
  encryptionKey?: string;
}

export interface CrossBrowserSession {
  sessionId: string;
  userId: string;
  browserInfo: BrowserInfo;
  createdAt: number;
  lastAccessed: number;
  storageMethod: "cookie" | "localStorage" | "sessionStorage" | "memory";
  fallbackUsed: boolean;
}

/**
 * Browser compatibility and storage manager
 */
export class BrowserSessionManager {
  private static instance: BrowserSessionManager;
  private readonly storageConfig: SessionStorageConfig;
  private fallbackMethods = new Map<string, () => boolean>();

  static getInstance(): BrowserSessionManager {
    if (!BrowserSessionManager.instance) {
      BrowserSessionManager.instance = new BrowserSessionManager();
    }
    return BrowserSessionManager.instance;
  }

  private constructor() {
    this.storageConfig = {
      cookieName: "__session",
      localStorageKey: "broskis_kitchen_session",
      sessionStorageKey: "broskis_kitchen_temp_session",
      useSecureStorage: true,
      encryptionKey: process.env.SESSION_ENCRYPTION_KEY
    };

    this.initializeFallbackMethods();
  }

  /**
   * Initialize fallback storage methods
   */
  private initializeFallbackMethods(): void {
    this.fallbackMethods.set("localStorage", () => {
      try {
        if (typeof window !== 'undefined') {
          const testKey = "__broskis_test__";
          window.localStorage.setItem(testKey, "test");
          window.localStorage.removeItem(testKey);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    });

    this.fallbackMethods.set("sessionStorage", () => {
      try {
        if (typeof window !== 'undefined') {
          const testKey = "__broskis_test__";
          window.sessionStorage.setItem(testKey, "test");
          window.sessionStorage.removeItem(testKey);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    });

    this.fallbackMethods.set("cookie", () => {
      try {
        if (typeof document !== 'undefined') {
          document.cookie = "__broskis_test__=test; path=/";
          const canRead = document.cookie.includes("__broskis_test__");
          document.cookie = "__broskis_test__=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
          return canRead;
        }
        return false;
      } catch {
        return false;
      }
    });
  }

  /**
   * Detect browser information
   */
  detectBrowserInfo(userAgent: string): BrowserInfo {
    const browser = this.parseUserAgent(userAgent);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language || "en-US";
    
    const browserInfo: BrowserInfo = {
      userAgent,
      browser: browser.browser,
      os: browser.os,
      device: browser.device,
      timezone,
      language,
      cookiesEnabled: navigator.cookieEnabled,
      localStorageEnabled: this.fallbackMethods.get("localStorage")!(),
      sessionStorageEnabled: this.fallbackMethods.get("sessionStorage")!()
    };

    // Add screen info if available
    if (typeof window !== 'undefined' && window.screen) {
      browserInfo.screen = {
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth
      };
    }

    // Generate fingerprint
    browserInfo.fingerprint = this.generateFingerprint(browserInfo);

    return browserInfo;
  }

  /**
   * Parse user agent string
   */
  private parseUserAgent(userAgent: string): Partial<BrowserInfo> {
    const patterns = {
      browser: [
        { name: "Chrome", regex: /Chrome\/(\d+(\.\d+)?)/ },
        { name: "Firefox", regex: /Firefox\/(\d+(\.\d+)?)/ },
        { name: "Safari", regex: /Version\/(\d+(\.\d+)?).*Safari/ },
        { name: "Edge", regex: /Edge\/(\d+(\.\d+)?)/ },
        { name: "Opera", regex: /OPR\/(\d+(\.\d+)?)/ }
      ],
      os: [
        { name: "Windows", regex: /Windows NT (\d+\.\d+)/ },
        { name: "MacOS", regex: /Mac OS X (\d+[_\.]\d+)/ },
        { name: "Linux", regex: /Linux/ },
        { name: "Android", regex: /Android (\d+\.\d+)/ },
        { name: "iOS", regex: /OS (\d+[_\.]\d+) like Mac OS X/ }
      ],
      device: [
        { type: "mobile", regex: /Mobile/ },
        { type: "tablet", regex: /Tablet/ },
        { type: "desktop", regex: /(?!Mobile|Tablet)/ }
      ]
    };

    const browserInfo: Partial<BrowserInfo> = {
      userAgent,
      browser: { name: "Unknown", version: "0", major: "0" },
      os: { name: "Unknown", version: "0" },
      device: { type: "desktop" }
    };

    // Detect browser
    for (const pattern of patterns.browser) {
      const match = userAgent.match(pattern.regex);
      if (match) {
        browserInfo.browser = {
          name: pattern.name,
          version: match[1],
          major: match[1].split('.')[0]
        };
        break;
      }
    }

    // Detect OS
    for (const pattern of patterns.os) {
      const match = userAgent.match(pattern.regex);
      if (match) {
        browserInfo.os = {
          name: pattern.name,
          version: match[1]?.replace('_', '.') || "0"
        };
        break;
      }
    }

    // Detect device type
    for (const pattern of patterns.device) {
      if (pattern.regex.test(userAgent)) {
        browserInfo.device = { type: pattern.type };
        break;
      }
    }

    return browserInfo;
  }

  /**
   * Generate browser fingerprint
   */
  private generateFingerprint(browserInfo: BrowserInfo): string {
    const components = [
      browserInfo.browser.name,
      browserInfo.browser.version,
      browserInfo.os.name,
      browserInfo.os.version,
      browserInfo.device.type,
      browserInfo.language,
      browserInfo.timezone,
      browserInfo.screen ? `${browserInfo.screen.width}x${browserInfo.screen.height}` : "unknown"
    ];

    return components.join("|");
  }

  /**
   * Store session data with cross-browser compatibility
   */
  async storeSession(sessionData: string, browserInfo: BrowserInfo): Promise<CrossBrowserSession> {
    const sessionId = this.extractSessionId(sessionData);
    const storageMethod = this.selectStorageMethod(browserInfo);
    const fallbackUsed = storageMethod !== "cookie";

    try {
      switch (storageMethod) {
        case "cookie":
          this.storeInCookie(sessionData);
          break;
        case "localStorage":
          this.storeInLocalStorage(sessionData);
          break;
        case "sessionStorage":
          this.storeInSessionStorage(sessionData);
          break;
        default:
          throw new Error("No suitable storage method available");
      }

      const crossBrowserSession: CrossBrowserSession = {
        sessionId,
        userId: this.extractUserId(sessionData),
        browserInfo,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        storageMethod,
        fallbackUsed
      };

      console.log(`[BROWSER] Stored session using ${storageMethod} method`);
      return crossBrowserSession;
    } catch (error) {
      console.error("[BROWSER] Failed to store session:", error);
      throw new Error("Session storage failed");
    }
  }

  /**
   * Retrieve session data with cross-browser compatibility
   */
  async retrieveSession(browserInfo: BrowserInfo): Promise<string | null> {
    const storageMethods = this.getStoragePriority(browserInfo);

    for (const method of storageMethods) {
      try {
        let sessionData: string | null = null;

        switch (method) {
          case "cookie":
            sessionData = this.retrieveFromCookie();
            break;
          case "localStorage":
            sessionData = this.retrieveFromLocalStorage();
            break;
          case "sessionStorage":
            sessionData = this.retrieveFromSessionStorage();
            break;
        }

        if (sessionData) {
          console.log(`[BROWSER] Retrieved session using ${method} method`);
          return sessionData;
        }
      } catch (error) {
        console.warn(`[BROWSER] Failed to retrieve from ${method}:`, error);
      }
    }

    return null;
  }

  /**
   * Clear session data from all storage methods
   */
  async clearSession(): Promise<void> {
    const methods = ["cookie", "localStorage", "sessionStorage"] as const;

    for (const method of methods) {
      try {
        switch (method) {
          case "cookie":
            this.clearCookie();
            break;
          case "localStorage":
            this.clearLocalStorage();
            break;
          case "sessionStorage":
            this.clearSessionStorage();
            break;
        }
      } catch (error) {
        console.warn(`[BROWSER] Failed to clear ${method}:`, error);
      }
    }

    console.log("[BROWSER] Cleared session from all storage methods");
  }

  /**
   * Select optimal storage method based on browser capabilities
   */
  private selectStorageMethod(browserInfo: BrowserInfo): "cookie" | "localStorage" | "sessionStorage" {
    // Prioritize cookies for better security and cross-domain support
    if (this.fallbackMethods.get("cookie")!()) {
      return "cookie";
    }

    // Fallback to localStorage
    if (this.fallbackMethods.get("localStorage")!()) {
      return "localStorage";
    }

    // Last resort: sessionStorage
    if (this.fallbackMethods.get("sessionStorage")!()) {
      return "sessionStorage";
    }

    throw new Error("No suitable storage method available");
  }

  /**
   * Get storage method priority for retrieval
   */
  private getStoragePriority(browserInfo: BrowserInfo): ("cookie" | "localStorage" | "sessionStorage")[] {
    return ["cookie", "localStorage", "sessionStorage"];
  }

  /**
   * Cookie storage methods
   */
  private storeInCookie(sessionData: string): void {
    if (typeof document === 'undefined') return;

    const expires = new Date();
    expires.setHours(expires.getHours() + 8); // 8 hours

    document.cookie = `${this.storageConfig.cookieName}=${encodeURIComponent(sessionData)}; expires=${expires.toUTCString()}; path=/; ${SESSION_CONFIG.secure ? 'secure;' : ''} ${SESSION_CONFIG.sameSite ? `samesite=${SESSION_CONFIG.sameSite};` : ''}`;
  }

  private retrieveFromCookie(): string | null {
    if (typeof document === 'undefined') return null;

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === this.storageConfig.cookieName) {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  private clearCookie(): void {
    if (typeof document === 'undefined') return;

    document.cookie = `${this.storageConfig.cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  /**
   * LocalStorage methods
   */
  private storeInLocalStorage(sessionData: string): void {
    if (typeof window === 'undefined') return;

    if (this.storageConfig.useSecureStorage && this.storageConfig.encryptionKey) {
      // TODO: Implement encryption for sensitive data
      window.localStorage.setItem(this.storageConfig.localStorageKey, sessionData);
    } else {
      window.localStorage.setItem(this.storageConfig.localStorageKey, sessionData);
    }
  }

  private retrieveFromLocalStorage(): string | null {
    if (typeof window === 'undefined') return null;

    return window.localStorage.getItem(this.storageConfig.localStorageKey);
  }

  private clearLocalStorage(): void {
    if (typeof window === 'undefined') return;

    window.localStorage.removeItem(this.storageConfig.localStorageKey);
  }

  /**
   * SessionStorage methods
   */
  private storeInSessionStorage(sessionData: string): void {
    if (typeof window === 'undefined') return;

    if (this.storageConfig.useSecureStorage && this.storageConfig.encryptionKey) {
      // TODO: Implement encryption for sensitive data
      window.sessionStorage.setItem(this.storageConfig.sessionStorageKey, sessionData);
    } else {
      window.sessionStorage.setItem(this.storageConfig.sessionStorageKey, sessionData);
    }
  }

  private retrieveFromSessionStorage(): string | null {
    if (typeof window === 'undefined') return null;

    return window.sessionStorage.getItem(this.storageConfig.sessionStorageKey);
  }

  private clearSessionStorage(): void {
    if (typeof window === 'undefined') return;

    window.sessionStorage.removeItem(this.storageConfig.sessionStorageKey);
  }

  /**
   * Extract session ID from session data
   */
  private extractSessionId(sessionData: string): string {
    try {
      const data = JSON.parse(sessionData);
      return data.sessionId || "unknown";
    } catch {
      return "unknown";
    }
  }

  /**
   * Extract user ID from session data
   */
  private extractUserId(sessionData: string): string {
    try {
      const data = JSON.parse(sessionData);
      return data.uid || "unknown";
    } catch {
      return "unknown";
    }
  }

  /**
   * Handle CORS for cross-domain requests
   */
  handleCORS(request: NextRequest): NextResponse {
    const origin = request.headers.get("origin");
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_SITE_URL,
      "http://localhost:3000",
      "https://broskiskitchen.com"
    ].filter(Boolean);

    const response = NextResponse.next();

    if (origin && allowedOrigins.some(allowed => origin.includes(allowed))) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Session-Id");
      response.headers.set("Access-Control-Max-Age", "86400");
    }

    return response;
  }
}

/**
 * Browser compatibility middleware
 */
export function createBrowserCompatibilityMiddleware() {
  const browserManager = BrowserSessionManager.getInstance();

  return (request: NextRequest) => {
    try {
      const userAgent = request.headers.get("user-agent") || "";
      const browserInfo = browserManager.detectBrowserInfo(userAgent);

      // Check for browser compatibility issues
      const compatibilityIssues = checkBrowserCompatibility(browserInfo);
      
      if (compatibilityIssues.length > 0) {
        console.warn("[BROWSER] Compatibility issues detected:", compatibilityIssues);
      }

      // Handle CORS
      const corsResponse = browserManager.handleCORS(request);
      
      // Add browser info headers
      corsResponse.headers.set("x-browser-name", browserInfo.browser.name);
      corsResponse.headers.set("x-browser-version", browserInfo.browser.version);
      corsResponse.headers.set("x-device-type", browserInfo.device.type);
      corsResponse.headers.set("x-browser-fingerprint", browserInfo.fingerprint || "unknown");

      return corsResponse;
    } catch (error) {
      console.error("[BROWSER] Middleware error:", error);
      return NextResponse.next();
    }
  };
}

/**
 * Check browser compatibility
 */
function checkBrowserCompatibility(browserInfo: BrowserInfo): string[] {
  const issues: string[] = [];

  // Check for very old browsers
  const majorVersion = parseInt(browserInfo.browser.major);
  
  switch (browserInfo.browser.name) {
    case "Chrome":
      if (majorVersion < 80) {
        issues.push("Chrome version is too old (minimum: 80)");
      }
      break;
    case "Firefox":
      if (majorVersion < 75) {
        issues.push("Firefox version is too old (minimum: 75)");
      }
      break;
    case "Safari":
      if (majorVersion < 12) {
        issues.push("Safari version is too old (minimum: 12)");
      }
      break;
    case "Edge":
      if (majorVersion < 80) {
        issues.push("Edge version is too old (minimum: 80)");
      }
      break;
  }

  // Check storage support
  if (!browserInfo.cookiesEnabled) {
    issues.push("Cookies are disabled");
  }
  
  if (!browserInfo.localStorageEnabled) {
    issues.push("LocalStorage is not available");
  }

  return issues;
}

// Export singleton instance and middleware
export const browserSessionManager = BrowserSessionManager.getInstance();
export const browserCompatibilityMiddleware = createBrowserCompatibilityMiddleware();