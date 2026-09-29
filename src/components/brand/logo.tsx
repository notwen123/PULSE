import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The PULSE mark: an ink seal holding a single pulse stroke that resolves into
 * a check — "the signal, verified". Works from 16px (favicon) upward.
 */
export function PulseMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-6", className)} fill="none">
      <circle cx="16" cy="16" r="15" className="fill-foreground" />
      <path
        d="M6.5 16.5h4l2-4.5 3 9 2.4-5.4 1.6 1.9 5.5-5.5"
        className="stroke-background"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="25" cy="12" r="2.4" className="fill-pulse" />
    </svg>
  );
}

/** Editorial wordmark: serif "Pulse" with the mark as its seal. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("group flex items-center gap-2", className)} aria-label="PULSE home">
      <PulseMark className="transition-transform duration-300 ease-[var(--ease-tactile)] group-hover:rotate-[-8deg]" />
      <span className="display text-[1.55rem] leading-none">
        Pulse
        <span className="ml-0.5 align-super font-mono text-[8px] tracking-[0.2em] text-pulse">RWA</span>
      </span>
    </Link>
  );
}
