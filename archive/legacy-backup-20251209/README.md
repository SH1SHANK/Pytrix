# Legacy Backup - 2025-12-09

## Archived Files

These files were archived during the repository cleanup on 2025-12-09.

### Deprecated AI Server Actions

| File                  | Reason                                                  |
| --------------------- | ------------------------------------------------------- |
| `generateQuestion.ts` | Replaced by `src/lib/questionService.ts` and API routes |
| `evaluateCode.ts`     | Replaced by `/api/ai/evaluate` route                    |
| `getHints.ts`         | Replaced by `/api/ai/hints` route                       |
| `revealSolution.ts`   | Replaced by `/api/ai/solution` route                    |
| `optimizeSolution.ts` | Replaced by `/api/ai/optimize` route                    |

## Restoration Instructions

To restore any file:

```bash
# Copy back from archive
cp archive/legacy-backup-20251209/<filename> src/lib/ai/

# Or use git to restore from before cleanup
git checkout pre-cleanup-20251209 -- src/lib/ai/<filename>
```

## Why Archived

These files were marked as DEPRECATED in their headers. They were server actions
that have been replaced by the new API route-based architecture for Gemini calls.

The new architecture uses:

- `/api/ai/*` routes for all AI operations
- `src/lib/ai/geminiClient.ts` for client initialization
- `src/lib/ai/modelRouter.ts` for model selection
- `src/lib/questionService.ts` for question generation
