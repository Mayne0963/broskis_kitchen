"use client";
import { useRef, useState, useEffect } from "react";
import { PRIZES } from "@/lib/rewards/rollPrize";

export default function LuxuryWheel() {
  const c = useRef<HTMLCanvasElement>(null);
  const [s, setS] = useState(false);
  const [st, setSt] = useState({ canSpin: false, availableTokens: 0 });
  const [m, setM] = useState("");

  async function refresh() {
    setSt(await fetch("/api/rewards/status").then(r => r.json()));
  }

  useEffect(() => {
    refresh();
    draw(0);
  }, []);

  function draw(a = 0) {
    const cv = c.current;
    if (!cv) return;
    const x = cv.getContext("2d");
    if (!x) return;
    const W = cv.width = 420, H = cv.height = 420, cx = W / 2, cy = H / 2, R = 190;

    x.clearRect(0, 0, W, H);
    const g = x.createRadialGradient(cx, cy, R * .4, cx, cy, R);
    g.addColorStop(0, "#FFE082");
    g.addColorStop(1, "#C9A227");
    x.beginPath();
    x.arc(cx, cy, R + 12, 0, 2 * Math.PI);
    x.fillStyle = g;
    x.fill();

    const seg = PRIZES.length;
    for (let i = 0; i < seg; i++) {
      const stA = a + (i * 2 * Math.PI / seg), end = a + ((i + 1) * 2 * Math.PI / seg);
      x.beginPath();
      x.moveTo(cx, cy);
      x.arc(cx, cy, R, stA, end);
      x.closePath();
      x.fillStyle = i % 2 ? "#111A23" : "#0E141A";
      x.fill();

      x.save();
      x.translate(cx, cy);
      x.rotate((stA + end) / 2);
      x.textAlign = "right";
      x.font = "600 16px system-ui";
      x.fillStyle = "#E6C45C";
      x.fillText(PRIZES[i].label, R - 16, 6);
      x.restore();
    }

    x.beginPath();
    x.arc(cx, cy, 54, 0, 2 * Math.PI);
    x.fillStyle = "#0B0F15";
    x.fill();
    x.strokeStyle = "#E6C45C";
    x.lineWidth = 2;
    x.stroke();
    x.beginPath();
    x.moveTo(cx, cy - (R + 20));
    x.lineTo(cx - 12, cy - (R - 6));
    x.lineTo(cx + 12, cy - (R - 6));
    x.closePath();
    x.fillStyle = "#E6C45C";
    x.fill();
  }

  async function spin() {
    if (s) return;
    setM("");
    await refresh();
    if (!st.canSpin) {
      setM(st.availableTokens > 0 ? "Cooldown" : "Not eligible");
      return;
    }
    setS(true);
    const r = await fetch("/api/rewards/spin", { method: "POST" }).then(r => r.json());

    if (!r.ok) {
      setS(false);
      setM(r.error === "COOLDOWN" ? "Cooldown" : "Not eligible");
      await refresh();
      return;
    }

    const idx = PRIZES.findIndex(p => p.key === r.prize?.key), seg = PRIZES.length, base = 6, final = (Math.PI * 1.5) - ((idx + .5) * (2 * Math.PI / seg)), total = base * 2 * Math.PI + (final % (2 * Math.PI));
    let t = 0;
    const T = 3e3;
    const start = performance.now();
    const anim = (now: number) => {
      t = (now - start) / T;
      const e = 1 - Math.pow(1 - Math.min(t, 1), 3);
      draw(total * e);
      if (t < 1) requestAnimationFrame(anim);
      else {
        setS(false);
        setM(`You won ${r.prize?.label}!`);
        refresh();
      }
    };
    requestAnimationFrame(anim);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={c}
        className="rounded-2xl shadow-xl border border-yellow-600/40 bg-[#0B0F15]"
      />
      <button
        onClick={spin}
        disabled={s}
        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-semibold shadow hover:opacity-90 disabled:opacity-60"
      >
        {s ? "Spinning…" : st.canSpin ? "Spin the Luxury Wheel" : "Spin Unavailable"}
      </button>
      <p className="text-sm text-yellow-200/80">{m}</p>
      <p className="text-xs text-slate-400">Tokens: {st.availableTokens}</p>
    </div>
  );
}