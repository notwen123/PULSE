/**
 * Local fallback marks for a few underlying assets, used only when CMC's
 * /v5/real-world-assets/info returns no `about.logo`. Keyed by RWA symbol.
 */
const LOCAL: Record<string, string> = {
  TSLA: "/pulse/logos/tesla.png",
  NVDA: "/pulse/logos/nvidia.png",
  SPCX: "/pulse/logos/spacex.png",
};

export const assetLogo = (symbol: string, cmcLogo: string | null): string | null => cmcLogo ?? LOCAL[symbol.toUpperCase()] ?? null;
