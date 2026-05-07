'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Database, BookOpen, ClipboardList, GraduationCap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, calculateGPA } from '@/lib/helpers';
import type { Grade } from '@/lib/types';
import { useAppStore, useWidgetLayoutStore, WIDGET_IDS, type WidgetId } from '@/lib/store';
import { useHydrated } from '@/hooks/use-hydrated';
import { WidgetCustomizer } from '@/components/dashboard/widget-customizer';
import { DailyQuote } from '@/components/dashboard/daily-quote';
import { TodayCourses } from '@/components/dashboard/today-courses';
import { UpcomingDeadlines } from '@/components/dashboard/upcoming-deadlines';
import { GPACard } from '@/components/dashboard/gpa-card';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { PomodoroTimer } from '@/components/dashboard/pomodoro-timer';
import { AssignmentTimeline } from '@/components/dashboard/assignment-timeline';
import { DailySummary } from '@/components/dashboard/daily-summary';
import { WeeklyOverviewStrip } from '@/components/dashboard/weekly-overview';
import { FocusHistoryChart } from '@/components/dashboard/focus-history-chart';
import { StudyHeatmap } from '@/components/dashboard/study-heatmap';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

async function fetchCourses(): Promise<any[]> {
  const res = await fetch('/api/courses');
  if (!res.ok) return [];
  return res.json();
}

async function fetchAssignments(): Promise<any[]> {
  const res = await fetch('/api/assignments');
  if (!res.ok) return [];
  return res.json();
}

async function fetchExams(): Promise<any[]> {
  const res = await fetch('/api/exams');
  if (!res.ok) return [];
  return res.json();
}

async function fetchGrades(): Promise<Grade[]> {
  const res = await fetch('/api/grades');
  if (!res.ok) return [];
  return res.json();
}

function getWeekBounds(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

function WelcomeBanner() {
  const { setCurrentPage } = useAppStore();
  const queryClient = useQueryClient();
  const [isSeeding, setIsSeeding] = React.useState(false);

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('示例数据已填充', {
          description: `已添加 ${data.counts.courses} 门课程、${data.counts.assignments} 个作业、${data.counts.exams} 场考试、${data.counts.grades} 条成绩`,
        });
        // Invalidate all queries to refresh data
        await queryClient.invalidateQueries();
      } else {
        toast.warning(data.message || '填充失败');
      }
    } catch {
      toast.error('填充失败，请稍后重试');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-lg border border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-cyan-950/40 p-5 md:p-6"
    >
      {/* Subtle decorative circles */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-emerald-200/40 dark:bg-emerald-800/20 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-teal-200/30 dark:bg-teal-800/20 translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">✨</span>
          <h2 className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
            欢迎使用 EduTrack
          </h2>
        </div>
        <p className="text-sm text-emerald-700/80 dark:text-emerald-300/70 mb-4 leading-relaxed max-w-lg">
          开始添加你的课程数据，或一键填充示例数据快速体验
        </p>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentPage('courses')}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-medium px-3.5 py-2 transition-colors duration-150 shadow-sm"
          >
            <Plus className="size-3.5" />
            添加课程
          </button>
          <button
            onClick={handleSeedData}
            disabled={isSeeding}
            className="inline-flex items-center gap-1.5 rounded-md bg-white dark:bg-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/70 text-emerald-700 dark:text-emerald-300 text-xs font-medium px-3.5 py-2 transition-colors duration-150 border border-emerald-200 dark:border-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Database className="size-3.5" />
            {isSeeding ? '填充中...' : '填充示例数据'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function WeeklyOverviewSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-lg shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-6 w-10 rounded" />
        </div>
      ))}
    </div>
  );
}

