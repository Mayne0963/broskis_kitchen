"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Shield, LogOut, Zap } from 'lucide-react';
import QuickActions from '@/components/dashboard/QuickActions';

// Simple auth state management without complex context
interface AuthState {
  user: any;
  loading: boolean;
  isAuthenticated: boolean;
}

export default function SimpleDashboardGate() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false
  });

  useEffect(() => {
    // Simple auth check - just simulate for now
    const checkAuth = async () => {
      try {
        // Check if there's a session cookie
        const hasSession = document.cookie.includes('session=');
        
        if (hasSession) {
          // Simulate user data
          setAuthState({
            user: { email: 'user@example.com', name: 'Test User' },
            loading: false,
            isAuthenticated: true
          });
        } else {
          setAuthState({
            user: null,
            loading: false,
            isAuthenticated: false
          });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false
        });
      }
    };

    checkAuth();
  }, []);

  const handleSignOut = () => {
    // Simple sign out - clear session cookie
    document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setAuthState({
      user: null,
      loading: false,
      isAuthenticated: false
    });
  };

  // Loading state
  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your space...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show inline sign-in
  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Sign in to view your dashboard</CardTitle>
            <CardDescription>
              Access your personalized dashboard and manage your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full" 
              onClick={() => window.location.href = '/login'}
            >
              Sign In
            </Button>
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="/signup" className="text-blue-600 hover:underline">
                  Sign up
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated - show dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {authState.user?.name || 'User'}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Your Dashboard</CardTitle>
              <CardDescription>
                This is your personalized dashboard where you can manage your account and access features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Email: {authState.user?.email}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QuickActions />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest actions and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                No recent activity to display.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}