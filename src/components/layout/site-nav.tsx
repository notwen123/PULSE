"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV, isActive } from "./nav-links";

/** Quiet header chrome: transparent at the top, a paper backdrop once you scroll. */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled ? "border-b bg-background/85 backdrop-blur-md" : "border-b border-transparent"
      )}
    >
      {children}
    </header>
  );
}

/** App tabs: one row, horizontally scrollable on small screens. */
export function AppTabs() {
  const path = usePathname();
  return (
    <nav aria-label="App" className="-mb-px flex gap-7 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {NAV.map((n, i) => {
        const on = isActive(path, n.match);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "group flex shrink-0 items-baseline gap-2 border-b-2 py-3 text-sm transition-colors",
              on ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <span className={cn("font-mono text-[9.5px]", on ? "text-pulse" : "text-muted-foreground/70")}>0{i + 1}</span>
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
