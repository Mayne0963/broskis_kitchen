"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ShiftKey = "1st" | "2nd" | "3rd";

interface ShiftRow {
  workplaceName: string;
  orders: number;
}

interface RaceData {
  maxPlates: number;
  deliveryDate: string;
  raceClosed: boolean;
  shifts: Record<ShiftKey, ShiftRow[]>;
}

const FALLBACK_MAX_PLATES = 22;

function formatDateISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function OrderRacePage() {
  const [activeShift, setActiveShift] = useState<ShiftKey>("1st");
  const [raceData, setRaceData] = useState<RaceData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(""); // YYYY-MM-DD

  // Initialize date to tomorrow to match server default
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    setSelectedDate(formatDateISO(tomorrow));
  }, []);

  // Fetch helper
  async function fetchRaceData(date?: string) {
    setLoading(true);
    setError(null);
    try {
      const qs = date ? `?date=${encodeURIComponent(date)}` : "";
      const res = await fetch(`/api/order-race${qs}`, { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed with status ${res.status}`);
      }
      const json = (await res.json()) as RaceData;
      setRaceData(json);
    } catch (e: any) {
      console.warn("Failed to load order race data:", e);
      setError(e?.message || "Failed to load race data");
    } finally {
      setLoading(false);
    }
  }

  // Initial load + refresh when date changes
  useEffect(() => {
    if (!selectedDate) return;
    let mounted = true;
    fetchRaceData(selectedDate);

    // Poll for live updates while race is open
    const interval = setInterval(() => {
      if (!mounted) return;
      // Only poll when race not closed (based on last known data)
      const closed = raceData?.raceClosed === true;
      if (!closed) fetchRaceData(selectedDate);
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const rows = useMemo(() => {
    const dataRows = raceData?.shifts?.[activeShift] || [];
    const list = dataRows.slice();
    return list.sort((a, b) => b.orders - a.orders);
  }, [activeShift, raceData]);

  const maxPlates = raceData?.maxPlates ?? FALLBACK_MAX_PLATES;
  const winner = rows.find((w) => w.orders >= maxPlates);

  let deliveryDateLabel = "";
  if (raceData?.deliveryDate) {
    const d = new Date(String(raceData.deliveryDate) + "T00:00:00");
    const opts: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    deliveryDateLabel = d.toLocaleDateString(undefined, opts);
  }

  return (
    <main className="page-wrapper">
      <h1 className="page-title">ORDER RACE LEADERBOARD</h1>
      <p className="page-sub">
        First workplace on each shift to hit <b>{maxPlates} plates</b> wins
        tomorrow&apos;s Broski Lunch Drop with free OTW delivery.
      </p>

      <div className="race-date-row">
        <span className="race-date-label">
          {deliveryDateLabel ? (
            <>
              Racing for: <b>{deliveryDateLabel}</b>
            </>
          ) : (
            <>
              Racing for: <b>Upcoming Lunch Drop</b>
            </>
          )}
        </span>
        <span className="race-date-badge">
          {raceData?.raceClosed === true
            ? "RACE CLOSED – CUT-OFF PASSED"
            : "RACE OPEN – ORDERS COUNTING"}
        </span>
        <span className="race-date-controls">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="race-date-input"
          />
          <button
            type="button"
            className="btn-outline"
            onClick={() => fetchRaceData(selectedDate)}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </span>
      </div>

      <div className="shift-tabs">
        {(["1st", "2nd", "3rd"] as ShiftKey[]).map((shift) => (
          <button
            key={shift}
            type="button"
            onClick={() => setActiveShift(shift)}
            className={
              "shift-tab" + (activeShift === shift ? " shift-tab--active" : "")
            }
          >
            {shift.toUpperCase()} SHIFT
          </button>
        ))}
      </div>

      {winner && (
        <div className="winner-card">
          <p className="winner-label">
            TODAY&apos;S WINNER – {activeShift.toUpperCase()} SHIFT
          </p>
          <p className="winner-name">{winner.workplaceName}</p>
          <p className="winner-text">
            Hit {winner.orders} / {maxPlates} plates. Lunch Drop is locked in for
            tomorrow.
          </p>
        </div>
      )}

      <div className="race-table-wrap">
        {error && (
          <div className="race-error">{error}</div>
        )}
        <table className="race-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Workplace</th>
              <th>Orders</th>
              <th>Progress</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="race-empty">
                  {loading
                    ? "Loading race data..."
                    : "No workplaces active on this shift yet."}
                </td>
              </tr>
            )}

            {rows.map((row, index) => {
              const ratio = Math.min(row.orders / maxPlates, 1);
              let status = "Getting Started";
              if (row.orders >= maxPlates) status = "Winner";
              else if (row.orders >= maxPlates - 4) status = "In the Lead";
              else if (row.orders >= Math.round(maxPlates * 0.5)) status = "Close";
              else if (row.orders >= Math.round(maxPlates * 0.25)) status = "Building";

              const isWinner = row.orders >= maxPlates;
              const rowClass = "race-row" + (isWinner ? " race-row--winner" : "");

              return (
                <tr key={row.workplaceName} className={rowClass}>
                  <td>{index + 1}</td>
                  <td>{row.workplaceName}</td>
                  <td>
                    {row.orders} / {maxPlates}
                  </td>
                  <td>
                    <div className="race-progress">
                      <div
                        className="race-progress-bar"
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                  </td>
                  <td>{status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="race-bottom-cta">
        <Link href="/enter-workplace" className="btn-signup">
          ENTER YOUR WORKPLACE
        </Link>
        <Link href="/lunch-drop" className="btn-race">
          LEARN ABOUT LUNCH DROP
        </Link>
      </div>
    </main>
  );
}
