"use client";

/**
 * Bug Report Page
 * Form for submitting bug reports using React Hook Form.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Bug, PaperPlaneTilt, CheckCircle } from "@phosphor-icons/react";

interface BugReportForm {
  title: string;
  category: string;
  description: string;
  steps: string;
  expected: string;
  email?: string;
}

export default function BugReportPage() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<BugReportForm>();

  const onSubmit = async (data: BugReportForm) => {
    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Bug report submitted:", data);
    toast.success("Bug report submitted successfully!");
    setSubmitted(true);
    reset();
  };

  if (submitted) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-semibold">Thank You!</h2>
            <p className="text-muted-foreground">
              Your bug report has been submitted. We appreciate your help in
              improving PyPractice.
            </p>
            <Button onClick={() => setSubmitted(false)} variant="outline">
              Submit Another Report
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">
          Report a Bug
        </h2>
        <p className="text-muted-foreground">
          Found something broken? Help us fix it by providing details below.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Bug Report Form
          </CardTitle>
          <CardDescription>
            Please provide as much detail as possible to help us investigate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Bug Title *</Label>
              <Input
                id="title"
                placeholder="Brief description of the issue"
                {...register("title", { required: "Title is required" })}
              />
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select onValueChange={(value) => setValue("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ui">User Interface</SelectItem>
                  <SelectItem value="code-editor">Code Editor</SelectItem>
                  <SelectItem value="ai">AI / Question Generation</SelectItem>
                  <SelectItem value="stats">Stats & Progress</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe what happened..."
                rows={4}
                {...register("description", {
                  required: "Description is required",
                })}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Steps to Reproduce */}
            <div className="space-y-2">
              <Label htmlFor="steps">Steps to Reproduce</Label>
              <Textarea
                id="steps"
                placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
                rows={3}
                {...register("steps")}
              />
            </div>

            {/* Expected Behavior */}
            <div className="space-y-2">
              <Label htmlFor="expected">Expected Behavior</Label>
              <Textarea
                id="expected"
                placeholder="What did you expect to happen?"
                rows={2}
                {...register("expected")}
              />
            </div>

            {/* Email (optional) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register("email")}
              />
              <p className="text-xs text-muted-foreground">
                We may contact you for follow-up questions.
              </p>
            </div>

            {/* Submit */}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <PaperPlaneTilt className="mr-2 h-4 w-4" />
                  Submit Bug Report
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
