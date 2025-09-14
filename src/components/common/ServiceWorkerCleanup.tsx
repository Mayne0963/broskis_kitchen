"use client";
import { useEffect } from "react";

export default function ServiceWorkerCleanup() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Unregister all service workers (e.g., old Firebase Hosting SW)
    navigator.serviceWorker.getRegistrations?.().then(regs => {
      regs.forEach(r => r.unregister().catch(() => {}));
    }).catch(() => {});
  }, []);
  return null;
}