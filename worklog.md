# EduTrack Worklog

---

## Round 4 — QA + 4 项新功能 (2025-04-10)

### 项目当前状态
EduTrack 稳定运行，完成 14+ 个开发阶段。具备 8 个功能页面 + 全局搜索 + 通知提醒 + 番茄钟 + Markdown 笔记 + 考勤追踪 + 子任务清单 + 分屏编辑器 + 热力图等完整功能。本轮新增 4 项功能：仪表盘自定义、环境音效、成绩雷达图、移动端快捷按钮。

### QA 结果（agent-browser 自动化测试）
- ✅ Dashboard 正常（含热力图、环境音效按钮、仪表盘自定义⚙️）
- ✅ 课程管理正常（列表/课表/考勤 三个 Tab 均正常）
- ✅ 作业管理正常（含可展开子任务清单和进度条）
- ✅ 学习笔记正常
- ✅ 考试管理正常
- ✅ 学业统计正常（含雷达图 + GPA 计算器）
- ✅ 设置页面正常
- ✅ 深色模式正常
- ✅ ESLint 零错误零警告

### 新增功能

#### 1. 仪表盘 Widget 自定义 (Task 4d)
- ⚙️ 设置按钮打开 Popover，显示 9 个 Widget 的显示/隐藏开关
- 上移/下移箭头实现 Widget 排序
- "重置为默认布局"一键恢复
- Zustand persist 中间件持久化到 localStorage
- AnimatePresence + layout 动画实现平滑过渡
- 全部 Widget 隐藏时显示引导提示

#### 2. 番茄钟环境音效 (Task 4a)
- 5 种 Web Audio API 程序化生成音效：🌧️雨声、🌊海浪、☕咖啡厅、🔥壁炉、🎵白噪音
- 音量滑块 0-100% 实时调节
- 播放状态动画指示器
- localStorage 持久化音效和音量偏好
- SSR 水合安全（useSyncExternalStore）

#### 3. 学科成绩雷达图 (Task 4b)
- Recharts RadarChart 展示各科目 GPA 分布
- 支持 GPA 模式和分数模式切换
- 桌面端和移动端双图表渲染（不同尺寸优化）
- 自定义 Tooltip 显示课程名/分数/GPA/学分
- 最多显示 8 门课程，超出显示提示
- 与学期筛选器联动

#### 4. 移动端浮动快捷按钮 FAB (Task 4c)
- 56px 圆形主按钮（Plus 图标），展开时旋转为 X
- 3 个快捷操作：📝快速笔记、📋快速作业、✅完成打卡
- 弹出式迷你 Dialog 快速创建笔记/作业
- 一键为今日所有课程考勤打卡
- Framer Motion 弹簧动画 + 背景遮罩
- 仅移动端可见（md:hidden）

### 修改文件清单
| 文件 | 操作 |
|------|------|
| `src/components/dashboard/widget-customizer.tsx` | 新建 |
| `src/lib/ambient-sounds.ts` | 新建（Web Audio API 音效引擎） |
| `src/components/dashboard/ambient-sound-player.tsx` | 新建 |
| `src/components/statistics/grade-radar-chart.tsx` | 修改（响应式增强） |
| `src/components/layout/floating-action-button.tsx` | 新建 |
| `src/components/dashboard/dashboard-page.tsx` | 修改（动态 Widget 渲染） |
| `src/components/dashboard/pomodoro-timer.tsx` | 修改（集成环境音效） |
| `src/components/layout/app-shell.tsx` | 修改（集成 FAB） |
| `src/lib/store.ts` | 修改（Widget 布局状态） |

### 下一阶段建议
1. 学业报告一键生成（可导出 PDF/图片）
2. AI 智能学习建议 / 复习提醒
3. 数据导出为 Excel/CSV 格式
4. 科目间成绩对比雷达图增强（多学期叠加）
5. 移动端手势优化（左滑删除、下拉刷新）
6. 番茄钟统计历史图表（周/月维度）
7. 协作学习功能（分享笔记/课程表给同学）

---

## Round 3 — 环境修复 + QA + 4 项新功能 (2025-04-10)

### 项目当前状态
EduTrack 已完成 10+ 个开发阶段，具备 8 个功能页面 + 全局搜索 + 通知提醒 + 番茄钟 + Markdown 笔记等完整功能。本轮在环境变更（项目迁移至 /home/z/my-project，依赖需重新安装）后完成了全量 QA 和 4 项新功能开发。

