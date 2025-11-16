export interface NavLink {
  href: string;
  label: string;
}

export const MAIN_LINKS: NavLink[] = [
  { href: "/menu", label: "Menu" },
  { href: "/infused-menu", label: "Infused Menu - Coming Soon" },
  { href: "/locations", label: "Locations" },
  { href: "/events", label: "Events" },
  { href: "/music", label: "Music" },
  { href: "/rewards", label: "Rewards" },
  { href: "/shop", label: "Shop" },
  { href: "/catering", label: "Catering" },
  { href: "/contact", label: "Contact" }
];