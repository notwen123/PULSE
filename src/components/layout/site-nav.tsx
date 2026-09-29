"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
        scrolled ? "border-b bg-background/80 backdrop-blur-md" : "border-b border-transparent"
      )}
    >
      {children}
    </header>
  );
}

export function DesktopNav() {
  const path = usePathname();
  return (
    <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
      {NAV.map((n) => {
        const on = isActive(path, n.match);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "relative py-1 text-sm transition-colors",
              on ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {n.label}
            <span
              className={cn(
                "absolute -bottom-0.5 left-0 h-px bg-foreground transition-all duration-300 ease-[var(--ease-editorial)]",
                on ? "w-full" : "w-0"
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav({ children }: { children?: React.ReactNode }) {
  const path = usePathname();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="inline-flex size-9 items-center justify-center rounded-full border bg-paper lg:hidden" aria-label="Open menu">
          <Menu className="size-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[85vw] max-w-sm bg-background">
        <SheetHeader className="border-b">
          <SheetTitle className="display text-2xl">Pulse</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col px-4" aria-label="Mobile">
          {NAV.map((n, i) => (
            <SheetClose asChild key={n.href}>
              <Link
                href={n.href}
                className={cn("flex items-baseline gap-4 border-b py-4", isActive(path, n.match) ? "text-foreground" : "text-muted-foreground")}
              >
                <span className="font-mono text-[10px]">0{i + 1}</span>
                <span className="display text-3xl">{n.label}</span>
              </Link>
            </SheetClose>
          ))}
          {children && <div className="pt-6">{children}</div>}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
