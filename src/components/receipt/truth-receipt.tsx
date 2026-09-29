"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Check, Copy } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Verified } from "@/components/verified";
import { useIsMobile, useReducedMotion } from "@/hooks/use-media";
import { formatUtcTime } from "@/lib/format";
import { recordVerification } from "@/lib/local";
import type { EvidenceReceipt } from "@/lib/types";
import { cn } from "@/lib/utils";

const CMC_BASE = "https://pro-api.coinmarketcap.com";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() =>
        navigator.clipboard?.writeText(text).then(
          () => {
            setDone(true);
            setTimeout(() => setDone(false), 1400);
          },
          () => undefined
        )
      }
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-muted-foreground uppercase transition-colors hover:bg-muted hover:text-foreground"
      aria-label={label}
    >
      {done ? <Check className="size-3" /> : <Copy className="size-3" />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}

/**
 * The receipt as a provenance document. Fields reveal in order —
 * value, source, where, when, cost, fingerprint, verdict — so the eye
 * follows the chain of custody.
 */
export function ReceiptDocument({ receipt, display, animate = true }: { receipt: EvidenceReceipt; display: string; animate?: boolean }) {
  const reduced = useReducedMotion();
  const query = new URLSearchParams(receipt.params).toString();
  const curl = `curl -G '${CMC_BASE}${receipt.endpoint}${query ? `?${query}` : ""}' \\\n  -H "X-CMC_PRO_API_KEY: $CMC_API_KEY"`;
  const serial = receipt.responseHash.slice(0, 6).toUpperCase();
  const play = animate && !reduced;

  const rows: [string, React.ReactNode, boolean?][] = [
    [
      "Source",
      <span key="s" className="flex items-center gap-2">
        <Image src="/pulse/logos/coinmarketcap-mark.png" alt="" width={16} height={16} className="size-4 dark:invert" />
        CoinMarketCap Pro API
      </span>,
    ],
    ["Endpoint", `GET ${receipt.endpoint}`, true],
    ...(query ? ([["Query", query, true]] as [string, string, boolean][]) : []),
    ...(receipt.field ? ([["Field", receipt.field, true]] as [string, string, boolean][]) : []),
    ...(receipt.rwaId != null ? ([["RWA ID", String(receipt.rwaId), true]] as [string, string, boolean][]) : []),
    ...(receipt.identifier && receipt.identifier.type !== "rwa_id"
      ? ([["Identifier", `${receipt.identifier.type} = ${receipt.identifier.value}`, true]] as [string, string, boolean][])
      : []),
    ["CMC data timestamp", receipt.sourceTimestamp ? formatUtcTime(receipt.sourceTimestamp) : "Not returned", true],
    ["Retrieved by PULSE", formatUtcTime(receipt.retrievedAt), true],
    ["Credit count", receipt.creditCount != null ? String(receipt.creditCount) : "Not returned", true],
  ];

  const item = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.2, 0.7, 0.2, 1] as const } },
  };

  return (
    <motion.article
      initial={play ? "hidden" : false}
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.045, delayChildren: 0.08 } } }}
      className="registered relative flex flex-col bg-paper px-6 pt-8 pb-0 sm:px-8"
      aria-label={`Data receipt for ${receipt.label}`}
    >
      <motion.header variants={item} className="flex items-baseline justify-between gap-4 border-b border-dashed pb-4">
        <div>
          <p className="display text-3xl leading-none">Data receipt</p>
          <p className="eyebrow mt-2">{receipt.label}</p>
        </div>
        <p className="text-right font-mono text-[10px] leading-relaxed tracking-wider text-muted-foreground uppercase">
          № {serial}
          <br />
          {receipt.mode === "live" ? "Live response" : "Demo fixture"}
        </p>
      </motion.header>

      <motion.div variants={item} className="py-6">
        <p className="eyebrow">Value</p>
        <p className="mt-1 font-sans text-4xl font-semibold tracking-tight tabular sm:text-5xl">{display}</p>
      </motion.div>

      <dl className="border-t">
        {rows.map(([label, value, mono]) => (
          <motion.div variants={item} key={label} className="grid grid-cols-[8.5rem_1fr] gap-3 border-b border-dotted py-2.5 text-sm sm:grid-cols-[10rem_1fr]">
            <dt className="eyebrow pt-0.5">{label}</dt>
            <dd className={cn("min-w-0 break-words", mono && "font-mono text-[12px]")}>{value}</dd>
          </motion.div>
        ))}
        <motion.div variants={item} className="grid grid-cols-[8.5rem_1fr] gap-3 py-2.5 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="eyebrow pt-0.5">Response integrity</dt>
          <dd className="min-w-0">
            <span className="font-mono text-[11.5px] break-all">sha256:{receipt.responseHash}</span>
            <span className="mt-1 flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Fingerprint of the exact response PULSE received</span>
              <CopyButton text={receipt.responseHash} label="Copy response hash" />
            </span>
          </dd>
        </motion.div>
      </dl>

      <motion.div
        variants={{
          hidden: { opacity: 0, scale: 1.08, rotate: -3 },
          show: { opacity: 1, scale: 1, rotate: 0, transition: { type: "spring", stiffness: 380, damping: 22, delay: 0.1 } },
        }}
        className="my-6"
      >
        <Verified status={receipt.verificationStatus} size="lg" />
      </motion.div>

      <motion.div variants={item} className="pb-6">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Reproduce this call</p>
          <CopyButton text={curl} label="Copy curl command" />
        </div>
        <pre className="mt-2 overflow-x-auto rounded-lg border bg-background p-3 font-mono text-[11px] leading-relaxed">{curl}</pre>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Same hash, same response. The fingerprint proves which payload a number came from — not that the market value itself is correct.
        </p>
      </motion.div>

      {/* Tear-off edge */}
      <div className="perforated -mx-6 h-1.5 rotate-180 bg-transparent sm:-mx-8" aria-hidden />
    </motion.article>
  );
}

/**
 * Compact provenance affordance around a value. Opens the receipt as a side
 * sheet on desktop and a bottom sheet on mobile.
 */
export function TruthReceipt({
  receipt,
  display,
  children,
  className,
  hideCue = false,
}: {
  receipt: EvidenceReceipt;
  display: string;
  children?: React.ReactNode;
  className?: string;
  hideCue?: boolean;
}) {
  const mobile = useIsMobile();
  return (
    <Sheet onOpenChange={(open) => open && recordVerification()}>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn("group/receipt inline-flex flex-col items-start gap-1.5 rounded-md text-left", className)}
          aria-label={`Open data receipt for ${receipt.label}`}
        >
          {children}
          {!hideCue && (
            <span className="inline-flex items-center gap-2">
              <Verified status={receipt.verificationStatus} />
              <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase opacity-0 transition-opacity duration-200 group-hover/receipt:opacity-100 group-focus-visible/receipt:opacity-100">
                View receipt →
              </span>
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent
        side={mobile ? "bottom" : "right"}
        className={cn("gap-0 overflow-y-auto border-0 bg-background p-3 sm:p-5", mobile ? "max-h-[92vh] rounded-t-2xl" : "w-full sm:max-w-lg")}
      >
        <SheetTitle className="sr-only">Data receipt: {receipt.label}</SheetTitle>
        <SheetDescription className="sr-only">Where this number came from and when it was retrieved.</SheetDescription>
        <div className="overflow-hidden rounded-xl border" style={{ boxShadow: "var(--shadow-lift)" }}>
          <ReceiptDocument receipt={receipt} display={display} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
