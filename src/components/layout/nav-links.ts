export const NAV = [
  { href: "/pulse", label: "Daily Pulse", match: ["/pulse"] },
  { href: "/passport", label: "Explore", match: ["/passport", "/assets", "/issuers"] },
  { href: "/saved", label: "Saved", match: ["/saved"] },
  { href: "/developers", label: "Developer", match: ["/developers"] },
] as const;

export const isActive = (path: string, match: readonly string[]) =>
  match.some((m) => path === m || path.startsWith(`${m}/`));
