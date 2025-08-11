"use client";

// Re-export toast utilities that provide the function-based API used across the app
// This ensures `toast({ title, description })` works correctly.
export { toast, useToast } from "@/components/ui/use-toast";
export type { ToastProps } from "@/components/ui/use-toast";
