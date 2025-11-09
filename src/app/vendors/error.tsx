"use client";
import React from "react";

export default function VendorsError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main style={{ padding: 16, maxWidth: 840, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Something went wrong</h1>
      <p style={{ marginTop: 8, color: "#f66" }}>{error?.message || "Unexpected error"}</p>
      <button
        onClick={() => reset()}
        style={{ marginTop: 16, padding: "8px 12px", border: "1px solid #444", borderRadius: 6 }}
      >
        Retry
      </button>
    </main>
  );
}