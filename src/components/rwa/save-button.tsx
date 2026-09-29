"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { toggleSaved, useSaved, type SavedAsset } from "@/lib/local";
import { cn } from "@/lib/utils";

export function SaveButton({ asset }: { asset: SavedAsset }) {
  const saved = useSaved().some((s) => s.rwaId === asset.rwaId);
  return (
    <button
      type="button"
      onClick={() => {
        const now = toggleSaved(asset);
        toast(now ? `${asset.symbol} saved to My RWAs` : `${asset.symbol} removed`);
      }}
      aria-pressed={saved}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors",
        saved ? "border-foreground bg-foreground text-background" : "bg-paper hover:bg-muted"
      )}
    >
      {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
      {saved ? "Saved" : "Save"}
    </button>
  );
}
