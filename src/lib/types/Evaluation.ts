export type EvaluationStatus = "correct" | "incorrect" | "error";

export interface EvaluationResult {
  status: EvaluationStatus;
  explanation: string; // why code failed or succeeded
  expectedBehavior: string; // describes the intended logic
  nextHint: string | null; // optional short nudge
}