### 环境修复
- 项目目录从 `/tmp/my-project`（PolarFS FUSE 文件系统）迁移至 `/home/z/my-project`（本地文件系统）
- 重新安装所有 npm 依赖（842 packages）
- 重新生成 Prisma Client 和 SQLite 数据库
- 修复 `.config` 文件冲突（root-owned JSON 文件阻止 Prisma 运行）

### QA 结果（agent-browser 自动化测试）
- ✅ Dashboard 页面正常渲染，所有组件（今日课程、GPA、番茄钟、时间线、每日总结）正常
- ✅ 课程管理：列表/课表视图正常
- ✅ 作业管理：筛选、批量操作、拖拽排序正常
- ✅ 学习笔记：CRUD、搜索、标签筛选正常
- ✅ 考试管理：倒计时、学习计划正常
- ✅ 学业统计：GPA 图表、学分统计、GPA 计算器正常
- ✅ 截图识别：上传界面正常
- ✅ 设置页面：数据管理、学期配置、通知设置正常
- ✅ 深色模式切换正常
- ✅ 全局搜索（Ctrl+K）正常
- ✅ 通知铃铛面板正常
- ✅ ESLint 零错误零警告

### 新增功能

#### 1. 课程考勤追踪系统 (Task 3a)
- 月历网格视图，颜色编码出勤状态（绿/红/琥珀/蓝/灰）
- 今日一键考勤打卡（出勤/缺勤/迟到/请假）
- 按课程筛选 + 出勤率统计 + 连续出勤天数
- 每课程进度条 + 编辑对话框
- API: `/api/attendance` (CRUD + 按日期/课程筛选)

#### 2. 笔记分屏 Markdown 编辑器 (Task 3b)
- 左右分屏布局：编辑器 + 实时预览
- 拖拽调整分屏比例 + 同步滚动
- 移动端：上下堆叠 + 编辑/预览 Tab 切换
- 模式切换（分屏/纯编辑）+ localStorage 持久化
- SSR 水合安全（useSyncExternalStore）

#### 3. GitHub 风格学习热力图 (Task 3c)
- 12 周（84 天）贡献热力图
- 5 级颜色强度（基于专注分钟数）
- 月份标签 + 星期标签 + 今日高亮
- 悬停 Tooltip + 学习天数/总时长/连续/最长连续统计
- 响应式设计（移动端缩小格子、隐藏星期标签）

#### 4. 作业子任务清单系统 (Task 3d)
- 可展开的子任务清单面板
- 内联添加（Enter 提交）+ 动画勾选框
- 悬停删除 + 进度条（X/Y）
- 完成项删除线 + 加载骨架屏
- API: `/api/subtasks` (CRUD + 自动排序)

### 修改文件清单
| 文件 | 操作 |
|------|------|
| `src/app/api/attendance/route.ts` | 新建 |
| `src/app/api/subtasks/route.ts` | 新建 |
| `src/components/courses/attendance-tracker.tsx` | 新建 |
| `src/components/courses/courses-page.tsx` | 修改（添加考勤 Tab） |
| `src/components/notes/markdown-split-editor.tsx` | 新建 |
| `src/components/notes/note-form-dialog.tsx` | 修改（集成分屏编辑器） |
| `src/components/notes/note-detail-dialog.tsx` | 修改（导出 renderMarkdown） |
| `src/components/notes/markdown-toolbar.tsx` | 修改（lint 修复） |
| `src/components/dashboard/study-heatmap.tsx` | 修改（响应式增强） |
| `src/components/assignments/subtask-checklist.tsx` | 新建 |
| `src/components/assignments/assignment-list.tsx` | 修改（集成子任务） |
| `src/app/api/assignments/route.ts` | 修改（嵌套子任务） |
| `src/app/api/seed/route.ts` | 修改（考勤+子任务种子数据） |
| `src/hooks/use-hydrated.ts` | 新建 |
| `src/lib/store.ts` | 修改（语法修复） |

### 技术架构更新
- **数据模型**: 新增 Attendance、Subtask（共 8 个 Prisma 模型）
- **API**: 11 个 RESTful API Routes（+attendance, +subtasks）
- **组件**: 新增 4 个主要功能组件

### 未解决问题
- FUSE 文件系统 I/O 性能问题（已通过迁移到本地文件系统解决）
- agent-browser 无法直接连接 localhost:3000（需通过 Caddy 代理 81 端口）

### 下一阶段建议
1. 学业报告一键生成（可导出）
2. 移动端手势优化（左滑删除、下拉刷新）
3. 番茄钟白噪音/背景音功能
4. 数据同步/备份到云端
5. 多用户支持（如果有需求）
6. 科目间成绩对比雷达图
7. AI 学习建议/智能复习提醒

