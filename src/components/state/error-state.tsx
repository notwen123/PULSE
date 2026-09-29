"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RotateCw, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/** Polished failure state with retry. Never a blank screen. */
export function ErrorState({
  title,
  detail,
  onRetry,
  className,
  compact = false,
}: {
  title: string;
  detail?: string;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className={cn("surface flex flex-col items-start gap-3", compact ? "p-4" : "p-6 sm:p-8", className)} role="alert">
      <span className="inline-flex size-9 items-center justify-center rounded-full bg-warn-soft text-warn">
        <TriangleAlert className="size-4" />
      </span>
      <div>
        <p className="font-medium">{title}</p>
        {detail && <p className="mt-1 text-sm text-muted-foreground">{detail}</p>}
      </div>
      <button
        type="button"
        onClick={() => (onRetry ? onRetry() : start(() => router.refresh()))}
        className="inline-flex items-center gap-1.5 rounded-full border bg-paper px-3 py-1.5 text-sm transition-colors hover:bg-muted"
      >
        <RotateCw className={cn("size-3.5", pending && "animate-spin")} /> Retry
      </button>
    </div>
  );
}
