"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCurrency } from "@/app/actions/currency";
import { SUPPORTED_CURRENCIES, type Currency } from "@/lib/currency";
import { cn } from "@/lib/utils";

/** Segmented USD / EUR / INR switch. Quotes are re-requested from CMC with `convert`. */
export function CurrencySelector({ value }: { value: Currency }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div
      role="radiogroup"
      aria-label="Display currency"
      className={cn("inline-flex h-8 items-center rounded-full border bg-paper p-0.5", pending && "opacity-60")}
    >
      {SUPPORTED_CURRENCIES.map((c) => (
        <button
          key={c}
          role="radio"
          aria-checked={c === value}
          disabled={pending}
          onClick={() =>
            start(async () => {
              await setCurrency(c);
              router.refresh();
            })
          }
          className={cn(
            "h-full rounded-full px-2.5 font-mono text-[11px] font-medium uppercase transition-colors",
            c === value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
