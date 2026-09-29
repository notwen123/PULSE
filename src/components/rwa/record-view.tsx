"use client";

import { useEffect } from "react";
import { recordView, type SavedAsset } from "@/lib/local";

/** Adds the asset to Recent and awards explorer XP once per mount. */
export function RecordView({ asset }: { asset: SavedAsset }) {
  const { rwaId, symbol, name } = asset;
  useEffect(() => {
    recordView({ rwaId, symbol, name });
  }, [rwaId, symbol, name]);
  return null;
}
