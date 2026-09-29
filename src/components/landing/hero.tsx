"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, Check, Loader2, Search } from "lucide-react";
import { Verified } from "@/components/verified";
import { useReducedMotion } from "@/hooks/use-media";
import { ASSET_TYPE_LABEL, formatMoney } from "@/lib/format";
import type { DataMode, Passport } from "@/lib/types";
import { cn } from "@/lib/utils";

const EXAMPLES = ["TSLA", "NVDA", "GOLD", "SPCX", "Apple"];

type Stage =
  | { s: "idle" }
  | { s: "resolving"; q: string }
  | { s: "loading"; q: string; rwaId: number; symbol: string; name: string }
  | { s: "done"; q: string; passport: Passport }
  | { s: "error"; q: string; message: string };

function Step({ n, label, children, done, active }: { n: string; label: string; children?: React.ReactNode; done: boolean; active: boolean }) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
      className="grid grid-cols-[1.75rem_6.5rem_1fr] items-baseline gap-2 border-b border-dotted py-2 text-sm last:border-b-0"
    >
      <span className="font-mono text-[10px] text-muted-foreground">{n}</span>
      <span className="eyebrow flex items-center gap-1.5">
        {done ? <Check className="size-3 text-pulse" strokeWidth={3} /> : active ? <Loader2 className="size-3 animate-spin" /> : null}
        {label}
      </span>
      <span className="min-w-0 truncate">{children}</span>
    </motion.li>
  );
}

