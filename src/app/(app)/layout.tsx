import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

/** The product: app header with tabs. Reached from the landing via Explore / Launch App. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="min-h-[70vh]">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
