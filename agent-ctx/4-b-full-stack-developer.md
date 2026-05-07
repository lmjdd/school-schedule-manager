# Task 4-b: Assignment Drag-and-Drop Sorting and UI Enhancements

## Summary
Implemented drag-and-drop sorting, enhanced card styling, and sidebar stats animation for EduTrack.

## Changes Made

### 1. Assignment Drag-and-Drop (`src/components/assignments/assignment-list.tsx`)
- **Client-side only**: Removed `reorderMutation` that was persisting priority changes via API. Now drag-and-drop only updates `localOrder` state without any server calls.
- **Drag placeholder visual**: When dragging, the original item fades to 30% opacity while a `DragOverlay` shows a floating copy with `shadow-xl`, `ring-2 ring-primary/20`, and `scale-[1.02]`.
- **Grip handle restriction**: Drag is only triggered via the grip handle icon button (`{...attributes} {...listeners}`).
- **Removed incompatible import**: `restrictToVerticalAxis` doesn't exist in `@dnd-kit/core@6.3.1` (it's in `@dnd-kit/modifiers`).

### 2. Priority Color Fix (`src/lib/helpers.ts`)
- Changed low priority (priority=1) color from blue to green:
  - `getPriorityBorderColor`: `border-l-blue-500` → `border-l-green-500`
  - `getPriorityBgColor`: `bg-blue-500` → `bg-green-500`
- Added `getPriorityDotColor()` helper for consistency.
- Final color scheme: high(red) → medium(amber) → low(green) → default(gray).

### 3. Sidebar Stats Enhancement (`src/components/layout/sidebar.tsx`)
- **AnimatedNumber component**: Uses `useSpring` + `useTransform` from framer-motion for smooth number transitions when counts change. Spring config: `stiffness: 120, damping: 24, mass: 0.5`.
- **StatCard component**: Replaced plain stat rows with enhanced cards featuring gradient icon backgrounds, borders, hover effects, and amber accent for pending assignments.

### 4. Exam List (`src/components/exams/exam-list.tsx`)
- Verified all required features already exist: countdown badges, urgency colors, type badges, MapPin location, seat numbers, hover effects. No changes needed.

## QA
- ESLint: 0 errors, 0 warnings
- Dev server: compiles successfully, all APIs return 200
- Priority colors correctly show red/amber/green
- Sidebar numbers animate smoothly on data changes
