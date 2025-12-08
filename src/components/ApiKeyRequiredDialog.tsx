"use client";

/**
 * API Key Required Dialog
 *
 * Shown when user tries to access LLM features without an API key.
 * Provides option to go to Settings or cancel.
 */

import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Key } from "@phosphor-icons/react";

interface ApiKeyRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeyRequiredDialog({
  open,
  onOpenChange,
}: ApiKeyRequiredDialogProps) {
  const router = useRouter();

  const handleOpenSettings = () => {
    onOpenChange(false);
    router.push("/support/settings");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Key weight="duotone" className="h-6 w-6 text-primary" />
            </div>
            <AlertDialogTitle>API Key Required</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            LLM features like question generation, hints, and code evaluation
            require your own API key. Configure it in Settings to continue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleOpenSettings}>
            Open Settings
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
