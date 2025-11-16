"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const path = usePathname();
  const active = (href: string) =>
    path === href ? "text-[var(--bk-gold)]" : "text-[var(--bk-silver)]";

  return (
    <header className="border-b" style={{ borderColor: "var(--bk-border)" }}>
      <nav className="container-xl h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold" style={{ color: "var(--bk-silver)" }}>
          Broski&apos;s Kitchen
        </Link>

        <ul className="hidden md:flex items-center gap-6">
          {["/menu","/catering","/about","/contact"].map(h => (
            <li key={h}>
              <Link href={h} className={`${active(h)} hover:text-[var(--bk-gold-2)]`}>
                {h.replace("/","").replace(/^./,c=>c.toUpperCase())}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href="https://otw-chi.vercel.app"
            className="btn btn-lg border-[1.5px]"
            style={{
              background:
                "linear-gradient(180deg, rgba(241,196,83,.22), rgba(241,196,83,.12))",
              borderColor: "var(--bk-gold)",
              color: "#1a1400",
            }}
          >
            Order Now
          </Link>
        </div>
      </nav>
    </header>
  );
}