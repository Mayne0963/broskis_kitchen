type Props = { status: string };

export default function StatusBadge({ status }: Props) {
  const s = (status ?? "").toLowerCase();
  const map: Record<string, string> = {
    new: "badge badge--new",
    in_review: "badge badge--in_review",
    quoted: "badge badge--quoted",
    confirmed: "badge badge--confirmed",
    cancelled: "badge badge--cancelled",
    archived: "badge badge--archived",
    paid: "badge badge--paid",
  };
  return <span className={map[s] ?? "badge"}>{s || "unknown"}</span>;
}