---

## Task 3b: Split-View Markdown Editor for Notes Page

**Date**: 2025
**Agent**: Task 3b - Split-View Markdown Editor

### Summary
Added a Split-View Markdown Editor with Live Preview to the Notes page. The editor features a side-by-side pane layout with drag-to-resize, synchronized scrolling, and responsive mobile support.

### Files Created
1. **`src/hooks/use-hydrated.ts`** — SSR-safe hydration hook using `useSyncExternalStore` (avoids `setState` in effect lint error)
2. **`src/components/notes/markdown-split-editor.tsx`** — Full split-view markdown editor component

### Files Modified
1. **`src/components/notes/note-detail-dialog.tsx`** — Exported `renderMarkdown` function for reuse in the split editor's preview pane
2. **`src/components/notes/note-form-dialog.tsx`** — Replaced the simple `<Textarea>` + `<MarkdownToolbar>` with the new `<MarkdownSplitEditor>` component; widened dialog to `sm:max-w-4xl` to accommodate split view; removed unused `Textarea` import
3. **`src/lib/store.ts`** — Fixed pre-existing syntax error (interface properties accidentally placed in the store implementation object)

### Features Implemented
- **Split-pane layout**: Left = monospace editor (textarea + toolbar), Right = live markdown preview
- **Drag-to-resize divider**: 4px wide divider with mousedown handler, hover color change, `cursor: col-resize`
- **Sync scrolling**: Proportional scroll synchronization between editor and preview panes with debounce via `requestAnimationFrame`
- **Editor mode toggle**: Desktop button to switch between split-view and edit-only modes (Framer Motion animated)
- **Mobile support**: Vertically stacked layout with animated tab toggle (Edit/Preview) using Framer Motion `AnimatePresence`
- **LocalStorage persistence**: Editor mode saved to `edutrack-editor-mode`, split position saved to `edutrack-split-position`
- **SSR safety**: All localStorage reads use `useSyncExternalStore` with server snapshots (no hydration mismatch, no `setState` in effect)
- **Performance**: Position during drag uses in-memory cache (no localStorage writes per mousemove); persisted only on mouseup
- **Styling**: monospace font for editor, prose styling for preview, rounded container with border, Framer Motion transitions

### Technical Decisions
- Used `useSyncExternalStore` with module-level pub/sub for localStorage preferences instead of `useState` + `useEffect` to satisfy the `react-hooks/set-state-in-effect` lint rule in React 19
- Reused existing `MarkdownToolbar` component and exported `renderMarkdown` function from `note-detail-dialog.tsx` to avoid duplication
- In-memory cache (`positionCache`) for drag performance — avoids localStorage I/O on every mousemove

## Task 3c: Study Activity Heatmap for Dashboard

**Date**: 2025
**Agent**: Task 3c - Study Activity Heatmap

### Summary
Added a GitHub-style Study Activity Heatmap to the EduTrack Dashboard, displaying the last 12 weeks (84 days) of focus time data with interactive tooltips, animated cell transitions, and comprehensive study statistics.

### Files Modified
1. **`src/components/dashboard/study-heatmap.tsx`** — Enhanced with responsive mobile cell sizing, proper `useSyncExternalStore`-based responsive hook, and refined cell rendering

### Features Implemented
- **GitHub-style heatmap grid**: 84-day grid (12 weeks × 7 days), aligned to Monday start
- **5-level color intensity**: `bg-muted` → `bg-primary/15` → `bg-primary/30` → `bg-primary/50` → `bg-primary` based on focus minutes (0 / 1-15 / 16-45 / 46-90 / 90+)
- **Month labels**: Dynamically positioned above the grid columns
- **Day-of-week labels**: 一, 三, 五 shown on desktop; hidden on mobile
- **Interactive tooltip**: AnimatePresence-powered tooltip showing date (e.g., "6月15日 周日") and focus time on hover
- **Stats row**: 4 mini stat cards — study days, cumulative hours/minutes, current streak, longest streak
- **Animated numbers**: All statistics use `useSpring` for smooth count-up animation
- **Cell stagger animation**: Cells fade in with scale+opacity stagger (0.003s per cell)
- **Today highlight**: Current day cell has a ring indicator
- **Responsive design**: Mobile cells are 10×10px (vs 12×12px desktop); day labels hidden on mobile; legend visible on all sizes
- **SSR hydration safety**: Empty state on server, localStorage read in `useEffect` after mount via `requestAnimationFrame`
- **Live polling**: Checks for updated pomodoro focus time every 5 seconds and merges into history
- **Demo data generation**: If no history exists, generates realistic weighted random study data across 12 weeks
- **Notion-card styling**: Consistent with dashboard card design language

