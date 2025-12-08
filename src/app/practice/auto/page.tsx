"use client";

/**
 * Auto Mode Page
 * Launches or continues Auto Mode runs.
 */

import { useState } from "react";
import { SaveFileDialog } from "@/components/automode/SaveFileDialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lightning, Sparkle, Target, TrendUp } from "@phosphor-icons/react";
import { useRequireApiKey } from "@/hooks/useRequireApiKey";

export default function AutoModePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { isLoading } = useRequireApiKey();

  if (isLoading) return null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">
          Auto Mode
        </h2>
        <p className="text-muted-foreground">
          AI-powered adaptive practice that focuses on your weakest areas.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <Target className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-lg">Adaptive Learning</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Questions adjust to your skill level, focusing on areas that need
              improvement.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <TrendUp className="h-8 w-8 text-green-500 mb-2" />
            <CardTitle className="text-lg">Track Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Monitor your improvement across topics and difficulty levels over
              time.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <Sparkle className="h-8 w-8 text-yellow-500 mb-2" />
            <CardTitle className="text-lg">Smart Prioritization</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Automatically prioritizes weakest topics first for efficient
              learning.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Start Button */}
      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={() => setDialogOpen(true)}>
          <Lightning className="mr-2 h-5 w-5" />
          Start Auto Mode
        </Button>
      </div>

      <SaveFileDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
