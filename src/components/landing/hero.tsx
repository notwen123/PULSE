"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowRight } from "lucide-react";
import { TruthReceipt } from "@/components/receipt/truth-receipt";
import { Verified } from "@/components/verified";
import { useReducedMotion } from "@/hooks/use-media";
import { assetLogo } from "@/lib/asset-logos";
import { ASSET_TYPE_LABEL, formatMoney, shortHash } from "@/lib/format";
import type { DataMode, Passport } from "@/lib/types";
import { cn } from "@/lib/utils";

const TRY = ["TSLA", "GOLD", "NVDA", "SPCX"];

/** One annotation in the right-hand column: dot and leader line pointing back at the object. */
function Note({ label, children, className, delay = 0 }: { label: string; children?: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.2, 0.7, 0.2, 1] }}
      className={cn("absolute left-0 flex flex-col gap-1.5", className)}
    >
      <span className="flex items-center gap-2 whitespace-nowrap">
        <span className="size-1.5 shrink-0 rounded-full bg-foreground" />
        <span className="h-px w-8 bg-foreground/50" />
        <span className="font-mono text-[10px] font-medium tracking-[0.18em] text-foreground/80 uppercase">{label}</span>
      </span>
      <div className="flex flex-col gap-1.5 pl-[3.25rem]">{children}</div>
    </motion.div>
  );
}

/** Real data, drawn quietly: each tracked token's price as a dot, the aggregate as a tick. */
function PriceStrip({ prices, aggregate }: { prices: number[]; aggregate: number | null }) {
  if (prices.length < 2 || aggregate == null) return null;
  const lo = Math.min(...prices, aggregate);
  const hi = Math.max(...prices, aggregate);
  const x = (v: number) => (hi === lo ? 60 : 4 + ((v - lo) / (hi - lo)) * 112);
  return (
    <svg viewBox="0 0 120 22" className="h-5 w-28" aria-label={`${prices.length} token prices around the aggregate`}>
      <line x1="4" x2="116" y1="11" y2="11" className="stroke-foreground/25" strokeWidth="1" />
      {prices.map((p, i) => (
        <circle key={i} cx={x(p)} cy={11} r="2.2" className="fill-foreground/70" />
      ))}
      <line x1={x(aggregate)} x2={x(aggregate)} y1="3" y2="19" className="stroke-pulse" strokeWidth="1.5" />
    </svg>
  );
}

