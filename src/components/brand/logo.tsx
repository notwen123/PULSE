import Link from "next/link";
import { cn } from "@/lib/utils";

/** The pulse glyph: one heartbeat stroke ending in the verification dot. */
export function PulseGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 16" aria-hidden className={cn("h-3.5 w-6", className)} fill="none">
      <path d="M1 8.5h6l2-5.5 3 11 2.5-8 1.5 2.5H24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="25.5" cy="8.5" r="2" className="fill-pulse" />
    </svg>
  );
}

/** Square mark for small contexts (footer, favicon). */
export function PulseMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-7 place-items-center rounded-lg bg-foreground text-background", className)} aria-hidden>
      <PulseGlyph className="h-3 w-5" />
    </span>
  );
}

/** Wordmark: mark + PULSE. */
export function Logo({ className, descriptor = false }: { className?: string; descriptor?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-3", className)} aria-label="PULSE home">
      <PulseMark />
      <span className="text-[17px] font-semibold tracking-tight">PULSE</span>
      {descriptor && (
        <span className="hidden border-l pl-3 text-xs leading-tight text-muted-foreground lg:block">
          The verification layer
          <br />
          for tokenized markets
        </span>
      )}
    </Link>
  );
}
