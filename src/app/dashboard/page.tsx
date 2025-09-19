"use client";

import { useState, useEffect } from 'react';
import { onAuthStateChanged, getIdTokenResult, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/services/firebase';
import { establishSessionCookie, clearSessionCookie } from '@/lib/sessionClient';
import { User, Shield, LogOut, Home, Mail } from 'lucide-react';
import Link from 'next/link';
import type { User as FirebaseUser } from 'firebase/auth';
import Dashboard from '@/components/dashboard/Dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  claims?: any;
}



export default function DashboardPage() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
    claims: null
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get user claims for role-based access
          const tokenResult = await getIdTokenResult(user);
          setAuthState({
            user,
            loading: false,
            isAuthenticated: true,
            claims: tokenResult.claims
          });
        } catch (error) {
          console.error('Error getting user claims:', error);
          setAuthState({
            user,
            loading: false,
            isAuthenticated: true,
            claims: null
          });
        }
      } else {
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false,
          claims: null
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await clearSessionCookie();
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      await establishSessionCookie();
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-broski-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-broski-gold mx-auto mb-4"></div>
          <p className="text-white/70">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-broski-black text-white">
        <Card className="w-full max-w-md border-broski-gold bg-broski-black text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">Sign in to view your dashboard</CardTitle>
            <CardDescription className="text-white/70">
              You need to be authenticated to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleGoogleSignIn} className="w-full bg-broski-gold text-black hover:bg-broski-gold/90" size="lg">
              <Mail className="w-4 h-4 mr-2" />
              Sign in with Google
            </Button>
            <div className="text-center">
              <Link href="/" className="text-sm text-broski-gold hover:underline">
                ← Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAdmin = authState.claims?.role === 'admin' || authState.claims?.admin === true;
  const userRole = authState.claims?.role || 'customer';

  return (
    <div className="min-h-screen bg-broski-black text-white">
      <Dashboard 
        session={{
          user: {
            id: authState.user?.uid,
            uid: authState.user?.uid,
            email: authState.user?.email,
            displayName: authState.user?.displayName,
            role: isAdmin ? 'admin' : 'customer'
          }
        }}
        userId={authState.user?.uid}
        role={isAdmin ? 'admin' : 'customer'}
      />
    </div>
  );
}