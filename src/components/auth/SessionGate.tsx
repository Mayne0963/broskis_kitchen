"use client";
import React from "react";
import { useRouter } from "next/navigation";

export default function SessionGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    let cancelled = false;
    const hit = async (retries = 2) => {
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          // helps when tab is navigating away or on slow networks
          keepalive: true,
          headers: { "x-refresh": "1" },
        });
        if (res.status === 401) {
          const from = encodeURIComponent(window.location.pathname);
          window.location.href = `/auth/login?from=${from}`;
          return;
        }
        if (!cancelled) setReady(true);
      } catch {
        if (retries > 0) setTimeout(() => hit(retries - 1), 250);
        else if (!cancelled) setReady(true); // fail-open to avoid infinite spinner
      }
    };
    hit();
    return () => { cancelled = true; };
  }, []);

  if (!ready) {
    return (
      <div className="w-full py-16 text-center text-sm opacity-80">
        Checking your session…
      </div>
    );
  }
  return <>{children}</>;
}