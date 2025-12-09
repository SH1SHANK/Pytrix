"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { NextStepsPanel } from "@/components/dashboard/NextStepsPanel";
import { RecentActivityRow } from "@/components/dashboard/RecentActivityRow";
import { Separator } from "@/components/ui/separator";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      {/* 1. Global Stats Row */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <StatsRow />
      </section>

      {/* 2. Next Actions */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          What to do next
        </h2>
        <NextStepsPanel />
      </section>

      <Separator />

      {/* 3. Recent Activity */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">
            Recent Activity
          </h2>
          {/* Link to full history could go here */}
        </div>
        <RecentActivityRow />
      </section>
    </DashboardLayout>
  );
}
