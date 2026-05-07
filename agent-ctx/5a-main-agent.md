# Task 5a — Assignment Timeline Component

**Agent**: Main Agent  
**Status**: Completed

## Summary

Created `src/components/dashboard/assignment-timeline.tsx` — a vertical timeline visualization component for upcoming assignment deadlines on the Dashboard page.

### Key Implementation Details

1. **Time Grouping**: Assignments (status != 'completed') are grouped into 5 categories:
   - Overdue (red), Today (amber), Tomorrow (orange), This Week (blue), Later (muted)

2. **Timeline Visual**: Vertical connecting line with colored dots at each entry. Dashed lines between groups, solid lines within groups.

3. **Entry Info**: Each entry shows course color dot, assignment title, course name, due date (MM/dd), relative time badge, and priority badge.

4. **Data Fetching**: TanStack Query with `queryKey: ['assignments']`.

5. **Animations**: framer-motion stagger (x: -12 → 0, delay: index × 0.05s), hover scale on dots.

6. **Navigation**: "查看全部" link uses `useAppStore().setCurrentPage('assignments')`.

7. **Empty State**: Gradient circle + 🎉 emoji when no upcoming assignments.

8. **Integration**: Added as full-width Row 4 in dashboard-page.tsx, between PomodoroTimer+WeeklyOverview and DailySummary.

### Files Modified
- `src/components/dashboard/assignment-timeline.tsx` — **NEW**
- `src/components/dashboard/dashboard-page.tsx` — Integration (import + placement)

### QA
- ESLint: 0 new errors (10 pre-existing in markdown-toolbar.tsx)
- Dev server: Compiled successfully, GET / 200
- All APIs: Normal response
