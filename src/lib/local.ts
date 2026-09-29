"use client";

/**
 * Browser-local persistence for saved RWAs, recent views and the explorer
 * streak. No account needed. Every access is guarded: storage may be blocked.
 */
import { useSyncExternalStore } from "react";

export interface SavedAsset {
  rwaId: number;
  symbol: string;
  name: string;
}

export interface Progress {
  xp: number;
  streak: number;
  lastDay: string | null;
  verified: number;
}

const KEYS = { saved: "pulse:saved", recent: "pulse:recent", progress: "pulse:progress" } as const;
const EVENT = "pulse:storage";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: feature silently becomes session-less */
  }
  cache.delete(key);
  window.dispatchEvent(new Event(EVENT));
}

// Snapshot cache so useSyncExternalStore gets stable references.
const cache = new Map<string, { raw: string | null; value: unknown }>();
function snapshot<T>(key: string, fallback: T): T {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    raw = null;
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  const value = raw ? read<T>(key, fallback) : fallback;
  cache.set(key, { raw, value });
  return value;
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

const EMPTY: SavedAsset[] = [];
const NO_PROGRESS: Progress = { xp: 0, streak: 0, lastDay: null, verified: 0 };

export const useSaved = () => useSyncExternalStore(subscribe, () => snapshot(KEYS.saved, EMPTY), () => EMPTY);
export const useRecent = () => useSyncExternalStore(subscribe, () => snapshot(KEYS.recent, EMPTY), () => EMPTY);
export const useProgress = () => useSyncExternalStore(subscribe, () => snapshot(KEYS.progress, NO_PROGRESS), () => NO_PROGRESS);

export function toggleSaved(asset: SavedAsset) {
  const saved = read<SavedAsset[]>(KEYS.saved, []);
  const exists = saved.some((s) => s.rwaId === asset.rwaId);
  write(KEYS.saved, exists ? saved.filter((s) => s.rwaId !== asset.rwaId) : [asset, ...saved].slice(0, 30));
  return !exists;
}

export function recordView(asset: SavedAsset) {
  const recent = read<SavedAsset[]>(KEYS.recent, []).filter((r) => r.rwaId !== asset.rwaId);
  write(KEYS.recent, [asset, ...recent].slice(0, 8));
  award(10);
}

export function recordVerification() {
  const p = read<Progress>(KEYS.progress, NO_PROGRESS);
  write(KEYS.progress, { ...p, verified: p.verified + 1 });
  award(5);
}

const today = () => new Date().toISOString().slice(0, 10);

/** Daily streak: consecutive UTC days with at least one Passport view. */
export function nextStreak(p: Progress, day = today()): number {
  if (p.lastDay === day) return p.streak;
  const yesterday = new Date(Date.parse(day) - 86_400_000).toISOString().slice(0, 10);
  return p.lastDay === yesterday ? p.streak + 1 : 1;
}

function award(xp: number) {
  const p = read<Progress>(KEYS.progress, NO_PROGRESS);
  const day = today();
  write(KEYS.progress, { ...p, xp: p.xp + xp, streak: nextStreak(p, day), lastDay: day });
}

export const levelFor = (xp: number) => Math.floor(xp / 100) + 1;
