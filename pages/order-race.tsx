import { useEffect, useState } from "react";

const MAX_PLATES = 22;

const MOCK_SHIFTS = {
  "1st": [
    { workplaceName: "General Motors – Body Shop", orders: 17 },
    { workplaceName: "Amazon Sort Center", orders: 9 },
    { workplaceName: "Parkview Hospital – 5th Floor", orders: 6 },
  ],
  "2nd": [
    { workplaceName: "Dana Corporation", orders: 12 },
    { workplaceName: "Sweetwater Sound", orders: 5 },
  ],
  "3rd": [
    { workplaceName: "FedEx Hub", orders: 14 },
    { workplaceName: "Steel Dynamics – Night Crew", orders: 4 },
  ],
};

export default function OrderRacePage() {
  const [activeShift, setActiveShift] = useState("1st");
  const [raceData, setRaceData] = useState<any | null>(null);

  // Fetch race data (deliveryDate)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/order-race');
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        if (mounted) setRaceData(json);
      } catch (e) {
        console.warn('Failed to load order race data:', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const rows = (MOCK_SHIFTS[activeShift] || []).slice().sort(
    (a, b) => b.orders - a.orders
  );

  const winner = rows.find((w) => w.orders >= MAX_PLATES);

  // Format delivery date label from "YYYY-MM-DD"
  let deliveryDateLabel = "";
  if (raceData?.deliveryDate) {
    const d = new Date(String(raceData.deliveryDate) + "T00:00:00");
    const opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric", year: "numeric" };
    deliveryDateLabel = d.toLocaleDateString(undefined, opts);
  }

  return (
    <main className="page-wrapper">
      <h1 className="page-title">ORDER RACE LEADERBOARD</h1>
      <p className="page-sub">
        First workplace on each shift to hit <b>{MAX_PLATES} plates</b> wins tomorrow&apos;s
        Broski Lunch Drop with free OTW delivery.
      </p>

      <div className="race-date-row">
        <span className="race-date-label">
          {deliveryDateLabel ? (
            <>Racing for: <b>{deliveryDateLabel}</b></>
          ) : (
            <>Racing for: <b>Upcoming Lunch Drop</b></>
          )}
        </span>
        <span className="race-date-badge">
          {raceData?.raceClosed === true ? "RACE CLOSED – CUT-OFF PASSED" : "RACE OPEN – ORDERS COUNTING"}
        </span>
      </div>

      <div className="shift-tabs">
        {["1st", "2nd", "3rd"].map((shift) => (
          <button
            key={shift}
            type="button"
            onClick={() => setActiveShift(shift)}
            className={
              "shift-tab" +
              (activeShift === shift ? " shift-tab--active" : "")
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
            Hit {winner.orders} / {MAX_PLATES} plates. Lunch Drop is locked in for tomorrow.
          </p>
        </div>
      )}

      <div className="race-table-wrap">
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
                  No workplaces active on this shift yet.
                </td>
              </tr>
            )}

            {rows.map((row, index) => {
              const ratio = Math.min(row.orders / MAX_PLATES, 1);
              let status = "Getting Started";
              if (row.orders >= MAX_PLATES) status = "Winner";
              else if (row.orders >= MAX_PLATES - 4) status = "In the Lead";
              else if (row.orders >= Math.round(MAX_PLATES * 0.5)) status = "Close";
              else if (row.orders >= Math.round(MAX_PLATES * 0.25)) status = "Building";

              return (
                <tr key={row.workplaceName}>
                  <td>{index + 1}</td>
                  <td>{row.workplaceName}</td>
                  <td>
                    {row.orders} / {MAX_PLATES}
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
        <a href="/enter-workplace" className="btn-signup">
          ENTER YOUR WORKPLACE
        </a>
        <a href="/lunch-drop" className="btn-race">
          LEARN ABOUT LUNCH DROP
        </a>
      </div>
    </main>
  );
}