'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Timer,
  Flame,
  CheckCircle2,
  Target,
  Clock,
  TrendingUp,
  Sparkles,
  Plus,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/helpers';

// ─── localStorage helpers ───────────────────────────────────────

function getTodayDateStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getWeekStartStr(): string {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
}

interface PomodoroState {
  sessions: number;
  totalFocusSeconds: number;
  date: string;
}

function loadPomodoroState(): PomodoroState {
  if (typeof window === 'undefined') return { sessions: 0, totalFocusSeconds: 0, date: '' };
  try {
    const raw = localStorage.getItem('edutrack-pomodoro-state');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === getTodayDateStr()) {
        return {
          sessions: parsed.sessions || 0,
          totalFocusSeconds: parsed.totalFocusSeconds || 0,
          date: parsed.date,
        };
      }
    }
    // Fallback to legacy key
    const legacyRaw = localStorage.getItem('edutrack-pomodoro-focus-time');
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw);
      if (parsed.date === getTodayDateStr()) {
        return { sessions: 0, totalFocusSeconds: parsed.seconds || 0, date: parsed.date };
      }
    }
    return { sessions: 0, totalFocusSeconds: 0, date: '' };
  } catch {
    return { sessions: 0, totalFocusSeconds: 0, date: '' };
  }
}

interface WeeklyGoalState {
  goalHours: number;
  currentHours: number;
  weekStart: string;
}

function loadWeeklyGoal(): WeeklyGoalState {
  if (typeof window === 'undefined') return { goalHours: 10, currentHours: 0, weekStart: '' };
  try {
    const raw = localStorage.getItem('edutrack-weekly-goal');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.weekStart === getWeekStartStr()) {
        return {
          goalHours: parsed.goalHours || 10,
          currentHours: parsed.currentHours || 0,
          weekStart: parsed.weekStart,
        };
      }
      // New week - reset current but keep goal
      return { goalHours: parsed.goalHours || 10, currentHours: 0, weekStart: getWeekStartStr() };
    }
  } catch {
    // ignore
  }
  return { goalHours: 10, currentHours: 0, weekStart: getWeekStartStr() };
}

function saveWeeklyGoal(state: WeeklyGoalState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('edutrack-weekly-goal', JSON.stringify(state));
  } catch {
    // ignore
  }
}

// ─── Animated Number Component ──────────────────────────────────

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const spring = useSpring(0, { stiffness: 120, damping: 24, mass: 0.5 });
  const display = useTransform(spring, (latest) => Math.round(latest));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span className={className}>
      {display}
    </motion.span>
  );
}

// ─── Progress Ring Component ────────────────────────────────────

function DailyProgressRing({
  percentage,
  size = 88,
  strokeWidth = 7,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const springPct = useSpring(0, { stiffness: 60, damping: 20 });
  const strokeDashoffset = useTransform(
    springPct,
    (latest) => circumference - (latest / 100) * circumference
  );

  useEffect(() => {
    springPct.set(percentage);
  }, [springPct, percentage]);

  const ringColor = percentage >= 100
    ? '#10b981'
    : percentage >= 50
      ? '#06b6d4'
      : '#f97316';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="dailyRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={ringColor} />
            <stop offset="100%" stopColor={ringColor === '#10b981' ? '#34d399' : ringColor === '#06b6d4' ? '#22d3ee' : '#fb923c'} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-secondary/60"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#dailyRingGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.3, ease: 'linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold font-mono tabular-nums text-foreground leading-none">
          <AnimatedNumber value={Math.round(percentage)} />
          <span className="text-xs font-normal text-muted-foreground">%</span>
        </span>
      </div>
    </div>
  );
}

// ─── Stat Mini Card ─────────────────────────────────────────────

