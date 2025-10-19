"use client";
import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus refetchInterval={60} refetchWhenOffline={false} basePath="/api/auth">
      {children}
    </SessionProvider>
  );
}