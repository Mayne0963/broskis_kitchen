"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthClaims } from '../../hooks/useAuthClaims';

interface AdminGateProps {
  children: React.ReactNode;
}

export function AdminGate({ children }: AdminGateProps) {
  const { claims, loading } = useAuthClaims();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !claims?.admin) {
      router.push('/');
    }
  }, [loading, claims?.admin, router]);

  // Show loading state while checking claims
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If not admin, don't render anything (redirect will happen)
  if (!claims?.admin) {
    return null;
  }

  // Render children if user is admin
  return <>{children}</>;
}