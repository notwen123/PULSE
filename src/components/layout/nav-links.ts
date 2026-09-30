/** App tabs. Explore groups search, the full RWA list and issuers. */
export const NAV = [
  { href: "/passport", label: "Explore", match: ["/passport"] },
  { href: "/assets", label: "All RWAs", match: ["/assets"] },
  { href: "/issuers", label: "Issuers", match: ["/issuers"] },
  { href: "/pulse", label: "Daily Pulse", match: ["/pulse"] },
  { href: "/saved", label: "Saved", match: ["/saved"] },
  { href: "/developers", label: "Developer", match: ["/developers"] },
] as const;

export const isActive = (path: string, match: readonly string[]) =>
  match.some((m) => path === m || path.startsWith(`${m}/`));
