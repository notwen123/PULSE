import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { CommandPalette } from "@/components/search/command-palette";
import { HeaderShell } from "@/components/layout/site-nav";

const LINKS = [
  ["/passport", "Explore"],
  ["/pulse", "Daily Pulse"],
  ["/saved", "Saved"],
  ["/developers", "Developer"],
] as const;

/** Landing nav: wordmark + descriptor, four doors into the app, one Launch App. */
export function LandingHeader() {
  return (
    <HeaderShell>
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-10">
        <Logo descriptor />
        <nav className="mx-auto hidden items-center gap-10 lg:flex" aria-label="Main">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className="text-sm text-foreground/80 transition-colors hover:text-foreground">
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-4 lg:ml-0">
          <div className="w-9">
            <CommandPalette compact />
          </div>
          <span className="hidden h-6 w-px bg-border sm:block" />
          <Link
            href="/passport"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-transform duration-150 hover:-translate-y-px"
          >
            Launch App <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </HeaderShell>
  );
}
