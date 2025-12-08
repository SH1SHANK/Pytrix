"use client";

/**
 * EnterApiKeyStep - Fourth step of onboarding
 * API key input with validation
 */

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useApiKey } from "@/app/ApiKeyContext";
import { useSettingsStore } from "@/lib/settingsStore";
import {
  Eye,
  EyeSlash,
  CheckCircle,
  XCircle,
  CircleNotch,
  Key,
} from "@phosphor-icons/react";

type ValidationState = "idle" | "loading" | "success" | "error";

export function EnterApiKeyStep() {
  const [apiKey, setApiKeyValue] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [validationState, setValidationState] =
    useState<ValidationState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const prefersReducedMotion = useReducedMotion();

  const { setApiKey: saveApiKey } = useApiKey();
  const { setApiKeyVerified } = useSettingsStore();

  const fadeUp = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 8 },
    visible: { opacity: 1, y: 0 },
  };

  const validateKey = async () => {
    if (!apiKey.trim()) {
      setErrorMessage("Please enter your API key");
      setValidationState("error");
      return;
    }

    setValidationState("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/ai/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await response.json();

      // Check for success (key is valid)
      if (data.success || data.valid) {
        setValidationState("success");
        saveApiKey(apiKey.trim());
        setApiKeyVerified();

        // Show rate limit warning if applicable
        if (data.errorType === "RATE_LIMIT") {
          setErrorMessage(
            "Key verified! You may be rate-limited - wait before making calls."
          );
        }
      } else {
        setValidationState("error");

        // Show specific error message based on type
        switch (data.errorType) {
          case "INVALID_KEY":
            setErrorMessage(
              "This key doesn't seem to work. Double-check it in Google AI Studio or create a new one."
            );
            break;
          case "NETWORK":
            setErrorMessage(
              "Couldn't reach Gemini API. Check your internet connection and try again."
            );
            break;
          default:
            setErrorMessage(
              data.error || "Failed to validate API key. Please try again."
            );
        }
      }
    } catch {
      setValidationState("error");
      setErrorMessage(
        "Network error. Please check your connection and try again."
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1, duration: 0.25 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 mb-4">
          <Key weight="duotone" className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
          Enter Your API Key
        </h3>
        <p className="text-muted-foreground">
          Paste the API key you copied from Google AI Studio
        </p>
      </motion.div>

      {/* Input */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.15, duration: 0.25 }}
        className="space-y-4"
      >
        <div className="relative">
          <Input
            type={showKey ? "text" : "password"}
            placeholder="AIzaSy..."
            value={apiKey}
            onChange={(e) => {
              setApiKeyValue(e.target.value);
              if (validationState !== "idle") {
                setValidationState("idle");
                setErrorMessage("");
              }
            }}
            className="pr-10 font-mono text-sm h-11"
            disabled={validationState === "success"}
            aria-label="API Key input"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showKey ? "Hide API key" : "Show API key"}
          >
            {showKey ? (
              <EyeSlash className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        <Button
          onClick={validateKey}
          disabled={
            validationState === "loading" || validationState === "success"
          }
          className="w-full gap-2 h-11"
        >
          {validationState === "loading" && (
            <CircleNotch className="w-4 h-4 animate-spin" />
          )}
          {validationState === "success" && <CheckCircle className="w-4 h-4" />}
          {validationState === "loading"
            ? "Verifying..."
            : validationState === "success"
            ? "Key Verified!"
            : "Verify API Key"}
        </Button>
      </motion.div>

      {/* Status messages */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2, duration: 0.25 }}
      >
        {validationState === "success" && (
          <Alert className="border-green-500/20 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-600 dark:text-green-400">
              API key verified! Click <strong>Continue</strong> to finish setup.
            </AlertDescription>
          </Alert>
        )}

        {validationState === "error" && (
          <Alert className="border-red-500/20 bg-red-500/10">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-600 dark:text-red-400">
              {errorMessage || "Invalid API key. Please check and try again."}
            </AlertDescription>
          </Alert>
        )}
      </motion.div>

      {/* Help text */}
      <motion.p
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.25, duration: 0.25 }}
        className="text-xs text-center text-muted-foreground"
      >
        🔒 Your key is stored only in your browser — never sent to our servers.
      </motion.p>
    </div>
  );
}