### Technical Decisions
- Used `useSyncExternalStore` with `window.matchMedia('(min-width: 768px)')` for responsive breakpoint detection to avoid `useState`+`useEffect` lint issues
- Column offset calculation dynamically adjusts between 12px (mobile, 10px cell + 2px gap) and 14px (desktop, 12px cell + 2px gap) for accurate month label positioning
- Empty spacer cells match the responsive cell size to maintain grid alignment
- Data reads from both `edutrack-focus-history` (primary) and `edutrack-pomodoro-focus-time` / `edutrack-pomodoro-state` (fallback) for maximum compatibility

## Task 3a: Course Attendance Tracking

**Date**: 2025
**Agent**: Task 3a - Course Attendance Tracking

### Summary
Added a comprehensive Course Attendance Tracking feature to the Courses page, including a monthly calendar grid with color-coded status indicators, quick attendance buttons for today's courses, per-course statistics, and a full CRUD API for attendance records.

### Files Created
1. **`src/app/api/attendance/route.ts`** — RESTful API route with GET (filtered by courseId/dateFrom/dateTo), POST (create/upsert), PUT (update), DELETE operations
2. **`src/components/courses/attendance-tracker.tsx`** — Full attendance tracker component with calendar grid, quick attendance, statistics, and edit dialog

### Files Modified
1. **`src/components/courses/courses-page.tsx`** — Added "考勤" (Attendance) tab to the view toggle with `ClipboardCheck` icon; wrapped content in `AnimatePresence mode="wait"` for smooth view transitions; imported `AttendanceTracker` component
2. **`src/app/api/seed/route.ts`** — Added attendance seed data generation: creates ~3 weeks of sample attendance records (past 21 weekdays), randomly distributed across `present`/`late`/`absent`/`leave` statuses, with contextual notes for non-present statuses

### Features Implemented
- **Monthly calendar grid**: Full month calendar showing attendance status per day with color-coded icons (green=出勤, red=缺勤, amber=迟到, blue=请假, gray=无记录)
- **Course filter**: Select dropdown to filter calendar by specific course or view all courses
- **Multi-record indicators**: When multiple courses have records on the same day, colored dots are shown
- **Quick attendance for today**: One-click attendance buttons for all courses on the current day, with active state highlighting
- **Statistics summary cards**: Attendance rate, consecutive attendance streak, total records, absent/leave counts
- **Per-course attendance rate**: Animated progress bars showing individual course attendance percentages when viewing all courses
- **Edit dialog**: Click any calendar record to edit status and add notes; includes delete option
- **Upsert logic**: POSTing the same course+date combination updates the existing record instead of creating duplicates
- **Responsive design**: Mobile-friendly layout with compact quick attendance buttons, scrollable course list
- **Framer Motion animations**: Staggered entrance animations, spring-animated status icons, animated progress bars
- **Notion-card styling**: Consistent with the existing EduTrack design language using border/40, muted backgrounds, and shadcn/ui components

### Pre-existing Infrastructure Used
- `Attendance` model in Prisma schema (already defined with courseId, date, status, note fields)
- `Attendance` type, `ATTENDANCE_STATUS`, `ATTENDANCE_STATUS_LABELS`, `ATTENDANCE_STATUS_COLORS` in `src/lib/types.ts`
- `courseView: 'list' | 'schedule' | 'attendance'` in Zustand store (`src/lib/store.ts`)

### Technical Decisions
- Removed `useCallback` wrappers for event handlers to satisfy the React Compiler's `react-hooks/preserve-manual-memoization` lint rule — the React Compiler handles memoization automatically
- Calendar grid uses ISO date strings (YYYY-MM-DD) for consistent date comparisons
- Seed data generates records only for weekdays matching each course's scheduled day-of-week
- Batch creation (50 records per batch) in seed to avoid overwhelming SQLite with concurrent writes
- Attendance rate counts both `present` and `late` as "attended" (common academic convention)

## Task 3d: Assignment Subtask/Checklist System

**Date**: 2025
**Agent**: Task 3d - Assignment Subtask/Checklist System

### Summary
Added a comprehensive Subtask/Checklist system to the Assignments page, enabling users to break down assignments into smaller trackable steps with inline add, animated checkbox toggling, delete-on-hover, progress bars, and an expandable checklist panel within each assignment card.

