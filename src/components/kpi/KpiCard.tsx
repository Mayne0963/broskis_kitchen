"use client";

import * as React from "react";

type DeltaType = "up" | "down" | "flat";
type Format = "number" | "currency" | "percent";

function formatValue(
  v: number | string | null | undefined,
  fmt: Format = "number",
  currency: string = "USD"
) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v;
  try {
    switch (fmt) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(v);
      case "percent":
        return `${(v * 100).toFixed(1)}%`;
      default:
        return new Intl.NumberFormat("en-US").format(v);
    }
  } catch {
    return String(v);
  }
}

export default function KpiCard({
  title,
  value,
  format = "number",
  currency = "USD",
  subtitle,
  delta,
  deltaType = "flat",
  loading = false,
  helpText,
  icon,
  href,
  onClick,
  className = "",
}: {
  title: string;
  value: number | string | null | undefined;
  format?: Format;
  currency?: string;
  subtitle?: string;
  delta?: number | string | null;
  deltaType?: DeltaType;
  loading?: boolean;
  helpText?: string;
  icon?: React.ReactNode;
  href?: string;           // when provided, whole card is a link
  onClick?: () => void;    // or use click handler
  className?: string;
}) {
  const body = (
    <div
      className={[
        "rounded-2xl border border-[#FFD700] bg-[#0b0b0b] text-white p-4",
        "transition hover:border-[#e6c400]",
        onClick ? "cursor-pointer" : "",
        className,
      ].join(" ")}
      onClick={onClick}
      title={helpText}
      role={onClick ? "button" : "group"}
      aria-busy={loading}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm text-white/70 truncate">{title}</div>
          <div className="mt-1 text-2xl font-semibold text-[#FFD700]">
            {loading ? <span className="opacity-60">Loading…</span> : formatValue(value, format, currency)}
          </div>
          {subtitle && (
            <div className="mt-1 text-xs text-white/60">{subtitle}</div>
          )}
        </div>
        {icon && <div className="shrink-0">{icon}</div>}
      </div>

      {delta !== undefined && delta !== null && (
        <div className="mt-3 inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs"
             data-delta={deltaType}
             style={{
               background: "rgba(255, 215, 0, 0.08)",
               border: "1px solid rgba(255, 215, 0, 0.35)"
             }}>
          <span className={
            deltaType === "up" ? "text-emerald-400" :
            deltaType === "down" ? "text-red-400" : "text-white/80"
          }>
            {deltaType === "up" ? "▲" : deltaType === "down" ? "▼" : "■"}
          </span>
          <span className="text-white/80">{typeof delta === "number" ? `${delta > 0 ? "+" : ""}${delta}` : delta}</span>
        </div>
      )}
    </div>
  );

  return href ? (
    <a href={href} className="block no-underline">{body}</a>
  ) : body;
}