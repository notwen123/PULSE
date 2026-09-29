"use client";

import { levelFor, useProgress } from "@/lib/local";

/** Subtle retention layer: streak, XP, level. Local only. */
export function ExplorerProgress() {
  const p = useProgress();
  const level = levelFor(p.xp);
  const pct = p.xp % 100;
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
      <span><span className="font-mono font-medium">{p.streak}</span> <span className="text-muted-foreground">day streak</span></span>
      <span><span className="font-mono font-medium">{p.xp}</span> <span className="text-muted-foreground">XP</span></span>
      <span><span className="font-mono font-medium">{p.verified}</span> <span className="text-muted-foreground">receipts opened</span></span>
      <span className="flex items-center gap-2">
        <span className="text-muted-foreground">RWA Explorer · Level {level}</span>
        <span className="h-1 w-20 overflow-hidden rounded-full bg-muted">
          <span className="block h-full bg-pulse transition-all" style={{ width: `${pct}%` }} />
        </span>
      </span>
    </div>
  );
}
