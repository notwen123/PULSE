import { getCurrency } from "@/app/actions/currency";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandPalette } from "@/components/search/command-palette";
import { CurrencySelector } from "./currency-selector";
import { DesktopNav, HeaderShell, MobileNav } from "./site-nav";

export async function SiteHeader() {
  const currency = await getCurrency();
  return (
    <HeaderShell>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:gap-8 sm:px-6 lg:px-10">
        <Logo />
        <DesktopNav />
        <div className="ml-auto flex items-center gap-2">
          <div className="w-9 sm:w-52">
            <CommandPalette />
          </div>
          <div className="hidden md:block">
            <CurrencySelector value={currency} />
          </div>
          <ThemeToggle />
          <MobileNav>
            <p className="eyebrow mb-2">Display currency</p>
            <CurrencySelector value={currency} />
          </MobileNav>
        </div>
      </div>
    </HeaderShell>
  );
}
