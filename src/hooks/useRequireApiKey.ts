"use client";

/**
 * useRequireApiKey Hook
 *
 * Redirects to dashboard if no API key is configured.
 * Use this on protected routes that require LLM features.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApiKey } from "@/app/ApiKeyContext";

export function useRequireApiKey() {
  const { hasApiKey, isLoading } = useApiKey();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !hasApiKey) {
      router.replace("/");
    }
  }, [hasApiKey, isLoading, router]);

  return { hasApiKey, isLoading };
}
