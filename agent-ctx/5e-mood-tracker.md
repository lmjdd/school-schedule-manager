# Task 5e — 学习心情记录组件 (Mood Tracker)

## 完成时间
2025-06-15

## 任务描述
在 Dashboard 页面新增学习心情记录小部件，让用户每日跟踪学习状态和心情。

## 完成的工作

### 1. 新建 `src/components/dashboard/mood-tracker.tsx`
- **'use client'** 组件，使用 `didMount` ref + `requestAnimationFrame` 避免 SSR hydration 问题
- 5 种心情选项：🔥高效学习、😊状态不错、😐一般般、😫有点疲惫、😴需要休息
- 每种心情有独立的颜色主题（红/琥珀/灰/橙/紫）和 3 条激励消息
- 心情选择按钮带 framer-motion 动画（whileTap scale 0.88, whileHover scale 1.05, 选中 emoji 弹跳）
- 激励消息使用 AnimatePresence 切换动画
- 快速笔记 textarea（100 字符限制，实时字数统计，接近上限变琥珀色）
- 已选心情时笔记自动保存到 localStorage
- 连续记录天数 streak 指示器（>1 天时显示）
- 近 7 天心情历史水平条（今日高亮，无记录显示占位符）
- localStorage key: `edutrack-mood-history`，数据格式: `{ date, mood, note? }[]`

### 2. 修改 `src/components/dashboard/dashboard-page.tsx`
- 新增 `import { MoodTracker } from '@/components/dashboard/mood-tracker'`
- Row 3 从 `grid-cols-1 lg:grid-cols-2` 改为 `grid-cols-1 lg:grid-cols-3`
- MoodTracker 作为第三列，与 PomodoroTimer、WeeklyOverview 并排

## QA 结果
- ESLint: 零错误零警告
- Dev server: 编译成功，GET / 200
- 所有 API 正常响应

## 文件清单
- `src/components/dashboard/mood-tracker.tsx` — 新建
- `src/components/dashboard/dashboard-page.tsx` — 修改
