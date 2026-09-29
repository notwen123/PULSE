/**
 * Loading as part of the identity: the Passport shows what it is resolving,
 * in the order the server does it. Pure CSS, no client JS.
 */
const STEPS = [
  ["RWA identity", "/v5/real-world-assets/info"],
  ["Tokenized quote", "/v5/real-world-assets/quotes/latest"],
  ["Chains & issuers", "/v2/cryptocurrency/info"],
];

export function Resolving({ label = "Resolving asset" }: { label?: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-24" role="status" aria-live="polite">
      <div className="relative mx-auto grid size-20 place-items-center">
        <span className="ring-out absolute inset-0 rounded-full border border-pulse" />
        <span className="ring-out absolute inset-0 rounded-full border border-pulse" style={{ animationDelay: "0.8s" }} />
        <span className="grid size-12 place-items-center rounded-full border-2 border-pulse bg-paper font-mono text-[9px] tracking-widest text-pulse">RWA</span>
      </div>
      <p className="display text-center text-3xl">{label}…</p>
      <ol className="overflow-hidden rounded-2xl border bg-paper">
        {STEPS.map(([t, e], i) => (
          <li key={t} className="relative flex items-center justify-between gap-4 overflow-hidden border-b px-4 py-3 last:border-b-0">
            <span className="flex items-center gap-3 text-sm">
              <span className="font-mono text-[10px] text-muted-foreground">0{i + 1}</span>
              {t}
            </span>
            <span className="truncate font-mono text-[10px] text-muted-foreground">{e}</span>
            <span className="scan absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-pulse/10 to-transparent" style={{ animationDelay: `${i * 0.25}s` }} aria-hidden />
          </li>
        ))}
      </ol>
    </div>
  );
}