### Files Created
1. **`src/app/api/subtasks/route.ts`** — RESTful API route with GET (list by assignmentId), POST (create with auto-order), PUT (toggle/edit/reorder), DELETE operations
2. **`src/components/assignments/subtask-checklist.tsx`** — Self-contained SubtaskChecklist component with progress bar, inline add input, animated checkboxes, delete-on-hover, and SubtaskProgressBadge

### Files Modified
1. **`src/app/api/assignments/route.ts`** — Enhanced GET to include subtasks in the response (with graceful fallback if Prisma client is stale)
2. **`src/components/assignments/assignment-list.tsx`** — Added expandable subtask panel to each assignment card with chevron toggle, SubtaskProgressBadge, and SubtaskChecklist integration; added `expandedIds` state management for expand/collapse
3. **`src/app/api/seed/route.ts`** — Added subtask seed data for all 6 assignments with realistic Chinese task descriptions; added safety check for stale Prisma client

### Features Implemented
- **Expandable checklist panel**: Click any assignment card or chevron icon to expand/collapse the subtask checklist below it
- **Animated chevron**: Framer Motion rotation animation (-90° collapsed → 0° expanded)
- **SubtaskProgressBadge**: Shows "X/Y" completion count on each assignment card; fetches from API independently when subtasks aren't embedded in assignment data
- **Progress bar**: Thin animated progress bar (primary color for partial, emerald for complete) with "X/Y" label
- **Inline add input**: Dashed-border placeholder input below checklist; Enter to submit; auto-focus; clear button
- **Animated checkbox**: Framer Motion scale animation on toggle; emerald background for completed; hover border for incomplete
- **Delete on hover**: Trash2 icon appears on subtask row hover; click to delete with optimistic feedback
- **Line-through completed**: Completed subtasks show strikethrough text with muted color
- **Empty state**: Shows "拆分任务为更小的步骤" hint when no subtasks exist
- **Loading skeleton**: Shows animated skeleton items while fetching subtasks
- **Auto-order**: New subtasks automatically get the next order value (max existing + 1)
- **Self-contained data fetching**: SubtaskChecklist fetches its own data via TanStack Query, independent of parent assignment data
- **Responsive design**: Checklist indented to align with card content on both mobile and desktop
- **Notion-card styling**: Consistent with existing EduTrack design language

### Technical Decisions
- SubtaskChecklist uses its own TanStack Query (`['subtasks', assignmentId]`) for independent data fetching, so the feature works even when the assignments API uses the fallback (without embedded subtasks)
- SubtaskProgressBadge has a dual mode: uses embedded subtasks data when available, falls back to fetching from API for the progress count
- Assignments API includes a try/catch fallback to serve data without subtasks when the Prisma client hasn't been regenerated
- Seed data uses direct DB script for reliable seeding regardless of server Prisma client state
- All mutations invalidate both `['subtasks', id]` and `['assignments']` query keys for consistent UI updates

## Task 4a: Ambient Sound Player for Pomodoro Timer

**Date**: 2025
**Agent**: Task 4a - Ambient Sound Player

### Summary
Added a Web Audio API-based Ambient Sound Player to the EduTrack Pomodoro Timer. Users can select from 5 programmatically generated ambient sounds to enhance focus sessions, with volume control and localStorage persistence.

### Files Modified
1. **`src/lib/ambient-sounds.ts`** — Rewrote sound engine to match spec: replaced 6 sounds (rain, ocean, forest, coffee, fireplace, lofi) with 5 specified sounds (rain, ocean, coffee, fireplace, white noise). Removed `createForest` and `createLofi` generators, added `createWhiteNoise` (plain white noise buffer). All sounds use AudioContext + createBufferSource + BiquadFilterNode + GainNode with 2-second looped noise buffers.
2. **`src/components/dashboard/ambient-sound-player.tsx`** — Fixed React 19 lint error (`react-hooks/set-state-in-effect`) by replacing `useState` + `useEffect` localStorage read pattern with `useSyncExternalStore` for volume initialization. Volume state is now sourced directly from localStorage via a subscription-based store, avoiding synchronous setState in effects. Active sound persistence uses dedicated `saveActiveSoundToStorage` helper.
3. **`src/components/dashboard/pomodoro-timer.tsx`** — Integrated `AmbientSoundPlayer` component below the timer controls section, within the timer card. Added import for `AmbientSoundPlayer`.

