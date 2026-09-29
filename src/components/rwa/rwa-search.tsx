"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Search } from "lucide-react";
import { ASSET_TYPE_LABEL } from "@/lib/format";
import type { RwaIdentity } from "@/lib/types";
import { cn } from "@/lib/utils";

export const EXAMPLES = ["TSLA", "NVDA", "GOLD", "SPCX", "Apple", "Silver"];

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; results: RwaIdentity[]; mode: "live" | "demo" }
  | { status: "error"; message: string };

async function lookup(q: string, signal?: AbortSignal): Promise<State> {
  const res = await fetch(`/api/rwa/map?q=${encodeURIComponent(q)}`, { signal });
  const body = await res.json();
  if (!res.ok) return { status: "error", message: body?.error?.title ?? "Search failed" };
  return { status: "done", results: body.results ?? [], mode: body.mode };
}

/** Search → RWA ID Map → Passport. Enter opens the best match. */
export function RwaSearch({ variant = "hero", autoFocus = false }: { variant?: "hero" | "header"; autoFocus?: boolean }) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [navigating, setNavigating] = useState(false);
  const hero = variant === "hero";

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setState({ status: "loading" });
      lookup(q, ctrl.signal)
        .then((s) => {
          setState(s);
          setActive(0);
        })
        .catch((e: unknown) => {
          if ((e as Error).name !== "AbortError") setState({ status: "error", message: "Couldn't reach PULSE search" });
        });
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const go = (r: RwaIdentity) => {
    setNavigating(true);
    setOpen(false);
    router.push(`/passport/${r.rwaId}`);
  };

  const submit = async (q = query) => {
    if (!q.trim()) return;
    if (state.status === "done" && q === query && state.results.length) return go(state.results[active] ?? state.results[0]);
    setState({ status: "loading" });
    const s = await lookup(q.trim()).catch(() => ({ status: "error", message: "Couldn't reach PULSE search" }) as State);
    setState(s);
    setOpen(true);
    if (s.status === "done" && s.results[0]) go(s.results[0]);
  };

  const results = state.status === "done" ? state.results : [];
  const showPanel = open && query.trim() !== "";

  return (
    <div className={cn("w-full", hero ? "max-w-2xl" : "max-w-sm")}>
      <div className="relative">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className={cn(
            "flex items-center gap-3 border bg-paper transition-shadow focus-within:border-foreground/25 focus-within:shadow-[0_0_0_4px_color-mix(in_oklch,var(--pulse)_14%,transparent)]",
            hero ? "h-14 rounded-2xl px-5 shadow-sm sm:h-16" : "h-9 rounded-full px-3.5"
          )}
        >
          <Search className={cn("shrink-0 text-muted-foreground", hero ? "size-5" : "size-4")} aria-hidden />
          <input
            ref={inputRef}
            autoFocus={autoFocus}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              if (!e.target.value.trim()) setState({ status: "idle" });
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, Math.max(results.length - 1, 0)));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Escape") setOpen(false);
            }}
            placeholder={hero ? "Search a tokenized asset — TSLA, GOLD, Apple…" : "Search RWAs"}
            className={cn("min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground/70", hero ? "text-base sm:text-lg" : "text-sm")}
            aria-label="Search tokenized real-world assets"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
          />
          {state.status === "loading" || navigating ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-label="Loading" />
          ) : hero ? (
            <button
              type="submit"
              className="hidden items-center gap-1.5 rounded-xl bg-foreground px-3.5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 sm:inline-flex"
            >
              Identify <ArrowRight className="size-4" />
            </button>
          ) : null}
        </form>

        {showPanel && state.status !== "idle" && (
          <div
            id={listId}
            role="listbox"
            className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border bg-popover shadow-xl shadow-black/5 animate-in fade-in-0 slide-in-from-top-1"
          >
            {state.status === "loading" && <p className="px-4 py-3 text-sm text-muted-foreground">Resolving via RWA ID Map…</p>}
            {state.status === "error" && <p className="px-4 py-3 text-sm text-destructive">{state.message}</p>}
            {state.status === "done" && results.length === 0 && (
              <div className="px-4 py-3 text-sm">
                <p className="font-medium">No RWA matches “{query.trim()}”.</p>
                <p className="mt-0.5 text-muted-foreground">
                  {state.mode === "demo" ? "Demo data covers TSLA, NVDA, GOLD, SPCX and TBILL. Set CMC_API_KEY for all ~7.9K RWAs." : "Try a ticker such as TSLA or GOLD."}
                </p>
              </div>
            )}
            {results.map((r, i) => (
              <button
                key={r.rwaId}
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r)}
                className={cn("flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors", i === active && "bg-muted")}
              >
                <span className="size-1.5 shrink-0 rounded-full bg-pulse" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{r.name}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {r.symbol} · {ASSET_TYPE_LABEL[r.assetType]}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">RWA #{r.rwaId}</span>
              </button>
            ))}
            {state.status === "done" && results.length > 0 && (
              <p className="border-t px-4 py-2 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                Resolved by /v5/real-world-assets/map {state.mode === "demo" && "· demo data"}
              </p>
            )}
          </div>
        )}
      </div>

      {hero && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Try</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setQuery(ex);
                void submit(ex);
              }}
              className="rounded-full border bg-paper px-3 py-1 font-mono text-xs transition-colors hover:border-foreground/30 hover:bg-muted"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
