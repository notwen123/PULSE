"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** Local-time greeting; renders a neutral label on the server to avoid hydration mismatch. */
export function Greeting() {
  const hour = useSyncExternalStore(noop, () => new Date().getHours(), () => -1);
  const text = hour < 0 ? "Today’s pulse" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return <>{text}</>;
}
