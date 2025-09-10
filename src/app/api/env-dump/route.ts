import { NextResponse } from 'next/server';

export async function GET() {
  // Helper function to mask secrets (first 3 + last 3 chars)
  const maskSecret = (value: string | undefined): string => {
    if (!value) return 'undefined';
    if (value.length <= 6) return value;
    return value.substring(0, 3) + '***' + value.substring(value.length - 3);
  };

  // Get all environment variables
  const allEnvVars = process.env;
  const envData: Record<string, string> = {};

  // Filter and mask environment variables
  Object.keys(allEnvVars).forEach(key => {
    const value = allEnvVars[key];
    if (!value) return;

    // Include NEXT_PUBLIC_* variables (these are safe to show more of)
    if (key.startsWith('NEXT_PUBLIC_')) {
      envData[key] = value;
    }
    // Include and mask server secrets
    else if (
      key.startsWith('STRIPE_') ||
      key.startsWith('FIREBASE_') ||
      key.startsWith('NEXTAUTH_') ||
      key.startsWith('DATABASE_')
    ) {
      envData[key] = maskSecret(value);
    }
  });

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV,
    variables: envData,
    note: 'Server secrets masked with first 3 + last 3 chars. NEXT_PUBLIC_* variables shown in full.'
  });
}