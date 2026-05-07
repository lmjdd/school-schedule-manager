'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Flame } from 'lucide-react';
import { cn } from '@/lib/helpers';

// ─── Constants ────────────────────────────────────────────────────────────────

const FOCUS_TIME_KEY = 'edutrack-pomodoro-focus-time';
const MAX_BAR_HEIGHT = 60; // px
const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

interface DayFocusData {
  date: string;
  dayLabel: string;
  seconds: number;
  isToday: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTodayDateStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Build the 7-day array for the current week (Mon → Sun) */
function buildWeekDays(): DayFocusData[] {
  const now = new Date();
  const todayStr = getTodayDateStr();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
  // Monday offset: 0 for Monday, 1 for Tuesday, ..., 6 for Sunday
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const days: DayFocusData[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + mondayOffset + i);
    d.setHours(0, 0, 0, 0);
    days.push({
      date: formatDateStr(d),
      dayLabel: DAY_LABELS[i],
      seconds: 0,
      isToday: formatDateStr(d) === todayStr,
    });
  }
  return days;
}

/** Read focus time from localStorage, return matching day or null */
function loadFocusTimeFromStorage(): { seconds: number; date: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(FOCUS_TIME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { seconds: number; date: string };
    return parsed;
  } catch {
    return null;
  }
}

/** Format seconds into a human-readable time label */
function formatTimeLabel(totalSeconds: number): string {
  if (totalSeconds <= 0) return '';
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}.${(remainingMinutes / 60 * 10) | 0}h` : `${hours}h`;
}

/** Format seconds for the "Today: Xm" summary */
function formatTodaySummary(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0m';
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/** Format seconds for weekly total */
function formatWeeklyTotal(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0h';
  const hours = totalSeconds / 3600;
  if (hours < 1) return `${Math.round(totalSeconds / 60)}m`;
  return `${hours.toFixed(1)}h`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FocusHistoryChart() {
  const didMount = useRef(false);

  // Initialize with default week (all zeros) — SSR-safe
  const [weekData, setWeekData] = useState<DayFocusData[]>(() =>
    buildWeekDays().map((d) => ({ ...d, seconds: 0 }))
  );

  // Read from localStorage after mount (no hydration mismatch)
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      requestAnimationFrame(() => {
        const days = buildWeekDays();
        const stored = loadFocusTimeFromStorage();
        if (stored) {
          const updated = days.map((d) => ({
            ...d,
            seconds: d.date === stored.date ? stored.seconds : 0,
          }));
          setWeekData(updated);
        } else {
          setWeekData(days);
        }
      });
    }
  }, []);

  // Computed values
  const maxSeconds = Math.max(...weekData.map((d) => d.seconds), 1); // avoid divide-by-zero
  const totalSeconds = weekData.reduce((sum, d) => sum + d.seconds, 0);
  const todayData = weekData.find((d) => d.isToday);
  const todaySeconds = todayData?.seconds ?? 0;
  const todaySummary = formatTodaySummary(todaySeconds);
  const weeklyTotal = formatWeeklyTotal(totalSeconds);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35, ease: 'easeOut' }}
      className="rounded-lg bg-card border border-border/60 p-5 md:p-6 notion-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span>📊</span>
          <span>本周专注时间</span>
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3" />
          <span className="font-mono tabular-nums">{weeklyTotal}</span>
        </div>
      </div>

      {/* Today Summary */}
      <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/10">
        <Flame className="size-4 text-primary shrink-0" />
        <span className="text-xs text-muted-foreground">今日：</span>
        <span className="text-sm font-semibold font-mono tabular-nums text-primary">
          {todaySummary}
        </span>
      </div>

      {/* Chart Area */}
      <div className="flex items-end gap-0">
        {/* Bars */}
        <div className="flex-1 flex items-end justify-between gap-1.5 min-w-0">
          {weekData.map((day, i) => {
            const heightPercent = maxSeconds > 0 ? (day.seconds / maxSeconds) * 100 : 0;
            const barHeight = day.seconds > 0 ? Math.max((heightPercent / 100) * MAX_BAR_HEIGHT, 4) : 0;
            const timeLabel = formatTimeLabel(day.seconds);
            const hasValue = day.seconds > 0;

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                {/* Time label above bar */}
                <div className="h-4 flex items-center justify-center">
                  {hasValue && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
                      className="text-[9px] font-medium text-muted-foreground tabular-nums whitespace-nowrap"
                    >
                      {timeLabel}
                    </motion.span>
                  )}
                </div>

                {/* Bar */}
                <div
                  className="w-full flex items-end justify-center"
                  style={{ height: MAX_BAR_HEIGHT }}
                >
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: barHeight }}
                    transition={{
                      duration: 0.5,
                      delay: 0.1 + i * 0.06,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    className={cn(
                      'w-full max-w-[28px] rounded-t-md relative',
                      day.isToday && hasValue
                        ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.35)] dark:shadow-[0_0_12px_rgba(var(--primary),0.25)]'
                        : hasValue
                          ? 'bg-primary/60'
                          : 'bg-primary/10'
                    )}
                  >
                    {/* Subtle shine effect on bars with data */}
                    {hasValue && (
                      <div
                        className={cn(
                          'absolute inset-x-0 top-0 h-1/2 rounded-t-md',
                          day.isToday
                            ? 'bg-primary-foreground/10'
                            : 'bg-primary-foreground/5'
                        )}
                      />
                    )}
                  </motion.div>
                </div>

                {/* Day label */}
                <span
                  className={cn(
                    'text-[10px] font-medium tabular-nums',
                    day.isToday
                      ? 'text-primary'
                      : 'text-muted-foreground/60'
                  )}
                >
                  {day.dayLabel}
                </span>
              </div>
            );
          })}
        </div>

        {/* Weekly Total (right side) */}
        <div className="ml-3 pl-3 border-l border-border/40 flex flex-col items-center justify-end min-w-[48px]">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] text-muted-foreground/60">本周</span>
            <span className="text-base font-bold font-mono tabular-nums text-foreground leading-none">
              {totalSeconds > 0 ? weeklyTotal : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Empty state hint */}
      {totalSeconds === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
          className="text-center text-[11px] text-muted-foreground/50 mt-3"
        >
          完成番茄钟后这里会显示你的专注记录
        </motion.p>
      )}
    </motion.div>
  );
}
