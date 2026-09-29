"use client";

import Link from "next/link";
import { useRecent } from "@/lib/local";

export function RecentAssets() {
  const recent = useRecent();
  if (!recent.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="eyebrow mr-1">Recent</span>
      {recent.map((r) => (
        <Link key={r.rwaId} href={`/passport/${r.rwaId}`} className="rounded-full border bg-paper px-3 py-1 text-xs transition-colors hover:bg-muted">
          <span className="font-mono font-medium">{r.symbol}</span> <span className="text-muted-foreground">{r.name}</span>
        </Link>
      ))}
    </div>
  );
}
