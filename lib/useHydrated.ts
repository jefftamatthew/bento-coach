import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** False during server render and hydration, true afterwards (safe to read localStorage). */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
