// app/admin/signin/SigninForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { useSession } from "@/hooks/useSession";
import { isAdmin } from "@/lib/roles";

export default function SigninForm() {
  const { user, isLoading: sessionLoading } = useSession();
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || searchParams.get("next") || "/admin/catering";
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionLoading && user) {
      // Check if user has admin role
      if (isAdmin(user.role)) {
        router.replace(callbackUrl);
      } else {
        setError("Admin access required");
      }
    }
  }, [sessionLoading, user, callbackUrl, router]);

  if (sessionLoading) {
    return <div className="text-center text-sm opacity-70">Checking session…</div>;
  }

  if (user && isAdmin(user.role)) {
    return <div className="text-center text-sm opacity-70">Redirecting…</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const success = await login(email, password);
      if (success) {
        // The useEffect will handle the redirect after successful signin
        router.replace(callbackUrl);
      } else {
        setError("Invalid credentials");
      }
    } catch (error) {
      console.error("Admin sign in error:", error);
      setError("Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");

    try {
      const success = await loginWithGoogle();
      if (success) {
        router.replace(callbackUrl);
      } else {
        setError("Google sign in failed");
      }
    } catch (error) {
      console.error("Google sign in error:", error);
      setError("Google sign in failed");
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-slate-800 border-slate-700">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-yellow-500 p-3 rounded-full">
            <Shield className="w-8 h-8 text-black" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-white">Admin Sign In</CardTitle>
        <CardDescription className="text-slate-400">
          Access the Broski&apos;s Kitchen admin dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              placeholder="admin@broskiskitchen.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-semibold"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-600" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-800 px-2 text-slate-400">Or continue with</span>
          </div>
        </div>

        <Button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          variant="outline"
          className="w-full border-slate-600 text-white hover:bg-slate-700"
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </Button>
      </CardContent>
    </Card>
  );
}