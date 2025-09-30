"use client";
import { useRouter } from "next/navigation";

export function useAfterSignIn() {
  const router = useRouter();
  return async (to: string = "/admin") => {
    // wait for Set-Cookie to land, then bust caches
    await fetch("/api/admin/ping", { cache: "no-store" }).catch(() => {});
    await fetch("/api/session", { cache: "no-store" }).catch(() => {});
    router.replace(to);
    router.refresh();
  };
}