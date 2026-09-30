import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { searchRwa } from "@/lib/api/rwa";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RwaSearch } from "@/components/rwa/rwa-search";
import { RecentAssets } from "@/components/rwa/recent-assets";

export const metadata: Metadata = { title: "Explore" };

const STEPS = [
  ["Search", "Ticker or name, resolved through CMC’s RWA ID Map at zero credits."],
  ["Identify", "One stable rwa_id for the asset — not an ambiguous ticker."],
  ["Explain", "Issuers, token representations and chains, on one Passport."],
  ["Verify", "Every important number opens its receipt."],
];

type Props = { searchParams: Promise<{ q?: string }> };

/** /passport?q=TSLA resolves through the RWA ID Map and opens the best match. */
async function resolve(q: string): Promise<number | null> {
  try {
    const { results } = await searchRwa(q.slice(0, 64));
    return (results.find((r) => r.symbol.toUpperCase() === q.toUpperCase()) ?? results[0])?.rwaId ?? null;
  } catch {
    return null;
  }
}

export default async function ExplorePage({ searchParams }: Props) {
  const { q } = await searchParams;
  const hit = q?.trim() ? await resolve(q.trim()) : null;
  if (hit) redirect(`/passport/${hit}`);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
      <header className="flex flex-col gap-8">
        <p className="eyebrow">Explore · RWA Passport</p>
        <h1 className="display max-w-4xl text-4xl leading-[1.05] sm:text-6xl">Search the world’s tokenized assets.</h1>
        {q && !hit && <p className="text-sm text-muted-foreground">No RWA matches “{q}”. Try another ticker or name.</p>}
        <RwaSearch autoFocus />
        <RecentAssets />
      </header>

      <ol className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-4">
        {STEPS.map(([t, d], i) => (
          <li key={t} className="bg-paper p-6">
            <p className="font-mono text-[10px] text-muted-foreground">0{i + 1}</p>
            <p className="display mt-3 text-3xl">{t}</p>
            <p className="mt-2 text-sm text-muted-foreground">{d}</p>
          </li>
        ))}
      </ol>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ["/assets", "All tracked RWAs", "Ranked by rwa_rank, with tokenized aggregates. Filter by stock, commodity, ETF…"],
          ["/issuers", "Issuers", "The organisations minting tokenized assets, and every token each one issued."],
        ].map(([href, t, d]) => (
          <Link key={href} href={href} className="surface group flex items-end justify-between gap-6 p-7 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:[box-shadow:var(--shadow-lift)]">
            <div>
              <p className="display text-4xl">{t}</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">{d}</p>
            </div>
            <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
    </div>
  );
}
