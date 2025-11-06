"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { AuthLoadingState } from "./AuthLoadingState";
import { AuthErrorBoundary } from "./AuthErrorBoundary";

interface ClientAuthGuardProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
  allowedRoles?: string[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function ClientAuthGuard({
  children,
  requireEmailVerification = false,
  allowedRoles = [],
  redirectTo = "/auth/login",
  fallback
}: ClientAuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    setIsChecking(false);

    if (!isAuthenticated || !user) {
      const currentPath = window.location.pathname + window.location.search;
      router.push(`${redirectTo}?next=${encodeURIComponent(currentPath)}&error=authentication_required`);
      return;
    }

    if (requireEmailVerification && !user.emailVerified) {
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/auth/verify-email?next=${encodeURIComponent(currentPath)}&error=email_verification_required`);
      return;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      router.push("/403?error=insufficient_permissions");
      return;
    }
  }, [user, isLoading, isAuthenticated, requireEmailVerification, allowedRoles, redirectTo, router]);

  if (isLoading || isChecking) {
    return fallback || <AuthLoadingState message="Verifying authentication..." />;
  }

  if (!isAuthenticated || !user) {
    return fallback || <AuthLoadingState message="Redirecting to login..." />;
  }

  if (requireEmailVerification && !user.emailVerified) {
    return fallback || <AuthLoadingState message="Email verification required..." />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return fallback || <AuthLoadingState message="Insufficient permissions..." />;
  }

  return (
    <AuthErrorBoundary>
      {children}
    </AuthErrorBoundary>
  );
}

// Higher-order component version
export function withClientAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ClientAuthGuardProps, 'children'> = {}
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <ClientAuthGuard {...options}>
        <Component {...props} />
      </ClientAuthGuard>
    );
  };
}