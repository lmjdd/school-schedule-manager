'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Clock, MapPin, Armchair, Calendar, ChevronDown,
  ChevronUp, Timer, BookOpen, Target, Zap, TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { getDaysUntil, formatDate, cn } from '@/lib/helpers';
import type { Exam } from '@/lib/types';
import { StudyPlanGenerator } from '@/components/exams/study-plan-generator';

async function fetchExams(): Promise<Exam[]> {
  const res = await fetch('/api/exams');
  if (!res.ok) throw new Error('Failed to fetch exams');
  return res.json();
}

const EXAM_TYPE_COLORS: Record<string, string> = {
  '期中考试': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40',
  '期末考试': 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40',
  '随堂测验': 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800/40',
  '模拟考试': 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800/40',
};

const EXAM_TYPE_DOT_COLORS: Record<string, string> = {
  '期中考试': 'bg-amber-500',
  '期末考试': 'bg-red-500',
  '随堂测验': 'bg-sky-500',
  '模拟考试': 'bg-violet-500',
};

interface UrgencyConfig {
  label: string;
  bg: string;
  border: string;
  text: string;
  numberBg: string;
  numberText: string;
  progressColor: string;
  glowClass: string;
}

const URGENCY_CONFIG: Record<string, UrgencyConfig> = {
  critical: {
    label: '紧急',
    bg: 'bg-gradient-to-br from-red-50/80 to-rose-50/50 dark:from-red-950/30 dark:to-rose-950/15',
    border: 'border-red-200/70 dark:border-red-800/50',
    text: 'text-red-600 dark:text-red-400',
    numberBg: 'bg-red-100 dark:bg-red-900/40',
    numberText: 'text-red-700 dark:text-red-300',
    progressColor: '[&_[data-slot=progress-indicator]]:bg-red-500',
    glowClass: 'shadow-red-100/50 dark:shadow-red-950/30',
  },
  warning: {
    label: '临近',
    bg: 'bg-gradient-to-br from-amber-50/70 to-yellow-50/40 dark:from-amber-950/20 dark:to-yellow-950/10',
    border: 'border-amber-200/60 dark:border-amber-800/40',
    text: 'text-amber-600 dark:text-amber-400',
    numberBg: 'bg-amber-100 dark:bg-amber-900/40',
    numberText: 'text-amber-700 dark:text-amber-300',
    progressColor: '[&_[data-slot=progress-indicator]]:bg-amber-500',
    glowClass: 'shadow-amber-100/50 dark:shadow-amber-950/30',
  },
  caution: {
    label: '一般',
    bg: 'bg-gradient-to-br from-orange-50/50 to-orange-50/20 dark:from-orange-950/15 dark:to-orange-950/5',
    border: 'border-orange-200/50 dark:border-orange-800/30',
    text: 'text-orange-600 dark:text-orange-400',
    numberBg: 'bg-orange-100 dark:bg-orange-900/40',
    numberText: 'text-orange-700 dark:text-orange-300',
    progressColor: '[&_[data-slot=progress-indicator]]:bg-orange-500',
    glowClass: 'shadow-orange-100/30 dark:shadow-orange-950/20',
  },
  safe: {
    label: '充裕',
    bg: 'bg-card',
    border: 'border-border/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    numberBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    numberText: 'text-emerald-700 dark:text-emerald-300',
    progressColor: '[&_[data-slot=progress-indicator]]:bg-emerald-500',
    glowClass: '',
  },
};

function getUrgencyLevel(daysRemaining: number): string {
  if (daysRemaining < 3) return 'critical';
  if (daysRemaining < 7) return 'warning';
  if (daysRemaining < 14) return 'caution';
  return 'safe';
}

