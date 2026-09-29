"use client";

import { useState } from "react";
import { Loader2, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "/api/verify?q=rwa-identity&symbol=TSLA",
  "/api/verify?q=rwa-quote&symbol=GOLD",
  "/api/verify?q=fear-and-greed",
  "/api/verify?q=altcoin-season",
  "/api/verify?q=btc-dominance",
];

/** Runs real requests against this deployment's Evidence API. */
export function TryVerify() {
  const [url, setUrl] = useState(EXAMPLES[0]);
  const [out, setOut] = useState<{ status: number; body: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async (u: string) => {
    setUrl(u);
    setLoading(true);
    try {
      const res = await fetch(u);
      setOut({ status: res.status, body: JSON.stringify(await res.json(), null, 2) });
    } catch {
      setOut({ status: 0, body: "Request failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="surface overflow-hidden">
      <div className="flex flex-wrap gap-2 border-b p-3">
        {EXAMPLES.map((e) => (
          <button
            key={e}
            onClick={() => run(e)}
            className={cn(
              "rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors",
              e === url ? "border-foreground bg-foreground text-background" : "hover:bg-muted"
            )}
          >
            {e.replace("/api/verify?", "")}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 border-b px-4 py-2.5">
        <span className="font-mono text-xs text-muted-foreground">GET</span>
        <code className="min-w-0 flex-1 truncate font-mono text-xs">{url}</code>
        <button
          onClick={() => run(url)}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background"
        >
          {loading ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3" />} Run
        </button>
      </div>
      <pre className="max-h-96 overflow-auto bg-muted/40 p-4 font-mono text-[11.5px] leading-relaxed">
        {out ? `// HTTP ${out.status}\n${out.body}` : "// Press Run to call the Evidence API"}
      </pre>
    </div>
  );
}
