# Task 5-6: Sidebar & Dashboard Enhancements

## Changes Made

### 1. Sidebar Notification Badges (`src/components/layout/sidebar.tsx`)
- **Fixed query keys**: Changed `['courses-count']` → `['courses']` and `['assignments-count']` → `['assignments']` to use shared query keys (avoids duplicate API requests)
- **Added `NotificationBadge` component**: Red dot with count for "作业管理" nav item — shows count of assignments where `status !== 'completed'`
- **Added `SmallBadge` component**: Primary-colored badge for "考试管理" nav item — shows count of upcoming exams within next 7 days
- **Badges styled**: `min-w-[16px]` h-4, `text-[10px] font-mono`, positioned absolute on icon
- **Only shown when count > 0**

### 2. Active Nav Item Indicator (`src/components/layout/sidebar.tsx`)
- **Removed** `bg-secondary` background from active nav items
- **Added** a 2px-wide, 16px-tall, rounded-full primary-colored indicator bar on the left side (`w-0.5 h-4 rounded-full bg-primary`)
- Active items now use `font-medium text-foreground` only (cleaner Notion-style look)

### 3. Dashboard Footer (`src/components/dashboard/dashboard-page.tsx`)
- **Added `DashboardFooter` component** at the bottom of the dashboard
- Shows 3 stats in a clean row:
  - 📚 学期进度: X 门课程
  - ✅ 作业完成率: Z% (completed/total)
  - 🏆 学业状态: "优秀" / "良好" / "加油" / "—" (based on GPA thresholds: ≥3.7, ≥3.0, >0, 0)
- Uses shared query keys `['courses']`, `['assignments']`, `['grades']`
- Styled with `border-t`, `text-xs text-muted-foreground`, responsive `flex-wrap`

### 4. Sidebar Brand Enhancement (`src/components/layout/sidebar.tsx`)
- Added `shadow-[0_1px_0_0_var(--border)]` to brand area for visual separation
- Changed brand text from `text-base` to `text-[17px]`
- Added "v1.0" version badge next to subtitle (`text-[10px] font-mono bg-muted/50 rounded px-1.5`)

### 5. Dashboard Nav Label
- Kept as-is (no emoji, maintaining Notion-style)

## Files Modified
- `src/components/layout/sidebar.tsx`
- `src/components/dashboard/dashboard-page.tsx`

## Verification
- `bun run lint` — ✅ Zero warnings/errors
- Dev server — ✅ Compiled successfully, all APIs returning 200
