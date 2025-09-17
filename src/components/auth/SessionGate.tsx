"use client";
import React from "react";
import { useRouter } from "next/navigation";

// Debounce duplicate calls with static in-flight promise
let inFlight: Promise<any> | null = null;

export default function SessionGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);
  const [checking, setChecking] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    let cancelled = false;
    
    const hit = async (retries = 2) => {
      // Reuse existing in-flight request if available
      if (inFlight) {
        try {
          await inFlight;
          if (!cancelled) setReady(true);
          return;
        } catch {
          // Continue with new request if existing one failed
        }
      }
      
      // Create new request promise
      inFlight = (async () => {
        try {
          performance.mark('refresh-start');
          
          // Add timeout guard: show "Still checking..." after 1s
          const timeoutId = setTimeout(() => {
            if (!cancelled) setChecking(true);
          }, 1000);
          
          const res = await fetch("/api/auth/refresh", {
            method: "POST",
            // helps when tab is navigating away or on slow networks
            keepalive: true,
            headers: { "x-refresh": "1" },
          });
          
          clearTimeout(timeoutId);
          performance.mark('refresh-end');
          performance.measure('refresh', 'refresh-start', 'refresh-end');
          console.log('[refresh-client] ms=', performance.getEntriesByName('refresh').at(-1)?.duration?.toFixed(1));
          
          // Handle 204 (fast-path success) immediately
          if (res.status === 204) {
            if (!cancelled) setReady(true);
            return;
          }
          
          if (res.status === 401) {
            const from = encodeURIComponent(window.location.pathname);
            window.location.href = `/auth/login?from=${from}`;
            return;
          }
          
          if (!cancelled) setReady(true);
        } catch (error) {
          if (retries > 0) {
            setTimeout(() => hit(retries - 1), 250);
          } else {
            if (!cancelled) setReady(true); // fail-open to avoid infinite spinner
          }
        } finally {
          inFlight = null;
        }
      })();
      
      return inFlight;
    };
    
    hit();
    return () => { cancelled = true; };
  }, []);

  if (!ready) {
    return (
      <div className="w-full py-16 text-center text-sm opacity-80">
        {checking ? "Still checking…" : "Checking your session…"}
      </div>
    );
  }
  return <>{children}</>;
}