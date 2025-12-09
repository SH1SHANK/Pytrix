"use client";

/**
 * API & Keys Settings Section
 * - Provider panel with Google Gemini
 * - API key input with show/hide
 * - Save, Test, Clear actions
 * - Status indicators and usage tips
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Key,
  Eye,
  EyeSlash,
  FloppyDisk,
  Trash,
  Lightning,
  CheckCircle,
  XCircle,
  ArrowSquareOut,
  Info,
  ShieldCheck,
  SpinnerGap,
  Clock,
} from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import { loadUserApiConfig } from "@/lib/apiKeyStore";
import { testApiConnection } from "@/lib/aiClient";
import { useApiKey } from "@/app/ApiKeyContext";
import { useSettingsStore } from "@/lib/settingsStore";
// import { useHydration } from "@/hooks/useHydration";

export function ApiKeysSection() {
  const { setApiKey: setContextKey, removeApiKey: removeContextKey } =
    useApiKey();
  const { apiKeyLastVerified, setApiKeyVerified } = useSettingsStore();
  // const isHydrated = useHydration();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);
  // const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "valid" | "invalid"
  >("idle");

  // Load existing config on mount
  useEffect(() => {
    const config = loadUserApiConfig();
    if (config) {
      setApiKey(config.apiKey);
      setHasExistingKey(true);
    }
  }, []);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      setContextKey(apiKey.trim());
      setHasExistingKey(true);
      setTestStatus("idle");
      toast.success("API key saved successfully");
    } catch (error) {
      toast.error("Failed to save API key");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key first");
      return;
    }

    // Save first
    setContextKey(apiKey.trim());
    setHasExistingKey(true);

    setIsLoading(true);
    setTestStatus("testing");

    try {
      const result = await testApiConnection();

      if (result.valid) {
        setTestStatus("valid");
        setApiKeyVerified();
        toast.success("API key is valid and working!");
      } else {
        setTestStatus("invalid");
        toast.error(result.error || "Invalid API key");
      }
    } catch (error) {
      setTestStatus("invalid");
      const message =
        error instanceof Error ? error.message : "Connection test failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearKey = () => {
    removeContextKey();
    setApiKey("");
    setHasExistingKey(false);
    setTestStatus("idle");
    toast.success("API key removed");
  };

  return (
    <div className="space-y-6">
      {/* Provider Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key weight="duotone" className="h-5 w-5 text-primary" />
            AI Provider
          </CardTitle>
          <CardDescription>
            Configure your API key for AI-powered features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google Gemini Provider */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <Lightning weight="duotone" className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Google Gemini API</p>
                <p className="text-xs text-muted-foreground">
                  Primary AI provider for all features
                </p>
              </div>
            </div>
            <Badge
              variant={hasExistingKey ? "default" : "secondary"}
              className={hasExistingKey ? "bg-green-500/10 text-green-500" : ""}
            >
              {hasExistingKey ? "Active" : "Not Configured"}
            </Badge>
          </div>

          {/* Placeholder for future providers */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-dashed opacity-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-muted">
                <Lightning weight="duotone" className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">More Providers</p>
                <p className="text-xs text-muted-foreground">
                  OpenAI, Claude, and more coming soon
                </p>
              </div>
            </div>
            <Badge variant="outline">Coming Soon</Badge>
          </div>
        </CardContent>
      </Card>

      {/* API Key Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">API Key</CardTitle>
          <CardDescription>
            Enter your Gemini API key from Google AI Studio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="api-key"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setTestStatus("idle");
                  }}
                  placeholder="Enter your Gemini API key"
                  className="pr-10 font-mono"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? (
                    <EyeSlash className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Test Status */}
            {isLoading && (
              <div className="flex items-center gap-2 mt-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-48" />
              </div>
            )}

            {hasExistingKey && !isLoading && testStatus === "idle" && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                Click &quot;Test Connection&quot; to verify it works.
              </p>
            )}
            {!isLoading && testStatus === "valid" && (
              <p className="text-xs text-green-500 flex items-center gap-1">
                <CheckCircle weight="fill" className="h-3 w-3" />
                API key is valid and working
              </p>
            )}
            {!isLoading && testStatus === "invalid" && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <XCircle weight="fill" className="h-3 w-3" />
                API key is invalid. Please check and try again.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={!apiKey.trim() || isSaving}>
              {isSaving ? (
                <SpinnerGap className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FloppyDisk weight="duotone" className="h-4 w-4 mr-2" />
              )}
              {isSaving ? "Saving..." : "Save API Key"}
            </Button>
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={!apiKey.trim() || isLoading}
            >
              {isLoading ? (
                <SpinnerGap className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Lightning weight="duotone" className="h-4 w-4 mr-2" />
              )}
              {isLoading ? "Testing..." : "Test Connection"}
            </Button>
            {hasExistingKey && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon">
                    <Trash weight="duotone" className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear API Key?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove your saved API key. You won&apos;t be
                      able to use AI features until you configure a new key.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearKey}>
                      Clear Key
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Last Verified */}
          {apiKeyLastVerified && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last verified: {new Date(apiKeyLastVerified).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Security & Usage Tips */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck weight="duotone" className="h-5 w-5 text-green-500" />
            Security & Usage Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Your key stays local.</strong>{" "}
            Stored only in your browser&apos;s localStorage.
          </p>
          <p>
            <strong className="text-foreground">Rate limits apply.</strong> Free
            tier has ~1500 calls/day for flash-lite.
          </p>
          <p>
            <strong className="text-foreground">Never share your key.</strong>{" "}
            Anyone with it can use your quota.
          </p>
          <Button variant="link" className="h-auto p-0 text-sm" asChild>
            <Link href="/support/help#limits">
              Learn more about rate limits
              <ArrowSquareOut className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Get API Key */}
      <Alert className="border-blue-500/20 bg-blue-500/5">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertTitle>Need an API Key?</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <span>Get a free API key from Google AI Studio.</span>
          <Button variant="outline" size="sm" className="w-fit" asChild>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Google AI Studio
              <ArrowSquareOut className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
