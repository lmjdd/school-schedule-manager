# Task 5c：快速录入成绩 Sheet

## Task ID
5c

## Summary
Added a "快速录入成绩" (Quick Grade Entry) feature to the statistics page grade table. A floating button at the top-right of the grade table opens a right-side Sheet panel with a form for quickly entering a single grade with auto-calculated GPA.

## Files Created
- `src/components/statistics/quick-grade-entry-sheet.tsx` — New QuickGradeEntrySheet component

## Files Modified
- `src/components/statistics/grade-table.tsx` — Added "快速录入" button and QuickGradeEntrySheet integration

## Implementation Details
- Sheet slides in from right with course selector, score input (0-100), semester input, credit input (1-8)
- Real-time GPA calculation with 10-level grading system displayed in a 2×5 grid
- Color-coded grade points: green ≥3.7, blue ≥3.0, amber ≥2.0, red <2.0
- Form validation, POST /api/grades submission, query invalidation, toast feedback
- No localStorage usage (no hydration issues)

## QA
- ✅ ESLint zero errors
- ✅ Dev server compiles successfully
- ✅ All existing functionality preserved