### Features Implemented
- **5 ambient sounds using Web Audio API** (no external files):
  - 🌧️ Rain: white noise → low-pass filter (cutoff 400Hz) + high-frequency raindrop layer
  - 🌊 Ocean: brown noise → low-pass filter + LFO-modulated gain (0.1Hz wave effect) + periodic whoosh
  - ☕ Coffee shop: brown noise → bandpass filter (200-2000Hz) + pink noise chatter layer + murmur amplitude modulation
  - 🔥 Fireplace: brown noise → bandpass filter + random gain spike crackling (amplitude modulation) + low rumble layer
  - 🎵 White noise: plain white noise buffer (2-second loop)
- **Compact toggle button**: Speaker icon with animated sound wave bars when playing (Framer Motion)
- **Popover sound selector**: 3-column grid of sound options with active indicator (emerald ring + dot)
- **Volume slider**: 0-100% range with real-time display and Web Audio API gain control
- **Stop button**: Appears when sound is playing, stops all audio and cleans up resources
- **localStorage persistence** (key: `edutrack-ambient-sound`): Saves active sound type and volume preference
- **Hydration safety**: Uses `useHydrated()` hook + `useSyncExternalStore` with server snapshot for SSR compatibility

### Technical Decisions
- Used `useSyncExternalStore` with a custom subscription model (`volumeVersion` counter + `volumeListeners` Set) to read persisted volume from localStorage without calling `setState` in a `useEffect`, satisfying the React 19 compiler's `react-hooks/set-state-in-effect` lint rule
- Volume writes go through `setVolumeAndNotify()` which updates localStorage and manually notifies all subscribers (since the `storage` event only fires for cross-tab changes, not same-window)
- Each sound generator creates its own `AudioContext` and manages cleanup via `stopSound()` which clears intervals, stops sources/oscillators, and closes the context
- Sound options reduced from 6 to 5 to match the task specification exactly

## Task 4d: Dashboard Widget Customization (Show/Hide/Reorder)

**Date**: 2025
**Agent**: Task 4d - Widget Customization

### Summary
Added comprehensive dashboard widget customization to the EduTrack Dashboard, enabling users to show/hide and reorder 9 dashboard widgets via a settings popover. State is persisted to localStorage via Zustand persist middleware with SSR-safe hydration.

### Files Created
1. **`src/components/dashboard/widget-customizer.tsx`** — WidgetCustomizer component with Popover UI, toggle switches, up/down reorder buttons, and reset action

### Files Modified
1. **`src/lib/store.ts`** — Added `WIDGET_IDS` constant array, `WidgetId` type, `WIDGET_META` label/icon map, and `useWidgetLayoutStore` with `persist` middleware (localStorage key: `edutrack-widget-layout`)
2. **`src/components/dashboard/dashboard-page.tsx`** — Replaced static widget layout with dynamic rendering from `widgetOrder`/`hiddenWidgets` store state; added page header with WidgetCustomizer button; added AnimatePresence + layout animations; added "all widgets hidden" empty state

### Features Implemented

#### Widget Layout Store (`useWidgetLayoutStore`)
- **9 widget IDs defined**: `WELCOME_BANNER`, `WEEKLY_OVERVIEW`, `TODAY_COURSES`, `UPCOMING_DEADLINES`, `POMODORO_TIMER`, `FOCUS_CHART`, `ASSIGNMENT_TIMELINE`, `DAILY_SUMMARY`, `STUDY_HEATMAP`
- **Widget metadata map**: Each widget has a Chinese label and emoji icon
- **Persisted to localStorage** via Zustand `persist` middleware (`edutrack-widget-layout`)
- **SSR safety**: `useHydrated()` hook gates store reads; before hydration, defaults are used to prevent flash
- **Actions**: `setWidgetOrder` (full reorder), `toggleWidgetVisibility` (show/hide), `resetWidgetLayout` (restore defaults)

#### WidgetCustomizer Component
- **Settings gear icon** button in dashboard header area
- **Popover UI** (300px wide, compact design):
  - Header with title, subtitle, and visible count badge (e.g. "7/9")
  - Scrollable widget list (max-height 320px) with each item showing: grip handle icon + emoji + Chinese label + up/down arrows (on hover) + toggle Switch
  - "重置为默认布局" (Reset to default) button in footer
- **Reorder**: Simple up/down arrow buttons appear on hover per widget row; disabled at first/last positions
- **Toggle visibility**: Switch per widget; hidden widgets shown with strikethrough text + reduced opacity
- **Immediate effect**: No save button needed — all changes apply instantly via Zustand

