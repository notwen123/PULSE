"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { ArrowRight, CornerDownLeft, History, Loader2, Search } from "lucide-react";
import { ASSET_TYPE_LABEL } from "@/lib/format";
import { useRecent } from "@/lib/local";
import type { RwaIdentity } from "@/lib/types";
import { cn } from "@/lib/utils";

type Row = { rwaId: number; symbol: string; name: string; meta: string; recent?: boolean };

/**
 * ⌘K / "/" command palette: the front door. Resolves through the RWA ID Map,
 * shows asset type and rwa_id, remembers recent Passports, full keyboard control.
 */
export function CommandPalette() {
  const router = useRouter();
  const recent = useRecent();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<RwaIdentity[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && /input|textarea|select/i.test(e.target.tagName);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (!term) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      fetch(`/api/rwa/map?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then(async (r) => {
          const b = await r.json();
          if (!r.ok) throw new Error(b?.error?.title ?? "Search failed");
          setRows(b.results ?? []);
          setError(null);
          setActive(0);
        })
        .catch((e: Error) => e.name !== "AbortError" && setError(e.message))
        .finally(() => setLoading(false));
    }, 140);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const items: Row[] = q.trim()
    ? (rows ?? []).map((r) => ({ rwaId: r.rwaId, symbol: r.symbol, name: r.name, meta: ASSET_TYPE_LABEL[r.assetType] }))
    : recent.map((r) => ({ rwaId: r.rwaId, symbol: r.symbol, name: r.name, meta: "Recent", recent: true }));

  const go = (r: Row) => {
    setOpen(false);
    setQ("");
    setRows(null);
    router.push(`/passport/${r.rwaId}`);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          aria-label="Find an asset (⌘K)"
          className="group flex h-9 w-full items-center justify-center gap-2.5 rounded-full border bg-paper px-3 text-sm text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground sm:justify-start sm:px-3.5"
        >
          <Search className="size-3.5" />
          <span className="hidden flex-1 text-left sm:inline">Find an asset</span>
          <kbd className="hidden rounded border bg-background px-1.5 font-mono text-[10px] sm:inline">⌘K</kbd>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed top-[12vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border bg-popover data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] data-[state=open]:slide-in-from-top-2"
          style={{ boxShadow: "var(--shadow-lift)" }}
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Find a tokenized asset</Dialog.Title>
          <div className="flex items-center gap-3 border-b px-4">
            <Search className="size-4 text-muted-foreground" aria-hidden />
            <input
              autoFocus
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                if (!e.target.value.trim()) setRows(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((a) => Math.min(a + 1, items.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((a) => Math.max(a - 1, 0));
                } else if (e.key === "Enter" && items[active]) {
                  e.preventDefault();
                  go(items[active]);
                }
              }}
              placeholder="Ticker or name — TSLA, Gold, Apple…"
              className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
              role="combobox"
              aria-expanded={items.length > 0}
              aria-controls="palette-list"
              aria-activedescendant={items[active] ? `palette-${items[active].rwaId}` : undefined}
              autoComplete="off"
              spellCheck={false}
            />
            {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Searching" />}
          </div>

          <div ref={listRef} id="palette-list" role="listbox" className="max-h-[50vh] overflow-y-auto p-1.5">
            {!q.trim() && !recent.length && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">Type a ticker or company name.</p>
            )}
            {!q.trim() && recent.length > 0 && <p className="eyebrow px-3 pt-2 pb-1">Recent passports</p>}
            {error && <p className="px-3 py-4 text-sm text-destructive">{error}</p>}
            {q.trim() && rows?.length === 0 && !loading && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">No RWA matches “{q.trim()}”.</p>
            )}
            {items.map((r, i) => (
              <button
                key={`${r.recent ? "r" : "s"}${r.rwaId}`}
                id={`palette-${r.rwaId}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-150",
                  i === active ? "bg-foreground text-background" : "hover:bg-muted"
                )}
              >
                {r.recent ? <History className="size-3.5 opacity-60" /> : <span className="size-1.5 rounded-full bg-pulse" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{r.name}</span>
                  <span className={cn("font-mono text-[11px]", i === active ? "opacity-70" : "text-muted-foreground")}>
                    {r.symbol} · {r.meta}
                  </span>
                </span>
                <span className={cn("font-mono text-[10px] tracking-wider uppercase", i === active ? "opacity-70" : "text-muted-foreground")}>
                  RWA #{r.rwaId}
                </span>
                {i === active && <CornerDownLeft className="size-3.5 opacity-70" />}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between border-t px-4 py-2 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
            <span>Resolved by /v5/real-world-assets/map</span>
            <span className="flex items-center gap-1">
              Open passport <ArrowRight className="size-3" />
            </span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
