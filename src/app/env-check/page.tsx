'use client';

export default function EnvCheckPage() {
  // Get all NEXT_PUBLIC_ environment variables
  const envVars = {
    // RECAPTCHA variables
    NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY || 'undefined',
    NEXT_PUBLIC_RECAPTCHA_V3_SECRET_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_V3_SECRET_KEY || 'undefined',
    
    // Firebase variables
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'undefined',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'undefined',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'undefined',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'undefined',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'undefined',
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'undefined',
    
    // Stripe variables
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'undefined',
    
    // Google Maps
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'undefined',
    
    // Age verification
    NEXT_PUBLIC_AGE_VERIFICATION_EXPIRY_DAYS: process.env.NEXT_PUBLIC_AGE_VERIFICATION_EXPIRY_DAYS || 'undefined',
    
    // Server-only variables (will show as undefined in browser)
    RECAPTCHA_V3_SITE_KEY: '(server-only)',
    RECAPTCHA_V3_SECRET_KEY: '(server-only)',
    FIREBASE_API_KEY: '(server-only)',
    FIREBASE_AUTH_DOMAIN: '(server-only)',
    FIREBASE_PROJECT_ID: '(server-only)',
    FIREBASE_STORAGE_BUCKET: '(server-only)',
    STRIPE_SECRET_KEY: '(server-only)',
    STRIPE_PUBLISHABLE_KEY: '(server-only)',
    GOOGLE_MAPS_API_KEY: '(server-only)',
    AGE_VERIFICATION_EXPIRY_DAYS: '(server-only)',
    NODE_ENV: '(server-only)'
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Environment Variables Check (Client-Side)</h1>
      <p className="mb-4 text-gray-600">
        This page shows environment variables available in the browser. 
        Only NEXT_PUBLIC_* variables are accessible on the client side.
      </p>
      
      <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
        {JSON.stringify(envVars, null, 2)}
      </pre>
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Notes:</h2>
        <ul className="list-disc list-inside text-sm text-gray-600">
          <li>Variables marked as "undefined" are not set or not accessible</li>
          <li>Variables marked as "(server-only)" are only available on the server</li>
          <li>Only NEXT_PUBLIC_* prefixed variables are available in the browser</li>
        </ul>
      </div>
    </div>
  );
}