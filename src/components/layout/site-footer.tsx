import Image from "next/image";
import Link from "next/link";
import { PulseMark } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-10">
        <div>
          <div className="flex items-center gap-2">
            <PulseMark className="size-5" />
            <span className="display text-2xl">Pulse</span>
          </div>
          <p className="display mt-3 max-w-xs text-xl text-muted-foreground">Every asset explained. Every number comes with a receipt.</p>
        </div>
        <nav className="grid grid-cols-2 gap-2 text-sm text-muted-foreground" aria-label="Footer">
          <Link href="/passport" className="hover:text-foreground">Explore</Link>
          <Link href="/pulse" className="hover:text-foreground">Daily Pulse</Link>
          <Link href="/assets" className="hover:text-foreground">All RWAs</Link>
          <Link href="/saved" className="hover:text-foreground">Saved</Link>
          <Link href="/issuers" className="hover:text-foreground">Issuers</Link>
          <Link href="/developers" className="hover:text-foreground">Evidence API</Link>
        </nav>
        <div className="flex flex-col gap-3 text-xs text-muted-foreground">
          <span className="eyebrow">Market data</span>
          <Image src="/pulse/logos/coinmarketcap-wordmark.png" alt="CoinMarketCap" width={288} height={50} className="h-auto w-36 dark:invert" />
          <p>Explains CMC-sourced data. Not investment advice; no buy or sell recommendations.</p>
        </div>
      </div>
    </footer>
  );
}
