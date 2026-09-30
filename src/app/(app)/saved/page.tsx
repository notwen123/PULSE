import type { Metadata } from "next";
import Link from "next/link";
import { getCurrency } from "@/app/actions/currency";
import { SavedSnapshots } from "@/components/rwa/saved-snapshots";
import { RecentAssets } from "@/components/rwa/recent-assets";

export const metadata: Metadata = { title: "My RWAs" };

export default async function SavedPage() {
  const currency = await getCurrency();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6">
      <div>
        <p className="eyebrow">Saved</p>
        <h1 className="mt-2 display text-4xl sm:text-5xl">My RWAs</h1>
        <p className="mt-3 text-muted-foreground">Stored in this browser. No account needed.</p>
      </div>
      <SavedSnapshots
        currency={currency}
        editable
        emptyHint={
          <>
            Nothing saved yet. <Link href="/passport" className="text-foreground underline underline-offset-4">Find an asset</Link> and tap Save.
          </>
        }
      />
      <RecentAssets />
    </div>
  );
}
