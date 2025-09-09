"use client";
import { Toaster } from "sonner";
import PWAManager from "../components/pwa/PWAManager";
import AccessibilityAudit from "../components/accessibility/AccessibilityAudit";
import { getFirebaseApp } from "../lib/firebaseClient";

// Initialize Firebase App Check on client side
getFirebaseApp();

export default function ClientProviders() {
  return (
    <>
      <Toaster richColors position="top-right" closeButton />
      <PWAManager />
      <AccessibilityAudit />
    </>
  );
}