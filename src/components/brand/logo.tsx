import Link from "next/link";
import { cn } from "@/lib/utils";

/** The pulse glyph: a single heartbeat stroke ending in the verification dot. */
export function PulseGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 16" aria-hidden className={cn("h-3.5 w-6", className)} fill="none">
      <path d="M1 8.5h6l2-5.5 3 11 2.5-8 1.5 2.5H24" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="25.5" cy="8.5" r="1.9" className="fill-pulse" />
    </svg>
  );
}

/** Seal version for favicon-sized contexts. */
export function PulseMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-6", className)} fill="none">
      <circle cx="16" cy="16" r="15" className="fill-foreground" />
      <path d="M6.5 16.5h4l2-4.5 3 9 2.4-5.4 1.6 1.9 5.5-5.5" className="stroke-background" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="25" cy="12" r="2.4" className="fill-pulse" />
    </svg>
  );
}

/** Wordmark: serif caps PULSE + pulse glyph, optionally with the two-line descriptor. */
export function Logo({ className, descriptor = false }: { className?: string; descriptor?: boolean }) {
  return (
    <Link href="/" className={cn("group flex items-center gap-4", className)} aria-label="PULSE home">
      <span className="flex items-center gap-1">
        <span className="display text-[1.9rem] leading-none tracking-[0.02em]">PULSE</span>
        <PulseGlyph className="mt-0.5 text-foreground transition-transform duration-300 group-hover:translate-x-0.5" />
      </span>
      {descriptor && (
        <span className="hidden border-l pl-4 font-mono text-[9.5px] leading-[1.45] tracking-[0.16em] text-muted-foreground uppercase md:block">
          The verification layer
          <br />
          for tokenized markets
        </span>
      )}
    </Link>
  );
}
