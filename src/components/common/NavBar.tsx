"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

type NavItem = { href: string; label: string };

const leftItems: NavItem[] = [
  { href: "/menu", label: "Menu" },
  { href: "/rewards", label: "Rewards" },
  { href: "/events", label: "Events" },
  { href: "/catering", label: "Catering" },
  { href: "/contact", label: "Contact" },
  { href: "/otw", label: "OTW" }
];

const rightItems: NavItem[] = [
  { href: "/cart", label: "Cart" },
  { href: "/admin", label: "Admin" },
  { href: "/login", label: "Login" }
];

const linkBase = "px-3 py-2 rounded-md text-sm font-medium hover:opacity-90";
const active = "underline";

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const isActive = (href: string) => (pathname === href ? active : "");

  return (
    <nav className="w-full border-b border-zinc-800 bg-black/70 backdrop-blur sticky top-0 z-50 border border-emerald-500" data-nav="broski">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg sm:text-xl font-semibold">
              Broski&apos;s Kitchen
            </Link>
            <div className="hidden md:flex gap-1">
              {leftItems.map(i => (
                <Link key={i.href} href={i.href} className={`${linkBase} ${isActive(i.href)}`}>
                  {i.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden md:flex gap-2">
            {rightItems.map(i => (
              <Link key={i.href} href={i.href} className={`${linkBase} ${isActive(i.href)}`}>
                {i.label}
              </Link>
            ))}
            <form action="/api/auth/logout" method="post">
              <button type="submit" className={`${linkBase} bg-red-600`}>
                Logout
              </button>
            </form>
          </div>
          <button onClick={() => setOpen(v => !v)} className="md:hidden p-2 border rounded">
            ≡
          </button>
        </div>
        {open && (
          <div className="md:hidden pb-3 flex flex-col gap-2">
            {[{ href: "/", label: "Home" }, ...leftItems, ...rightItems].map(i => (
              <Link key={i.href} href={i.href} onClick={() => setOpen(false)} className={`${linkBase} ${isActive(i.href)}`}>
                {i.label}
              </Link>
            ))}
            <form action="/api/auth/logout" method="post">
              <button type="submit" className={`${linkBase} bg-red-600`}>
                Logout
              </button>
            </form>
          </div>
        )}
      </div>
    </nav>
  );
}