export function Hero({ mode }: { mode: DataMode }) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<Stage>({ s: "idle" });

  // Scroll-driven depth: the landscape sinks and scales slightly slower than the copy rises.
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end start"] });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -80]);
  const imgY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 140]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.04, reduced ? 1.04 : 1.12]);

  const decode = async (term: string) => {
    const query = term.trim();
    if (!query) return;
    setQ(query);
    setStage({ s: "resolving", q: query });
    try {
      const m = await fetch(`/api/rwa/map?q=${encodeURIComponent(query)}`).then((r) => r.json());
      const hit = m.results?.[0];
      if (!hit) return setStage({ s: "error", q: query, message: `No RWA matches “${query}” in CMC's RWA ID Map.` });
      setStage({ s: "loading", q: query, rwaId: hit.rwaId, symbol: hit.symbol, name: hit.name });
      const res = await fetch(`/api/rwa/passport?rwa_id=${hit.rwaId}`);
      const body = await res.json();
      if (!res.ok) return setStage({ s: "error", q: query, message: body?.error?.title ?? "CMC couldn't return this asset right now." });
      setStage({ s: "done", q: query, passport: body });
    } catch {
      setStage({ s: "error", q: query, message: "Couldn't reach PULSE." });
    }
  };

  // Enter on a decoded asset opens its Passport: the landing → app hand-off.
  const open = () => stage.s === "done" && router.push(`/passport/${stage.passport.profile.rwaId}`);

  useEffect(() => {
    if (stage.s === "done") router.prefetch(`/passport/${stage.passport.profile.rwaId}`);
  }, [stage, router]);

  const p = stage.s === "done" ? stage.passport : null;
  const ready = stage.s === "done" && q.trim() === stage.q;
  const busy = stage.s === "resolving" || stage.s === "loading";

  return (
    <section ref={section} className="relative isolate -mt-16 flex min-h-[100svh] flex-col overflow-hidden">
      {/* Full-bleed landscape: the asset world behind the question */}
      <motion.div style={{ y: imgY, scale: imgScale }} className="absolute inset-0 -z-10 origin-top">
        <Image
          src="/pulse/hero/identity-landscape.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[70%_center] dark:brightness-[0.45] dark:saturate-75"
        />
      </motion.div>
      {/* Legibility washes: cream from the left, fade into the page at the bottom */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background/85 via-background/45 to-transparent sm:via-background/25" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-background to-transparent" aria-hidden />

      <motion.div style={{ y: copyY }} className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 pt-28 pb-24 sm:px-6 lg:px-10">
        <div className="flex max-w-xl min-w-0 flex-col">
          <p className="eyebrow flex items-center gap-2 text-foreground/70">
            <span className="relative grid size-2 place-items-center">
              <span className={cn("absolute size-2 rounded-full", mode === "live" ? "ring-out bg-pulse/40" : "")} />
              <span className={cn("size-1.5 rounded-full", mode === "live" ? "bg-pulse" : "bg-warn")} />
            </span>
            The verification layer for tokenized markets
          </p>
          <h1 className="display mt-5 text-[3.4rem] leading-[0.9] sm:text-[5.2rem] lg:text-[6.6rem]">
            What exactly
            <br />
            are you <em className="text-pulse">buying?</em>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-foreground/75">
            Find the asset behind the token. See who issued it, follow each representation across chains, and verify every number
            against the CoinMarketCap response it came from.
          </p>

          {/* Decoder */}
          <div className="mt-8 max-w-xl">
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                if (ready) open();
                else void decode(q);
              }}
              className="group relative flex h-14 items-center gap-3 rounded-2xl border bg-paper/85 pr-2 pl-4 backdrop-blur-md transition-[border-color,box-shadow] duration-300 focus-within:border-foreground/40 focus-within:shadow-[0_0_0_5px_color-mix(in_oklch,var(--pulse)_12%,transparent)]"
            >
              <Search className="size-4 text-muted-foreground transition-colors group-focus-within:text-pulse" aria-hidden />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search a tokenized asset…"
                aria-label="Search a tokenized real-world asset"
                className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-transform duration-150 hover:-translate-y-px active:translate-y-0 disabled:opacity-60"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : ready ? "Open passport" : "Identify"}
                <ArrowRight className="size-4" />
              </button>
            </form>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => void decode(ex)}
                  className="rounded-full border border-foreground/15 bg-background/60 px-2.5 py-0.5 font-mono text-[11px] text-foreground/75 backdrop-blur-sm transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  {ex}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {stage.s !== "idle" && (
                <motion.div
                  key={stage.s === "error" ? "err" : "run"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-5 rounded-2xl border bg-paper/92 p-4 backdrop-blur-md"
                  style={{ boxShadow: "var(--shadow-paper)" }}
                  aria-live="polite"
                >
                  {stage.s === "error" ? (
                    <p className="text-sm">{stage.message}</p>
                  ) : (
                    <>
                      <ol>
                        <Step n="01" label="Resolve" done={stage.s !== "resolving"} active={stage.s === "resolving"}>
                          {stage.s === "resolving" ? (
                            <span className="text-muted-foreground">RWA ID Map…</span>
                          ) : (
                            <span className="font-mono text-[12.5px]">
                              {stage.s === "loading" ? stage.symbol : p!.profile.symbol} → <span className="text-pulse">rwa_id {stage.s === "loading" ? stage.rwaId : p!.profile.rwaId}</span>
                            </span>
                          )}
                        </Step>
                        {stage.s !== "resolving" && (
                          <Step n="02" label="Identify" done={!!p} active={stage.s === "loading"}>
                            {p ? `${p.profile.name} · ${ASSET_TYPE_LABEL[p.profile.assetType]}` : <span className="text-muted-foreground">Metadata + quotes…</span>}
                          </Step>
                        )}
                        {p && (
                          <>
                            <Step n="03" label="Issuers" done active={false}>
                              {p.issuers.length ? p.issuers.map((i) => i.name).join(", ") : <span className="text-muted-foreground">Not in CMC data</span>}
                            </Step>
                            <Step n="04" label="Tokens" done active={false}>
                              {p.tokens.length} tracked representation{p.tokens.length === 1 ? "" : "s"}
                            </Step>
                            <Step n="05" label="Chains" done active={false}>
                              {p.chains.length ? p.chains.slice(0, 4).join(", ") + (p.chains.length > 4 ? ` +${p.chains.length - 4}` : "") : <span className="text-muted-foreground">Not in CMC data</span>}
                            </Step>
                            <Step n="06" label="Quote" done active={false}>
                              <span className="flex items-center gap-3">
                                <span className="font-semibold tabular">{formatMoney(p.aggregate?.averageTokenizedPrice, p.currency)}</span>
                                {p.aggregate && <Verified status={p.aggregate.receipts.averageTokenizedPrice.verificationStatus} />}
                              </span>
                            </Step>
                          </>
                        )}
                      </ol>
                      {p && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                          <Link
                            href={`/passport/${p.profile.rwaId}`}
                            className="mt-4 flex items-center justify-between rounded-xl bg-foreground px-4 py-3 text-sm text-background transition-transform duration-150 hover:-translate-y-px"
                          >
                            <span>
                              Open the <span className="display text-lg">{p.profile.name}</span> passport
                            </span>
                            <ArrowRight className="size-4" />
                          </Link>
                        </motion.div>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Editorial caption + scroll cue */}
      <div className="relative mx-auto flex w-full max-w-7xl items-end justify-between px-4 pb-8 font-mono text-[10px] tracking-[0.16em] text-foreground/60 uppercase sm:px-6 lg:px-10">
        <span className="hidden sm:inline">Fig. 01 — One underlying asset. Many representations.</span>
        <span className="flex items-center gap-2">
          Scroll <span className="h-px w-8 bg-foreground/40" /> 01 / Representations
        </span>
      </div>
    </section>
  );
}
