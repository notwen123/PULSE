"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Deterministic, data-only explanation. Lines are generated server-side from the Passport. */
export function ExplainPanel({ lines }: { lines: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="border-y">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-4 py-6 text-left"
      >
        <span className="display text-3xl sm:text-4xl">Explain this asset</span>
        <span className="hidden font-mono text-[10px] tracking-wider text-muted-foreground uppercase sm:inline">Plain English · CMC fields only · no advice</span>
        <Plus className={cn("ml-auto size-5 transition-transform duration-300", open && "rotate-45")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="max-w-3xl space-y-4 pb-8 text-[17px] leading-relaxed">
              {lines.map((l, i) => (
                <p key={i} className={cn(i === lines.length - 1 && "font-mono text-xs tracking-wide text-muted-foreground uppercase")}>
                  {l}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
