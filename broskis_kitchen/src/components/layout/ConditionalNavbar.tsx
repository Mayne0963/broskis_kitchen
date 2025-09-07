"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();
  const isHomepage = pathname === '/';

  if (isHomepage) {
    return null;
  }

  return (
    <>
      <Navbar />
      <div className="pt-20" />
    </>
  );
}