type Props = { status: string };

export default function StatusBadge({ status }: Props) {
  const s = (status ?? "").toLowerCase();
  const map: Record<string, string> = {
    new: "border-sky-400/40 text-sky-300 bg-sky-400/10",
    in_review: "border-amber-400/40 text-amber-300 bg-amber-400/10",
    quoted: "border-violet-400/40 text-violet-300 bg-violet-400/10",
    confirmed: "border-emerald-400/40 text-emerald-300 bg-emerald-400/10",
    cancelled: "border-rose-400/40 text-rose-300 bg-rose-400/10",
    archived: "border-slate-400/40 text-slate-300 bg-slate-400/10",
  };
  const cls = map[s] ?? "border-white/25 text-white/80 bg-white/10";
  return <span className={`badge ${cls}`}>{s || "unknown"}</span>;
}