#### Dashboard Page Integration
- **Page header**: Added "仪表盘" title + `<WidgetCustomizer />` button in a flex row
- **Non-customizable elements** remain always visible: DailyQuote, WeeklyOverviewStrip, DashboardFooter, GPACard, QuickActions
- **Customizable widgets** rendered dynamically from `widgetOrder`, filtered by `hiddenWidgets`
- **AnimatePresence mode="popLayout"** wraps widget list for smooth show/hide/reorder transitions
- **motion.div with layout="position"** on each widget for animated position swaps
- **"All hidden" state**: Centered empty state with ⚙️ emoji + "点击 ⚙️ 自定义仪表盘" hint text
- **WelcomeBanner**: Conditionally renders only when no courses exist (preserves existing behavior)

### Technical Decisions
- Used Zustand `persist` middleware instead of raw localStorage + `useSyncExternalStore` since the widget layout store is entirely client-side state with no server rendering needs; the `useHydrated()` guard prevents hydration mismatch
- `layout="position"` used instead of full `layout` to only animate position changes (not size), reducing layout thrashing during reorder
- `mode="popLayout"` on AnimatePresence ensures correct exit animations when widgets are hidden/shown
- WidgetCustomizer stores `order` and `hidden` as local variables derived from store + hydration check, so the popover content is stable during SSR
- Dashboard widgets that were previously in grid rows (TodayCourses+UpcomingDeadlines, PomodoroTimer+WeeklyOverview+FocusHistoryChart) are now individually rendered as full-width items to support arbitrary user-defined ordering
- GPACard and QuickActions remain outside the customizable widget list as they provide core navigation/utility functions

## Task 4b: Subject Grade Radar Chart for Statistics Page

**Date**: 2025
**Agent**: Task 4b - Grade Radar Chart

### Summary
Enhanced the existing GradeRadarChart component on the Statistics page with course limiting (top 8), proper `fullMark` data field, dedicated mobile responsive layout, improved tooltip rendering, and an overflow indicator when more courses exist than the radar can display.

### Files Modified
1. **`src/components/statistics/grade-radar-chart.tsx`** — Comprehensive enhancement of the radar chart component

### Features Implemented

#### Course Limiting & Data Structure
- **Top 8 course limit** (`MAX_SUBJECTS = 8`): Radar displays at most 8 subjects to maintain readability; excess courses shown via an info indicator ("显示前 8 门")
- **`fullMark: 4.0`** added to every radar data point as specified in the data contract
- **Typed `RadarDataPoint` interface** for strict TypeScript typing of all radar data fields

#### Responsive Design
- **Dual chart rendering**: Separate desktop (`h-[320px]`, ≥sm breakpoint) and mobile (`h-[260px]`, <sm) RadarChart instances using Tailwind `hidden sm:block` / `block sm:hidden`
- **Mobile-optimized labels**: Shorter label truncation on mobile (4 chars vs 6 chars desktop) via separate `mobileRadarData` with `LABEL_MAX_MOBILE = 4`
- **Mobile-optimized typography**: Smaller font sizes on mobile (`fontSize: 9` labels, `fontSize: 8` ticks vs desktop 11/9)
- **Mobile-optimized geometry**: Smaller `outerRadius` (70% vs 75%), smaller dots (r: 3 vs 4), smaller gradient opacity
- **Unique gradient IDs**: Desktop uses `#radarFillGradient`, mobile uses `#radarFillGradientMobile` to prevent SVG ID conflicts

#### Custom Tooltip
- **Extracted `renderTooltipContent` function** for reuse across both desktop and mobile chart instances
- **Typed tooltip payload** using `RadarDataPoint` interface for full type safety
- Displays: full subject name, latest score, latest GPA, credit, grade count, and computed average

#### Empty States
- **No data**: Rose/pink gradient float icon with "暂无成绩数据" message
- **Insufficient data** (< 3 courses): Amber/orange gradient float icon with "至少需要 3 门课程" message showing current count

#### Overflow Indicator
- **Info badge** appears next to mode label when courses exceed `MAX_SUBJECTS`, showing "显示前 8 门" with an `Info` icon
- **Total count** always displayed: "共 N 门课程"

### Integration
- Already integrated in `statistics-page.tsx` (line 21 import, line 243 render)
- Receives `semester: string | null` prop from parent semester filter tabs
- When semester is `null`, averages grades per course across all semesters
- When semester is set, filters to that semester only

### Technical Decisions
- Used separate `hidden sm:block` / `block sm:hidden` divs with unique gradient IDs instead of a single responsive chart to avoid SVG gradient ID conflicts when both charts are in the DOM during breakpoint transitions
- `fullMark` field added to data items for Recharts data contract compliance, while `PolarRadiusAxis domain` is still used for axis scaling (more reliable than per-item `fullMark`)
- Label truncation happens in `useMemo` to avoid re-computation on every render
- Desktop labels truncated to 6 chars, mobile to 4 chars, for optimal readability at each viewport size

