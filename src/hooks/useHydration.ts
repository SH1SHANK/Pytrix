/**
 * useHydration Hook
 *
 * Prevents hydration mismatches when using Zustand persist with Next.js.
 * Returns true only after the component has mounted on the client.
 */

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function useHydration() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
