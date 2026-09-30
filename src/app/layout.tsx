import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { MotionProvider } from "@/components/providers/motion-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// One sans for everything; mono only for identifiers, endpoints and hashes.
const sans = Inter({ variable: "--font-inter", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-mono-face", subsets: ["latin"] });

const title = "PULSE — The Verification Layer for Tokenized Markets";
const description = "Understand tokenized real-world assets with CMC-sourced market data and evidence receipts.";

export const metadata: Metadata = {
  title: { default: title, template: "%s · PULSE" },
  description,
  openGraph: { title, description, type: "website", siteName: "PULSE" },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#1b211d" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <MotionProvider>
            <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-background">
              Skip to content
            </a>
            {children}
            <Toaster position="bottom-right" />
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