/** The identity artifact: a glass asset card on a stone pedestal. Tilts with the pointer. */
function Artifact({ p }: { p: Passport }) {
  const reduced = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 120, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), { stiffness: 120, damping: 18 });
  const px = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 80, damping: 20 });

  const { profile, aggregate, tokens, issuers, chains } = p;
  const logo = assetLogo(profile.symbol, profile.logo);
  const price = aggregate ? formatMoney(aggregate.averageTokenizedPrice, p.currency) : null;
  const prices = tokens.map((t) => t.price).filter((v): v is number => v != null);

  const stone = "bg-gradient-to-r from-[#121512] via-[#353c36] to-[#101310]";
  return (
    <div className="flex flex-col gap-6">
      <div
        className="relative mx-auto aspect-[10/9] w-full max-w-[40rem] [perspective:1200px]"
        onPointerMove={(e) => {
          if (reduced) return;
          const r = e.currentTarget.getBoundingClientRect();
          mx.set((e.clientX - r.left) / r.width - 0.5);
          my.set((e.clientY - r.top) / r.height - 0.5);
        }}
        onPointerLeave={() => {
          mx.set(0);
          my.set(0);
        }}
      >
        {/* Object area: left 64% on sm+, full width on mobile */}
        <div className="absolute inset-y-0 left-0 w-full sm:w-[64%]">
          {/* Underlying asset label, above the card */}
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="absolute top-[4%] left-[4%] flex items-center gap-2 font-mono text-[10px] font-medium tracking-[0.18em] text-foreground/80 uppercase"
          >
            Underlying asset <span className="h-px w-10 bg-foreground/50" />
            <span className="size-1.5 rounded-full bg-foreground" />
          </motion.p>

          {/* Pedestal: glass ring + stone cylinder with the RWA ID engraved */}
          <motion.div style={{ x: px }} className="absolute inset-x-[14%] bottom-[5%] h-[36%]">
            <div className="absolute -inset-x-[16%] top-[-2%] h-[30%] rounded-[50%] border border-foreground/20 bg-gradient-to-b from-white/40 to-transparent dark:from-white/5" />
            <div className={cn("absolute inset-x-0 top-[13%] bottom-[13%]", stone)}>
              <div className="absolute inset-0 opacity-50 mix-blend-overlay [background:repeating-linear-gradient(90deg,transparent_0_9px,rgba(255,255,255,0.07)_9px_10px)]" />
              <p className="absolute inset-x-0 top-[40%] text-center font-mono text-[10px] tracking-[0.5em] text-white/60 sm:text-xs">RWA #{profile.rwaId}</p>
            </div>
            <div className={cn("absolute inset-x-0 bottom-0 h-[26%] rounded-[50%]", stone)} />
            <div className="absolute inset-x-0 top-0 h-[26%] rounded-[50%] bg-[radial-gradient(ellipse_at_50%_45%,#6b736c,#1c211d_72%)] shadow-[inset_0_2px_8px_rgba(255,255,255,0.25)]" />
            {/* stem */}
            <div className="absolute top-[-44%] left-1/2 h-[58%] w-1.5 -translate-x-1/2 rounded-full bg-gradient-to-r from-zinc-400 via-zinc-100 to-zinc-500" />
          </motion.div>

          {/* Glass asset card */}
          <motion.div
            style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
            className="absolute inset-x-0 top-[13%] h-[33%]"
          >
            <div className="relative flex size-full items-center gap-4 overflow-hidden rounded-3xl border border-white/80 bg-white/45 px-6 shadow-[0_30px_60px_-30px_rgba(20,30,22,0.45),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl sm:gap-5 dark:border-white/15 dark:bg-white/10">
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/70 via-transparent to-white/10 dark:from-white/10" />
              <span className="pointer-events-none absolute -top-1/2 left-1/3 h-[200%] w-16 rotate-12 bg-white/30 blur-md" />
              {logo ? (
                <Image src={logo} alt="" width={72} height={72} className="relative size-12 shrink-0 rounded-2xl object-cover shadow-md sm:size-16" unoptimized={logo.startsWith("http")} />
              ) : (
                <span className="relative grid size-12 place-items-center rounded-2xl bg-foreground font-mono text-background sm:size-16">{profile.symbol.slice(0, 2)}</span>
              )}
              <div className="relative min-w-0">
                <p className="display truncate text-[1.7rem] leading-none uppercase sm:text-[2.2rem]">{profile.name}</p>
                <p className="mt-1.5 font-mono text-sm tracking-[0.2em] text-foreground/70">{profile.symbol}</p>
                <p className="mt-1.5 font-mono text-[9px] tracking-[0.18em] text-foreground/50 uppercase">{ASSET_TYPE_LABEL[profile.assetType]} · real-world asset</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Annotation column — every value is real CMC data */}
        <div className="absolute inset-y-0 left-[67%] hidden w-[33%] sm:block">
          {aggregate && price && (
            <Note label="Tokenized market" className="top-[14%]" delay={0.45}>
              <TruthReceipt receipt={aggregate.receipts.averageTokenizedPrice} display={price} hideCue>
                <span className="font-sans text-xl font-semibold tabular">{price}</span>
              </TruthReceipt>
              <PriceStrip prices={prices} aggregate={aggregate.averageTokenizedPrice} />
              <Verified status={aggregate.receipts.averageTokenizedPrice.verificationStatus} />
            </Note>
          )}
          <Note label="RWA identity" className="top-[54%]" delay={0.6}>
            <span className="font-mono text-xs text-foreground/70">
              rwa_id {profile.rwaId}
              {profile.rank != null && ` · rank ${profile.rank}`}
            </span>
          </Note>
          <Note label="Representations" className="top-[70%]" delay={0.75}>
            <span className="font-mono text-xs leading-relaxed whitespace-nowrap text-foreground/70">
              {tokens.length} tokens
              <br />
              {issuers.length} issuers · {chains.length} chains
            </span>
          </Note>
          {aggregate && (
            <Note label="Evidence" className="top-[88%]" delay={0.9}>
              <span className="font-mono text-[11px] text-foreground/70">{shortHash(aggregate.receipts.averageTokenizedPrice.responseHash)}</span>
            </Note>
          )}
        </div>
      </div>

      {/* Mobile: the same facts as a compact row */}
      {aggregate && price && (
        <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border bg-border text-center sm:hidden">
          <div className="bg-paper p-3">
            <dt className="eyebrow">Tokenized</dt>
            <dd className="mt-1 text-sm font-semibold tabular">{price}</dd>
          </div>
          <div className="bg-paper p-3">
            <dt className="eyebrow">Identity</dt>
            <dd className="mt-1 font-mono text-sm">#{profile.rwaId}</dd>
          </div>
          <div className="bg-paper p-3">
            <dt className="eyebrow">Tokens</dt>
            <dd className="mt-1 font-mono text-sm">{tokens.length}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}

export function Hero({ featured, mode }: { featured: Passport | null; mode: DataMode }) {
  const section = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end start"] });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -70]);
  const artY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 60]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 120]);

  return (
    <section ref={section} className="relative isolate -mt-20 overflow-hidden pt-20">
      {/* Landscape, faded in on the right like a plate in a printed report */}
      <motion.div style={{ y: bgY }} className="absolute inset-y-0 right-0 -z-10 w-full lg:w-[62%]" aria-hidden>
        <Image
          src="/pulse/hero/identity-landscape.webp"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 62vw, 100vw"
          className="object-cover object-[80%_center] opacity-35 [mask-image:linear-gradient(to_left,black_35%,transparent)] dark:opacity-20"
        />
      </motion.div>

      <div className="mx-auto grid min-h-[calc(100svh-5rem)] max-w-7xl grid-cols-1 items-center gap-10 px-4 pt-6 pb-16 sm:px-6 lg:grid-cols-[2.5rem_1fr_1.1fr] lg:gap-8 lg:px-10">
        {/* Left rail */}
        <div className="hidden h-full flex-col items-center justify-center gap-3 lg:flex" aria-hidden>
          <span className="font-mono text-xs">01</span>
          <span className="h-24 w-px bg-foreground/40" />
          <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase [writing-mode:vertical-rl]">Real assets</span>
        </div>

        <motion.div style={{ y: copyY }} className="flex min-w-0 flex-col">
          <h1 className="display text-[3.6rem] leading-[0.88] sm:text-[5.6rem] lg:text-[6.3rem] xl:text-[7rem]">
            What exactly
            <br />
            are you <em className="text-pulse">buying?</em>
          </h1>
          <p className="mt-7 max-w-md text-[15.5px] leading-relaxed text-foreground/75">
            One company can hide behind a dozen tokens, issuers and chains. PULSE resolves each one to its real-world asset — and
            gives every number a receipt from CoinMarketCap.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/passport"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background transition-transform duration-150 hover:-translate-y-px"
            >
              Explore assets <ArrowRight className="size-4" />
            </Link>
            <a href="#provenance" className="inline-flex h-12 items-center gap-2 rounded-full border border-foreground/20 bg-background/60 px-6 text-sm backdrop-blur-sm transition-colors hover:border-foreground/40">
              See a receipt
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">Try</span>
            {TRY.map((t) => (
              <Link
                key={t}
                href={`/passport?q=${t}`}
                className="rounded-full border border-foreground/15 bg-background/60 px-3 py-1 font-mono text-[11px] backdrop-blur-sm transition-colors hover:border-foreground/40"
              >
                {t}
              </Link>
            ))}
          </div>
          <p className="mt-10 flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
            <span className={cn("size-1.5 rounded-full", mode === "live" ? "bg-pulse beat" : "bg-warn")} />
            {mode === "live" ? "Live CoinMarketCap data" : "Demo data · set CMC_API_KEY for live"}
          </p>
        </motion.div>

        <motion.div style={{ y: artY }} className="min-w-0">
          {featured ? (
            <Artifact p={featured} />
          ) : (
            <p className="text-sm text-muted-foreground">The live asset preview couldn’t load from CMC right now.</p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
