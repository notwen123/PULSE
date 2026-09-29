import Link from "next/link";
import { RwaSearch } from "@/components/rwa/rwa-search";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-24 sm:px-6">
      <p className="eyebrow">Not found</p>
      <h1 className="display text-5xl">We couldn’t find that page.</h1>
      <RwaSearch />
      <Link href="/" className="text-sm text-muted-foreground underline underline-offset-4">Back to PULSE</Link>
    </div>
  );
}
