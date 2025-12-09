"use client";

/**
 * Manual Practice Page
 *
 * Precision question generator with cascading selectors.
 * Distinct from Modules page - this is a tool, not a browser.
 */

import { Suspense } from "react";
import { useApiKey } from "@/app/ApiKeyContext";
import { PracticeConfigurator } from "@/components/practice/PracticeConfigurator";
import { Skeleton } from "@/components/ui/skeleton";
import { Crosshair } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

function ConfiguratorSkeleton() {
  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8 space-y-6">
          <div className="flex justify-center">
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
          <Skeleton className="h-6 w-48 mx-auto" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          </div>
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ManualPracticePage() {
  const { isLoading: apiKeyLoading } = useApiKey();

  if (apiKeyLoading) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Header */}
      <header className="border-b bg-muted/30 shrink-0">
        <div className="px-6 py-6 md:py-8">
          <div className="flex items-start gap-4 max-w-2xl mx-auto">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Crosshair weight="duotone" className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Manual Practice
              </h1>
              <p className="text-muted-foreground text-sm md:text-base mt-1">
                Configure and generate a specific practice question
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Centered Configurator */}
      <main className="flex-1 p-6 flex items-start justify-center">
        <Suspense fallback={<ConfiguratorSkeleton />}>
          <PracticeConfigurator />
        </Suspense>
      </main>

      {/* Footer Link */}
      <footer className="border-t py-4 px-6">
        <p className="text-center text-sm text-muted-foreground">
          Need to explore topics?{" "}
          <Link href="/modules" className="text-primary hover:underline">
            Browse Curriculum →
          </Link>
        </p>
      </footer>
    </div>
  );
}
