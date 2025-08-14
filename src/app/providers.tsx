"use client";
import { Toaster } from "sonner";
import PWAManager from "../components/pwa/PWAManager";
import AccessibilityAudit from "../components/accessibility/AccessibilityAudit";

export default function ClientProviders() {
  return (
    <>
      <Toaster richColors position="top-right" closeButton />
      <PWAManager />
      <AccessibilityAudit />
    </>
  );
}