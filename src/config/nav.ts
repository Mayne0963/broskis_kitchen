import React from 'react';

export type NavItem = {
  label: string;
  href: string;
  icon?: React.ComponentType<any>;
  external?: boolean;
  mobileOnly?: boolean; // render only on mobile
  desktopOnly?: boolean; // render only on desktop
  requiresAuth?: boolean; // show when logged in
  requiresAdmin?: boolean; // show when user has admin claim
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Menu", href: "/menu" },
  { label: "Infused Menu - Coming Soon", href: "/infused-menu" },
  { label: "Locations", href: "/locations" },
  { label: "Events", href: "/events" },
  { label: "Music", href: "/music" },
  { label: "Rewards", href: "/coming-soon" },
  { label: "Shop", href: "/shop" },
  { label: "Catering", href: "/catering" },
  { label: "Contact", href: "/contact" },
  // add any other links we support on desktop here so parity is guaranteed
];

export function visibleNav(
  items: NavItem[],
  opts: { isMobile: boolean; isAuthed: boolean; isAdmin: boolean }
) {
  return items.filter((i) => {
    if (i.desktopOnly && opts.isMobile) return false;
    if (i.mobileOnly && !opts.isMobile) return false;
    if (i.requiresAuth && !opts.isAuthed) return false;
    if (i.requiresAdmin && !opts.isAdmin) return false;
    return true;
  });
}