function CountdownCardSkeleton() {
  return (
    <div className="rounded-lg border border-border/40 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="size-16 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

function CountdownCard({ exam, index }: { exam: Exam; index: number }) {
  const daysRemaining = getDaysUntil(exam.date);
  const urgencyLevel = getUrgencyLevel(daysRemaining);
  const urgency = URGENCY_CONFIG[urgencyLevel];

  const courseColor = exam.course?.color || '#6366f1';

  // Calculate progress: from createdAt to examDate
  const createdDate = new Date(exam.createdAt);
  const examDate = new Date(exam.date);
  const now = new Date();
  const totalDuration = examDate.getTime() - createdDate.getTime();
  const elapsedDuration = now.getTime() - createdDate.getTime();
  const progressPercent = totalDuration > 0
    ? Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100))
    : 0;

  const [planOpen, setPlanOpen] = React.useState(daysRemaining < 7);
  const showPlan = daysRemaining <= 14 && daysRemaining >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Collapsible open={planOpen} onOpenChange={setPlanOpen}>
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'rounded-lg border p-5 transition-shadow duration-200 shadow-sm',
            'hover:shadow-md',
            urgency.bg,
            urgency.border,
            urgency.glowClass,
          )}
        >
          {/* Course color accent - left border */}
          <div className="flex">
            <div
              className="w-1 rounded-full shrink-0 mr-4 self-stretch"
              style={{ backgroundColor: courseColor }}
            />

            <div className="flex-1 min-w-0">
              {/* Header: Title + Type Badge */}
              <div className="flex items-start justify-between gap-2 mb-4">
                <h3 className="text-sm font-semibold text-foreground truncate">
                  {exam.title}
                </h3>
                <Badge
                  className={cn(
                    'text-[10px] px-1.5 py-0 gap-1 shrink-0',
                    EXAM_TYPE_COLORS[exam.type] || 'bg-secondary text-secondary-foreground',
                  )}
                  variant="outline"
                >
                  <span className={cn('size-1.5 rounded-full', EXAM_TYPE_DOT_COLORS[exam.type] || 'bg-muted-foreground')} />
                  {exam.type}
                </Badge>
              </div>

              {/* Course name */}
              {exam.course && (
                <div className="flex items-center gap-1.5 mb-3">
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: courseColor }}
                  />
                  <span className="text-xs text-muted-foreground truncate">{exam.course.name}</span>
                </div>
              )}

              {/* Countdown number + Meta info */}
              <div className="flex gap-4 mb-3">
                {/* Large countdown number */}
                <div className={cn('size-16 rounded-xl flex flex-col items-center justify-center shrink-0', urgency.numberBg)}>
                  <span className={cn('text-2xl font-bold font-mono tabular-nums leading-none', urgency.numberText)}>
                    {daysRemaining}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">天后</span>
                </div>

                {/* Date, Time, Location, Seat */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="size-3.5 shrink-0" />
                    <span className="font-mono tabular-nums truncate">
                      {formatDate(exam.date, 'yyyy年MM月dd日 HH:mm')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {exam.location && (
                      <span className="flex items-center gap-1 min-w-0">
                        <MapPin className="size-3.5 shrink-0" />
                        <span className="truncate">{exam.location}</span>
                      </span>
                    )}
                    {exam.seat && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary/50 shrink-0">
                        <Armchair className="size-3 shrink-0" />
                        <span className="font-mono tabular-nums">{exam.seat}号</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="size-3" />
                    备考进度
                  </span>
                  <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                    {Math.round(progressPercent)}%
                  </span>
                </div>
                <Progress
                  value={progressPercent}
                  className={cn('h-1.5', urgency.progressColor)}
                />
              </div>

              {/* Urgency tag */}
              {daysRemaining >= 0 && (
                <div className="mt-3 flex items-center justify-between">
                  <div className={cn('flex items-center gap-1 text-[10px] font-medium', urgency.text)}>
                    {urgencyLevel === 'critical' && <Zap className="size-3" />}
                    {urgencyLevel === 'warning' && <Target className="size-3" />}
                    {urgencyLevel === 'caution' && <Timer className="size-3" />}
                    {urgencyLevel === 'safe' && <Clock className="size-3" />}
                    <span>{urgency.label}</span>
                  </div>

                  {showPlan && (
                    <CollapsibleTrigger asChild>
                      <button
                        className={cn(
                          'flex items-center gap-1 text-[10px] text-muted-foreground',
                          'hover:text-foreground transition-colors',
                        )}
                      >
                        <BookOpen className="size-3" />
                        <span>{planOpen ? '收起计划' : '查看计划'}</span>
                        <motion.div
                          animate={{ rotate: planOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="size-3" />
                        </motion.div>
                      </button>
                    </CollapsibleTrigger>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Study Plan (expandable) */}
          {showPlan && (
            <CollapsibleContent>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="ml-5 mt-4 pl-5 border-l-2 border-dashed border-border/50">
                  <StudyPlanGenerator exam={exam} daysRemaining={daysRemaining} />
                </div>
              </motion.div>
            </CollapsibleContent>
          )}
        </motion.div>
      </Collapsible>
    </motion.div>
  );
}

export function ExamCountdownDashboard() {
  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: fetchExams,
  });

  const upcomingExams = React.useMemo(() => {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return exams
      .filter((e) => {
        const examDate = new Date(e.date);
        return examDate >= now && examDate <= thirtyDaysLater;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [exams]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CountdownCardSkeleton key={i} />
          ))}
        </div>
      </motion.div>
    );
  }

  if (upcomingExams.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-4"
    >
      {/* Section Header */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-950/40 dark:to-purple-950/40">
          <Timer className="size-4 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">考试倒计时</h2>
          <p className="text-xs text-muted-foreground">
            距离最近的考试
            {upcomingExams.length > 0 && (
              <span className="font-mono tabular-nums ml-1">
                {getDaysUntil(upcomingExams[0].date)} 天
              </span>
            )}
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto font-mono tabular-nums text-xs">
          {upcomingExams.length} 场
        </Badge>
      </div>

      {/* Countdown Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {upcomingExams.map((exam, index) => (
          <CountdownCard key={exam.id} exam={exam} index={index} />
        ))}
      </div>
    </motion.div>
  );
}
