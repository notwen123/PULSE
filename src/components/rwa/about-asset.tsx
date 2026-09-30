"use client";

import { useState } from "react";
import type { parseAbout } from "@/lib/format";

/** CMC's description: first section visible, the rest behind a toggle. */
export function AboutAsset({ sections }: { sections: ReturnType<typeof parseAbout> }) {
  const [open, setOpen] = useState(false);
  if (!sections.length) return <p className="text-sm text-muted-foreground">CMC returned no description for this asset.</p>;
  const shown = open ? sections : sections.slice(0, 1);
  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <p className="text-sm text-muted-foreground">From CMC’s asset description</p>
      {shown.map((s, i) => (
        <div key={i}>
          {s.title && <p className="text-xl font-semibold tracking-tight">{s.title}</p>}
          <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{s.body}</p>
        </div>
      ))}
      {sections.length > 1 && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="self-start text-sm font-medium underline-offset-4 hover:underline"
        >
          {open ? "Show less" : `Read ${sections.length - 1} more section${sections.length > 2 ? "s" : ""}`}
        </button>
      )}
    </div>
  );
}