function StatMiniCard({
  icon: Icon,
  label,
  value,
  subLabel,
  colorClass,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subLabel?: string;
  colorClass?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
    >
      <div className={cn(
        'size-9 rounded-lg flex items-center justify-center shrink-0',
        colorClass || 'bg-primary/10',
      )}>
        <Icon className="size-4 text-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold font-mono tabular-nums text-foreground leading-tight">
          {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
        </p>
        {subLabel && (
          <p className="text-[10px] text-muted-foreground/60">{subLabel}</p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Weekly Goal Tracker ────────────────────────────────────────

function WeeklyGoalTracker({
  weeklyGoal,
  onGoalChange,
  focusHoursToday,
}: {
  weeklyGoal: WeeklyGoalState;
  onGoalChange: (state: WeeklyGoalState) => void;
  focusHoursToday: number;
}) {
  // Use pomodoro focus seconds for current hours
  const pomodoroState = loadPomodoroState();
  const currentFocusHours = pomodoroState.totalFocusSeconds / 3600;
  const progressPercent = Math.min((currentFocusHours / weeklyGoal.goalHours) * 100, 100);
  const remainingHours = Math.max(0, weeklyGoal.goalHours - currentFocusHours);

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(weeklyGoal.goalHours));

  const handleSaveGoal = () => {
    const newGoal = Math.max(1, Math.min(80, parseInt(editValue) || 10));
    const newState: WeeklyGoalState = {
      goalHours: newGoal,
      currentHours: currentFocusHours,
      weekStart: getWeekStartStr(),
    };
    onGoalChange(newState);
    setEditing(false);
  };

  const motivationalMessage = useMemo(() => {
    if (progressPercent >= 100) return { text: '🎉 本周目标已达成！你太棒了！', emoji: '🏆' };
    if (progressPercent >= 80) return { text: '🔥 即将达成目标，最后冲刺！', emoji: '💪' };
    if (progressPercent >= 50) return { text: '✨ 已过半程，继续保持！', emoji: '⭐' };
    if (progressPercent >= 25) return { text: '🌱 已经开始了，一步一个脚印', emoji: '🌟' };
    return { text: '🚀 新的一周，设定目标开始学习吧！', emoji: '🎯' };
  }, [progressPercent]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Target className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">本周目标</span>
        </div>
        {!editing ? (
          <button
            onClick={() => { setEditValue(String(weeklyGoal.goalHours)); setEditing(true); }}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
          >
            <span className="font-mono tabular-nums">{weeklyGoal.goalHours}h</span>
            <Plus className="size-2.5" />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={1}
              max={80}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-6 w-14 text-[11px] font-mono tabular-nums bg-secondary/40 border-primary/50 px-1.5 text-center"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveGoal();
                if (e.key === 'Escape') setEditing(false);
              }}
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-[10px]"
              onClick={handleSaveGoal}
            >
              保存
            </Button>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            已专注 <span className="font-mono tabular-nums font-medium text-foreground">{currentFocusHours.toFixed(1)}</span>h
          </span>
          <span>
            目标 <span className="font-mono tabular-nums">{weeklyGoal.goalHours}</span>h
          </span>
        </div>
        <div className="relative">
          <Progress value={progressPercent} className="h-2" />
          {progressPercent >= 100 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 right-0 text-xs"
            >
              🎉
            </motion.div>
          )}
        </div>
      </div>

      {/* Remaining hours */}
      {remainingHours > 0 && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Clock className="size-3" />
          距离目标还需 <span className="font-mono tabular-nums font-medium text-foreground">{remainingHours.toFixed(1)}</span> 小时
        </p>
      )}

      {/* Motivational message */}
      <motion.div
        key={motivationalMessage.text}
        initial={{ opacity: 0, x: -4 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="px-3 py-2 rounded-lg bg-secondary/30 text-xs text-muted-foreground flex items-start gap-2"
      >
        <span className="text-sm leading-none mt-0.5">{motivationalMessage.emoji}</span>
        <span>{motivationalMessage.text}</span>
      </motion.div>
    </div>
  );
}

// ─── Main DailySummary Component ───────────────────────────────

async function fetchAssignments(): Promise<any[]> {
  const res = await fetch('/api/assignments');
  if (!res.ok) return [];
  return res.json();
}

async function fetchCourses(): Promise<any[]> {
  const res = await fetch('/api/courses');
  if (!res.ok) return [];
  return res.json();
}

export function DailySummary() {
  // Hydration guard: use ref to track mount, state for triggering re-render
  const didMount = useRef(false);
  const [pomodoroState, setPomodoroState] = useState<PomodoroState>({ sessions: 0, totalFocusSeconds: 0, date: '' });
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoalState>({ goalHours: 10, currentHours: 0, weekStart: '' });

  // Restore from localStorage after mount and start polling
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      // Use requestAnimationFrame to avoid synchronous setState in effect lint rule
      const initPomodoro = loadPomodoroState();
      const initGoal = loadWeeklyGoal();
      requestAnimationFrame(() => {
        setPomodoroState(initPomodoro);
        setWeeklyGoal(initGoal);
      });
    }

    const interval = setInterval(() => {
      setPomodoroState(loadPomodoroState());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleWeeklyGoalChange = useCallback((newState: WeeklyGoalState) => {
    setWeeklyGoal(newState);
    saveWeeklyGoal(newState);
  }, []);

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments'],
    queryFn: fetchAssignments,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  // Calculate daily study goal completion
  const dailyProgress = useMemo(() => {
    // Goal: at least 3 assignments per week, attend today's courses
    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();

    // Today's completed pomodoro sessions (out of target 4)
    const sessionTarget = 4;
    const sessionScore = Math.min(pomodoroState.sessions / sessionTarget, 1) * 50;

    // Today's courses attended (we assume attended if they exist and time has passed)
    const todayCourses = courses.filter((c: any) => {
      if (c.dayOfWeek !== dayOfWeek) return false;
      // Simple heuristic: if the end time has passed, consider attended
      if (!c.endTime) return false;
      const [h, m] = c.endTime.split(':').map(Number);
      const endMinutes = h * 60 + m;
      const nowMinutes = today.getHours() * 60 + today.getMinutes();
      return nowMinutes > endMinutes;
    });
    const courseScore = todayCourses.length > 0 ? 25 : 0;

    // Assignment completion this week (out of target 3)
    const weekStart = getWeekStartStr();
    const completedThisWeek = assignments.filter((a: any) => {
      if (a.status !== 'completed') return false;
      // Check if completed this week (using updatedAt)
      if (!a.updatedAt) return false;
      return a.updatedAt >= weekStart;
    }).length;
    const assignmentScore = Math.min(completedThisWeek / 3, 1) * 25;

    return {
      percentage: Math.min(sessionScore + courseScore + assignmentScore, 100),
      sessions: pomodoroState.sessions,
      focusMinutes: Math.floor(pomodoroState.totalFocusSeconds / 60),
      focusHours: pomodoroState.totalFocusSeconds / 3600,
      completedAssignmentsThisWeek: completedThisWeek,
      todayCourses: todayCourses.length,
    };
  }, [pomodoroState, courses, assignments]);

  // Format focus time
  const focusTimeDisplay = useMemo(() => {
    const totalMinutes = dailyProgress.focusMinutes;
    if (totalMinutes < 60) return `${totalMinutes}m`;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }, [dailyProgress.focusMinutes]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35, ease: 'easeOut' }}
      className="rounded-lg bg-card border border-border/60 p-5 md:p-6 notion-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span>📋</span>
          <span>每日学习总结</span>
        </h3>
        <Sparkles className="size-4 text-amber-400" />
      </div>

      {/* Progress Ring + Quick Stats Row */}
      <div className="flex items-center gap-4 mb-5">
        <DailyProgressRing percentage={dailyProgress.percentage} size={88} strokeWidth={7} />
        <div className="flex-1 space-y-2">
          <p className="text-xs text-muted-foreground">今日学习目标完成度</p>
          <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Timer className="size-3 text-red-400" />
              <span className="font-mono tabular-nums">{dailyProgress.sessions}</span> 番茄
            </span>
            <span className="flex items-center gap-1">
              <Flame className="size-3 text-orange-400" />
              <span className="font-mono tabular-nums">{focusTimeDisplay}</span>
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground/60">
            {dailyProgress.percentage >= 100
              ? '🎯 今日目标已全部达成！'
              : `继续加油，距离目标还差 ${Math.round(100 - dailyProgress.percentage)}%`
            }
          </p>
        </div>
      </div>

      {/* Study Stats Row - mini cards */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <StatMiniCard
          icon={Timer}
          label="今日番茄"
          value={dailyProgress.sessions}
          subLabel="个完成"
          colorClass="bg-red-50 dark:bg-red-950/30"
          delay={0.1}
        />
        <StatMiniCard
          icon={Clock}
          label="专注时间"
          value={focusTimeDisplay}
          subLabel="今日累计"
          colorClass="bg-orange-50 dark:bg-orange-950/30"
          delay={0.15}
        />
        <StatMiniCard
          icon={CheckCircle2}
          label="本周作业"
          value={dailyProgress.completedAssignmentsThisWeek}
          subLabel="已完成"
          colorClass="bg-emerald-50 dark:bg-emerald-950/30"
          delay={0.2}
        />
        <StatMiniCard
          icon={TrendingUp}
          label="今日课程"
          value={dailyProgress.todayCourses}
          subLabel="已出席"
          colorClass="bg-cyan-50 dark:bg-cyan-950/30"
          delay={0.25}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-border/40 pt-4">
        {/* Weekly Goal Tracker */}
        <WeeklyGoalTracker
          weeklyGoal={weeklyGoal}
          onGoalChange={handleWeeklyGoalChange}
          focusHoursToday={dailyProgress.focusHours}
        />
      </div>
    </motion.div>
  );
}