function WeeklyOverview() {
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: fetchAssignments,
  });
  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: fetchExams,
  });

  const isLoading = coursesLoading || assignmentsLoading || examsLoading;

  const stats = useMemo(() => {
    const { start, end } = getWeekBounds();

    // Count unique courses that have at least one session this week
    const weekCourses = courses.filter((c: any) => c.dayOfWeek >= 1 && c.dayOfWeek <= 7);

    // Pending assignments due this week
    const weekAssignments = assignments.filter((a: any) => {
      if (!a.dueDate || a.status === 'completed') return false;
      const due = new Date(a.dueDate).getTime();
      return due >= start.getTime() && due <= end.getTime();
    });

    // Exams this week
    const weekExams = exams.filter((e: any) => {
      const examDate = new Date(e.date).getTime();
      return examDate >= start.getTime() && examDate <= end.getTime();
    });

    return {
      coursesCount: weekCourses.length,
      pendingAssignments: weekAssignments.length,
      examsCount: weekExams.length,
    };
  }, [courses, assignments, exams]);

  const statItems = [
    {
      icon: <BookOpen className="size-4 text-blue-500" />,
      label: '本周课程数',
      value: stats.coursesCount,
      sub: `${stats.coursesCount} 门课程`,
      bg: 'bg-blue-50 dark:bg-blue-950/40',
    },
    {
      icon: <ClipboardList className="size-4 text-amber-500" />,
      label: '本周待交',
      value: stats.pendingAssignments,
      sub: `${stats.pendingAssignments} 项待完成`,
      bg: 'bg-amber-50 dark:bg-amber-950/40',
    },
    {
      icon: <GraduationCap className="size-4 text-rose-500" />,
      label: '本周考试',
      value: stats.examsCount,
      sub: `${stats.examsCount} 场考试`,
      bg: 'bg-rose-50 dark:bg-rose-950/40',
    },
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="rounded-lg bg-card border border-border/60 p-5 md:p-6 notion-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span>📈</span>
          <span>本周概览</span>
        </h3>
      </div>

      {/* Content */}
      {isLoading ? (
        <WeeklyOverviewSkeleton />
      ) : (
        <div className="space-y-3">
          {statItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.06, ease: 'easeOut' }}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/40 transition-colors"
            >
              <div className={cn('size-8 rounded-lg flex items-center justify-center shrink-0', item.bg)}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium text-foreground tabular-nums">{item.sub}</p>
              </div>
              <div className={cn(
                'text-lg font-bold font-mono tabular-nums',
                item.value > 0 ? 'text-foreground' : 'text-muted-foreground/50'
              )}>
                {item.value}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function DashboardFooter() {
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });
  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments'],
    queryFn: fetchAssignments,
  });
  const { data: grades = [] } = useQuery({
    queryKey: ['grades'],
    queryFn: fetchGrades,
  });

  const courseCount = courses.length;

  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter((a: any) => a.status === 'completed').length;
  const completionRate = totalAssignments > 0
    ? Math.round((completedAssignments / totalAssignments) * 100)
    : 0;

  const gpa = calculateGPA(grades);
  const statusLabel = gpa >= 3.7 ? '优秀' : gpa >= 3.0 ? '良好' : gpa > 0 ? '加油' : '—';

  return (
    <div className="relative border-t border-border/60 pt-4 pb-1">
      {/* Gradient divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span>📚</span>
          学期进度：<span className="font-medium tabular-nums text-foreground">{courseCount}</span> 门课程
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span>✅</span>
          作业完成率：<span className="font-medium tabular-nums text-foreground">{completionRate}%</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span>🏆</span>
          学业状态：<span className="font-medium text-foreground">{statusLabel}</span>
        </span>
      </div>
    </div>
  );
}

/** Render a single widget by its ID. Returns null for conditional widgets. */
function renderWidget(widgetId: WidgetId, isEmpty: boolean): React.ReactNode {
  switch (widgetId) {
    case 'WELCOME_BANNER':
      return isEmpty ? <WelcomeBanner /> : null;
    case 'WEEKLY_OVERVIEW':
      return <WeeklyOverview />;
    case 'TODAY_COURSES':
      return <TodayCourses />;
    case 'UPCOMING_DEADLINES':
      return <UpcomingDeadlines />;
    case 'POMODORO_TIMER':
      return <PomodoroTimer />;
    case 'FOCUS_CHART':
      return <FocusHistoryChart />;
    case 'ASSIGNMENT_TIMELINE':
      return <AssignmentTimeline />;
    case 'DAILY_SUMMARY':
      return <DailySummary />;
    case 'STUDY_HEATMAP':
      return <StudyHeatmap />;
    default:
      return null;
  }
}

export function DashboardPage() {
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  const isEmpty = !coursesLoading && courses.length === 0;

  // Widget layout state from persisted store
  const hydrated = useHydrated();
  const widgetOrder = useWidgetLayoutStore((s) => s.widgetOrder);
  const hiddenWidgets = useWidgetLayoutStore((s) => s.hiddenWidgets);

  // Use defaults before hydration to avoid flash
  const order = hydrated ? widgetOrder : [...WIDGET_IDS];
  const hidden = hydrated ? hiddenWidgets : [];

  // Filter to visible widgets only
  const visibleWidgets = order.filter((id) => !hidden.includes(id));
  const allHidden = visibleWidgets.length === 0;

  return (
    <div className="space-y-5">
      {/* Page header with customizer button */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">仪表盘</h1>
        <WidgetCustomizer />
      </div>

      {/* Thin accent top border when has data */}
      {!isEmpty && (
        <div className="h-[2px] rounded-full bg-gradient-to-r from-chart-1/40 via-chart-3/60 to-chart-2/40" />
      )}

      {/* Daily quote (always visible, not customizable) */}
      <DailyQuote />

      {/* Weekly Calendar Strip (always visible, not customizable) */}
      <WeeklyOverviewStrip />

      {/* Customizable widgets in stored order */}
      <AnimatePresence mode="popLayout">
        {visibleWidgets.map((widgetId) => {
          const content = renderWidget(widgetId, isEmpty);
          // Skip null content (e.g. WELCOME_BANNER when not empty)
          if (!content) return null;
          return (
            <motion.div
              key={widgetId}
              layout="position"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {content}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Empty state when all widgets are hidden */}
      {allHidden && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex flex-col items-center justify-center py-20 text-muted-foreground"
        >
          <span className="text-4xl mb-3">⚙️</span>
          <p className="text-sm font-medium">点击 ⚙️ 自定义仪表盘</p>
          <p className="text-xs mt-1 text-muted-foreground/60">显示或重新排列你的小组件</p>
        </motion.div>
      )}

      {/* Footer with motivational stats (always visible) */}
      <DashboardFooter />
    </div>
  );
}
