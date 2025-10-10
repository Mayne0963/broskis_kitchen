import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t" style={{ borderColor: "var(--bk-border)" }}>
      <div className="container-xl py-10 grid gap-8 md:grid-cols-3">
        <div>
          <div className="h3">Broski&apos;s Kitchen</div>
          <p className="mt-2 text-sm" style={{ color: "var(--bk-text-dim)" }}>
            Flavor with finesse. Delivered with love.
          </p>
        </div>
        <div>
          <div className="text-sm mb-2" style={{ color: "var(--bk-text-dim)" }}>Explore</div>
          <ul className="space-y-1 text-sm">
            {["Menu","Catering","About","Contact"].map(p=>(
              <li key={p}><Link className="link" href={`/${p.toLowerCase()}`}>{p}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-sm mb-2" style={{ color: "var(--bk-text-dim)" }}>Follow</div>
          <div className="text-sm">
            <a className="link" href="https://instagram.com" target="_blank">Instagram</a>
            <span className="mx-2 text-white/30">•</span>
            <a className="link" href="https://tiktok.com" target="_blank">TikTok</a>
          </div>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs" 
           style={{ borderColor:"var(--bk-border)", color:"var(--bk-text-soft)" }}>
        © {new Date().getFullYear()} Broski&apos;s Kitchen. All rights reserved.
      </div>
    </footer>
  );
}