"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useMotionValueEvent, useScroll } from "motion/react";
import { useIsMobile, useReducedMotion } from "@/hooks/use-media";

const IdentityObject = dynamic(() => import("@/components/three/identity-object"), { ssr: false, loading: () => <Still /> });

/** Static silhouette of the object: shown while the 3D chunk loads and under reduced motion. */
function Still() {
  return (
    <svg viewBox="0 0 400 300" className="size-full text-foreground" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(200 ${230 - i * 44}) skewX(-28) scale(1 0.42)`}>
          <rect x={-120 + i * 8} y={-80} width={240 - i * 16} height={160} rx={16} fill={i === 0 ? "currentColor" : "none"} stroke="currentColor" strokeOpacity={0.5} />
        </g>
      ))}
      <circle cx="286" cy="84" r="5" className="fill-pulse" />
    </svg>
  );
}

/**
 * The identity object for section 01: one node per real tracked token.
 * Scrolling through the section separates the layers; hovering a node names it.
 */
export function RepresentationsObject({ tokens }: { tokens: { symbol: string; issuer: string | null }[] }) {
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  const ref = useRef<HTMLDivElement>(null);
  const spread = useRef(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => (spread.current = Math.min(1, Math.max(0, (v - 0.25) * 2))));

  return (
    <div ref={ref} className="relative aspect-[4/3] w-full">
      {reduced ? <Still /> : <IdentityObject tokens={tokens} spread={spread} onHover={setHovered} lite={mobile} />}
      <p className="absolute bottom-0 left-0 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
        {hovered ? <span className="text-foreground">● {hovered}</span> : `${tokens.length} nodes = ${tokens.length} tracked tokens · hover to identify`}
      </p>
    </div>
  );
}
