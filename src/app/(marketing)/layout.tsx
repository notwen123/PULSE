import { LandingHeader } from "@/components/landing/landing-header";
import { SiteFooter } from "@/components/layout/site-footer";

/** The landing experience: its own quiet nav, one door into the app. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LandingHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
