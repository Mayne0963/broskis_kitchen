"use client";
import useSWR from "swr";

const fetcher = (u: string) => fetch(u, { cache: "no-store" }).then(r => r.json());

export function useAuth() {
  return useSWR("/api/session", fetcher, { 
    refreshInterval: 60000, 
    revalidateOnFocus: true 
  });
}