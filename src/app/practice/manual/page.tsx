"use client";

/**
 * Manual Practice Landing Page
 * Allows users to select a topic and difficulty before starting practice.
 */

import { TopicGrid } from "@/components/dashboard/TopicGrid";
import { useRequireApiKey } from "@/hooks/useRequireApiKey";

export default function ManualPracticePage() {
  const { isLoading } = useRequireApiKey();

  if (isLoading) return null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">
          Manual Practice
        </h2>
        <p className="text-muted-foreground">
          Choose a topic and difficulty to start practicing.
        </p>
      </div>

      <TopicGrid />
    </div>
  );
}
