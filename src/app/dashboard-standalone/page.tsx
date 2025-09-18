"use client";

import { useState, useEffect } from 'react';
import { onAuthStateChanged, getIdTokenResult, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/services/firebase';
import { establishSessionCookie, clearSessionCookie } from '@/lib/sessionClient';
import { User, Shield, LogOut, Home, BarChart3, Users, DollarSign, Mail } from 'lucide-react';
import Link from 'next/link';
import type { User as FirebaseUser } from 'firebase/auth';
import AdminKPI from '@/components/kpi/AdminKPI';
import QuickActions from '@/components/QuickActions';

interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  claims?: any;
}

// Simple Button component
const Button = ({ children, onClick, variant = 'primary', size = 'md', className = '', ...props }: any) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    destructive: 'bg-red-600 text-white hover:bg-red-700'
  };
  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-11 px-8'
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Simple Card components
const Card = ({ children, className = '', ...props }: any) => (
  <div className={`rounded-lg border bg-white text-gray-950 shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '', ...props }: any) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '', ...props }: any) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '', ...props }: any) => (
  <p className={`text-sm text-gray-500 ${className}`} {...props}>
    {children}
  </p>
);

const CardContent = ({ children, className = '', ...props }: any) => (
  <div className={`p-6 pt-0 ${className}`} {...props}>
    {children}
  </div>
);

export default function StandaloneDashboard() {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Sign in to view your dashboard</CardTitle>
            <CardDescription>
              You need to be authenticated to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleGoogleSignIn} className="w-full" size="lg">
              <Mail className="w-4 h-4 mr-2" />
              Sign in with Google
            </Button>
            <div className="text-center">
              <Link href="/" className="text-sm text-blue-600 hover:underline">
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              {isAdmin && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </span>
              )}

            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, {authState.user?.displayName || authState.user?.email}
              </div>
              <Link href="/">
                <Button variant="outline" size="sm">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Button onClick={handleSignOut} variant="destructive" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">


          {/* Stats Grid - Only show for admins */}
           {authState.claims?.role === 'admin' && (
             <div className="mb-8">
               <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin KPIs</h2>
               <AdminKPI />
               
               {/* Role card for admin */}
               <div className="mt-6">
                 <Card>
                   <CardContent className="p-6">
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="text-sm font-medium text-gray-600">Role</p>
                         <p className="text-2xl font-bold text-gray-900 capitalize">{userRole}</p>
                       </div>
                       <UserIcon className="h-8 w-8 text-orange-600" />
                     </div>
                   </CardContent>
                 </Card>
               </div>
             </div>
           )}
          
          {/* User-specific stats for non-admins */}
          {authState.claims?.role !== 'admin' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">My Orders</h3>
                <p className="text-3xl font-bold text-blue-600">-</p>
                <p className="text-sm text-gray-500">View your order history</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">My Spending</h3>
                <p className="text-3xl font-bold text-green-600">-</p>
                <p className="text-sm text-gray-500">Your total spending</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Status</h3>
                <p className="text-3xl font-bold text-purple-600">Active</p>
                <p className="text-sm text-gray-500">Account is in good standing</p>
              </div>
            </div>
          )}

          {/* Authentication Info */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Authentication Status</CardTitle>
              <CardDescription>
                Current session and implementation details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Status:</span>
                    <span className="text-sm text-green-600 font-medium">✅ Authenticated</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Method:</span>
                    <span className="text-sm text-gray-900">Firebase Auth</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Implementation:</span>
                    <span className="text-sm text-gray-900">Client-side Gate</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Redirect Loops:</span>
                    <span className="text-sm text-green-600 font-medium">None</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">User ID:</span>
                    <span className="text-sm text-gray-900 truncate">{authState.user?.uid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Email:</span>
                    <span className="text-sm text-gray-900">{authState.user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Role:</span>
                    <span className="text-sm text-gray-900 capitalize">{userRole}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Admin:</span>
                    <span className={`text-sm font-medium ${isAdmin ? 'text-red-600' : 'text-gray-600'}`}>
                      {isAdmin ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="min-h-screen bg-black text-white p-6">
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  );
}