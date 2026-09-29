"use client";

import { ErrorState } from "@/components/state/error-state";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6">
      <ErrorState title="Something went wrong loading this page." detail="CMC data may be temporarily unavailable." onRetry={reset} />
    </div>
  );
}
