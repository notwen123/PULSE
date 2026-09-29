"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

/**
 * The PULSE identity object. Four stacked document plates:
 *   evidence (top) · representations · RWA identity · underlying asset (base)
 * with one node per tracked token orbiting the representation layer.
 * Scroll separates the layers; pointer adds a little parallax; hovering a
 * node names it. Everything is driven by real Passport data passed in.
 */

export interface IdentityObjectProps {
  tokens: { symbol: string; issuer: string | null }[];
  /** 0 → 1: how far the layers have separated (driven by scroll). */
  spread: React.RefObject<number>;
  onHover?: (label: string | null) => void;
  lite?: boolean;
  still?: boolean;
}

const INK = new THREE.Color("#1f2621");
const PAPER = new THREE.Color("#f3eddd");
const GREEN = new THREE.Color("#2e6b4b");
const SAGE = new THREE.Color("#9db7a3");

function roundedPlate(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return new THREE.ExtrudeGeometry(s, { depth: 0.035, bevelEnabled: false, curveSegments: 8 });
}

const LAYERS = [
  { label: "Underlying asset", size: 2.5, opacity: 0.95, color: INK },
  { label: "RWA identity", size: 2.05, opacity: 0.55, color: PAPER },
  { label: "Token representations", size: 2.3, opacity: 0.32, color: PAPER },
  { label: "Evidence receipt", size: 1.55, opacity: 0.72, color: PAPER },
];

function Plate({ i, spread }: { i: number; spread: React.RefObject<number> }) {
  const ref = useRef<THREE.Group>(null);
  const layer = LAYERS[i];
  const geo = useMemo(() => roundedPlate(layer.size, layer.size * 0.72, 0.14), [layer.size]);
  const edges = useMemo(() => new THREE.EdgesGeometry(geo, 30), [geo]);
  useFrame(() => {
    if (!ref.current) return;
    const s = spread.current ?? 0;
    const target = (i - 1.5) * (0.42 + s * 0.55);
    ref.current.position.y += (target - ref.current.position.y) * 0.08;
  });
  return (
    <group ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={geo}>
        <meshStandardMaterial
          color={layer.color}
          emissive={layer.color}
          emissiveIntensity={i === 0 ? 0 : 0.45}
          transparent
          opacity={layer.opacity}
          roughness={0.85}
          metalness={0}
          side={THREE.DoubleSide}
          depthWrite={i === 0}
        />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={i === 3 ? GREEN : INK} transparent opacity={i === 0 ? 0.0 : 0.55} />
      </lineSegments>
      {i === 3 && (
        // The verification seal on the evidence layer.
        <mesh position={[layer.size / 2 - 0.28, layer.size * 0.36 - 0.28, 0.05]}>
          <circleGeometry args={[0.09, 24]} />
          <meshBasicMaterial color={GREEN} />
        </mesh>
      )}
    </group>
  );
}

function Nodes({
  tokens,
  spread,
  onHover,
  lite,
}: Pick<IdentityObjectProps, "tokens" | "spread" | "onHover" | "lite">) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const n = Math.max(tokens.length, 1);
  const lines = useMemo(() => {
    const pts: number[] = [];
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      pts.push(0, 0, 0, Math.cos(a) * 1.55, 0, Math.sin(a) * 1.05);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [n]);

  useFrame((_, dt) => {
    if (!group.current) return;
    const s = spread.current ?? 0;
    group.current.position.y += ((0.5 * (0.42 + s * 0.55)) - group.current.position.y) * 0.08;
    group.current.rotation.y += dt * 0.12;
  });

  const over = (k: number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(k);
    const t = tokens[k];
    onHover?.(t ? `${t.symbol}${t.issuer ? ` · ${t.issuer}` : ""}` : null);
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    setHovered(null);
    onHover?.(null);
    document.body.style.cursor = "";
  };

  return (
    <group ref={group}>
      <lineSegments geometry={lines}>
        <lineBasicMaterial color={INK} transparent opacity={0.28} />
      </lineSegments>
      {Array.from({ length: n }, (_, k) => {
        const a = (k / n) * Math.PI * 2;
        const on = hovered === k;
        return (
          <mesh
            key={k}
            position={[Math.cos(a) * 1.55, 0, Math.sin(a) * 1.05]}
            scale={on ? 1.8 : 1}
            onPointerOver={lite ? undefined : over(k)}
            onPointerOut={lite ? undefined : out}
          >
            <sphereGeometry args={[0.07, lite ? 10 : 20, lite ? 10 : 20]} />
            <meshStandardMaterial color={on ? GREEN : INK} roughness={0.4} />
          </mesh>
        );
      })}
    </group>
  );
}

function Dust({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    // Deterministic pseudo-random positions (no Math.random in render).
    const p = new Float32Array(count * 3);
    for (let k = 0; k < count; k++) {
      const r = 2.2 + ((k * 37) % 100) / 60;
      const a = k * 2.399963;
      p.set([Math.cos(a) * r, (((k * 53) % 100) / 100 - 0.5) * 2.6, Math.sin(a) * r], k * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    return g;
  }, [count]);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y -= dt * 0.02;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color={SAGE} size={0.022} sizeAttenuation transparent opacity={0.7} />
    </points>
  );
}

function Rig({ children, still }: { children: React.ReactNode; still?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, dt) => {
    if (!ref.current || still) return;
    const { x, y } = state.pointer;
    ref.current.rotation.x += ((0.55 + y * 0.12) - ref.current.rotation.x) * 0.05;
    ref.current.rotation.z += ((-x * 0.1) - ref.current.rotation.z) * 0.05;
    ref.current.rotation.y += dt * 0.08;
  });
  return (
    <group ref={ref} rotation={[0.55, -0.5, 0]}>
      {children}
    </group>
  );
}

export default function IdentityObject({ tokens, spread, onHover, lite = false, still = false }: IdentityObjectProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  // Stop rendering entirely when scrolled out of view.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="size-full">
      <Canvas
        dpr={lite ? 1 : [1, 1.6]}
        camera={{ position: [0, 0.4, 6.4], fov: 34 }}
        frameloop={still ? "demand" : visible ? "always" : "never"}
        gl={{ antialias: !lite, alpha: true, powerPreference: "low-power" }}
        aria-hidden
      >
        <ambientLight intensity={1.1} />
        <directionalLight position={[3, 5, 4]} intensity={1.4} />
        <Rig still={still}>
          {LAYERS.map((_, i) => (
            <Plate key={i} i={i} spread={spread} />
          ))}
          <Nodes tokens={tokens} spread={spread} onHover={onHover} lite={lite} />
          {!lite && <Dust count={140} />}
        </Rig>
      </Canvas>
    </div>
  );
}