### Lint Results
- `grade-radar-chart.tsx`: ✅ Zero errors, zero warnings
- Pre-existing lint error in `ambient-sound-player.tsx` is unrelated to this task

## Task 4c: Floating Action Button (FAB) for Mobile Quick Entry

**Date**: 2025
**Agent**: Task 4c - Floating Action Button

### Summary
Added a mobile-only Floating Action Button (FAB) with speed-dial menu to EduTrack for quick data entry. The FAB provides three quick actions: Quick Note, Quick Assignment, and Course Check-in, all accessible from a single animated button anchored above the mobile navigation bar.

### Files Created
1. **`src/components/layout/floating-action-button.tsx`** — Complete FAB component with speed-dial menu, Quick Note dialog, Quick Assignment dialog, and Check-in action

### Files Modified
1. **`src/components/layout/app-shell.tsx`** — Imported and rendered `FloatingActionButton` conditionally when `isMobile` is true

### Features Implemented

#### Floating Action Button (FAB)
- **Mobile-only visibility**: Wrapped in `md:hidden` container; hidden on tablets and desktop
- **Fixed positioning**: `fixed bottom-24 right-4` — positioned above the mobile bottom nav bar
- **56px circular primary button**: `w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl`
- **Plus to X rotation**: Icon rotates +45 degrees when expanded using Framer Motion spring animation
- **Hover/tap feedback**: `whileHover={{ scale: 1.05 }}`, `whileTap={{ scale: 0.95 }}`
- **Accessibility**: `aria-label`, `aria-expanded` attributes

#### Speed-Dial Menu
- **3 sub-buttons fanning upward** with staggered spring animations:
  1. Quick Note (amber-themed) — opens Quick Note dialog
  2. Quick Assignment (emerald-themed) — opens Quick Assignment dialog
  3. Check-in (primary-themed) — triggers attendance check-in
- **44px circular sub-buttons**: `w-11 h-11 rounded-full bg-card shadow-lg border`
- **Labels to the left**: `text-xs` labels with `bg-background/90 backdrop-blur-sm`
- **Backdrop overlay**: `bg-black/20` closes menu on click; Framer Motion fade in/out
- **Spring animations**: `stiffness: 350, damping: 25` with 60ms stagger between items
- **Active scale feedback**: `active:scale-95` on sub-buttons

#### Quick Note Dialog
- **Minimal shadcn/ui Dialog** with title input + content textarea + save/cancel buttons
- **POST /api/notes** with `{ title, content }` on save
- **Toast feedback**: Success ("笔记已保存") or error messages via sonner
- **Auto-close on save**: Dialog closes and form resets after successful creation
- **Loading state**: Loader2 spinner on save button during API call
- **Validation**: Requires non-empty title

#### Quick Assignment Dialog
- **Minimal shadcn/ui Dialog** with title input + course Select + due date Calendar + save/cancel buttons
- **Course data**: Fetches from `/api/courses` on dialog open; deduplicates by course name
- **Due date picker**: shadcn/ui Popover + Calendar for optional date selection
- **POST /api/assignments** with `{ title, courseId, dueDate }` on save
- **Toast feedback**: Success ("作业已创建") or error messages via sonner
- **Auto-close on save**: Dialog closes and form resets after successful creation
- **Loading state**: Loader2 spinner during course fetch and save operations

#### Check-in Action
- **GET /api/courses** to fetch all courses
- **Filters by dayOfWeek**: Matches current day (`new Date().getDay()`) against course `dayOfWeek`
- **POST /api/attendance** for each matching course with `{ courseId, date: todayISO, status: "present" }`
- **Upsert-safe**: Attendance API updates existing records instead of creating duplicates
- **Toast feedback**: "已为 X 门课程打卡" on success; "今天没有课程需要打卡" if no courses match
- **Loading indicator**: Loader2 spinner replaces CheckCircle2 icon during check-in
- **Parallel execution**: Uses `Promise.all` for concurrent attendance POST requests

### Technical Decisions
- Used Framer Motion for all animations (spring expand, stagger sub-buttons, backdrop fade, icon rotation)
- Sub-buttons use native `<button>` elements for maximum styling control while maintaining accessibility
- Course deduplication by name in assignment dialog prevents confusing duplicate entries
- All API calls use relative paths (`/api/...`) for gateway compatibility
- Dialog opening automatically closes the FAB menu via `useEffect` watching dialog open state
- Form reset on cancel/close prevents stale data on next open

### Lint Results
- All files: zero errors, zero warnings
