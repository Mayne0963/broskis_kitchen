"use client";

// Wrapper around the UI toast implementation to provide a shadcn-style API
import {
  toast as toastManager,
  useToast,
  ToastContainer,
} from "@/components/ui/use-toast";

export { useToast, ToastContainer };
export type { ToastProps } from "@/components/ui/use-toast";

interface ToastOptions {
  title: string;
  description?: string;
  /**
   * Maps to the underlying toast types. "destructive" is treated as "error".
   */
  variant?: "default" | "destructive" | "success" | "error" | "warning" | "info";
  duration?: number;
}

/**
 * Provides a `toast({ title, description, variant })` API similar to shadcn/ui
 * while using the existing event-based toast manager under the hood.
 */
export function toast({
  title,
  description,
  variant,
  duration,
}: ToastOptions) {
  const message = description ? `${title} - ${description}` : title;

  const type =
    variant === "destructive" || variant === "error"
      ? "error"
      : variant === "warning"
      ? "warning"
      : variant === "info"
      ? "info"
      : "success"; // default

  const handler = (toastManager as Record<string, (msg: string, dur?: number) => void>)[type];
  if (handler) {
    handler(message, duration);
  }
}