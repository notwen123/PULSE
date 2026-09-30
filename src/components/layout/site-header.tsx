import { getCurrency } from "@/app/actions/currency";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandPalette } from "@/components/search/command-palette";
import { CurrencySelector } from "./currency-selector";
import { AppTabs, HeaderShell } from "./site-nav";

/** App header: brand + tools, with the product tabs underneath. */
export async function SiteHeader() {
  const currency = await getCurrency();
  return (
    <HeaderShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="flex h-16 items-center gap-4">
          <Logo descriptor className="shrink-0" />
          <div className="ml-auto flex items-center gap-2">
            <div className="w-9 sm:w-56">
              <CommandPalette />
            </div>
            <CurrencySelector value={currency} />
            <ThemeToggle />
          </div>
        </div>
        <div className="border-t">
          <AppTabs />
        </div>
      </div>
    </HeaderShell>
  );
}
