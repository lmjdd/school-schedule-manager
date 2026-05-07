'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback, useSyncExternalStore } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { Flame, Calendar, Clock, Trophy } from 'lucide-react';
import { cn } from '@/lib/helpers';

// ─── Responsive hook using useSyncExternalStore (no setState-in-effect) ───────

const emptySubscribe = () => () => {};

function useIsDesktop(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
    () => false,
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FOCUS_TIME_KEY = 'edutrack-pomodoro-focus-time';
const POMODORO_STATE_KEY = 'edutrack-pomodoro-state';
const FOCUS_HISTORY_KEY = 'edutrack-focus-history';

const TOTAL_WEEKS = 12;
const TOTAL_DAYS = TOTAL_WEEKS * 7; // 84

// Color intensity levels based on focus minutes
const LEVEL_CLASSES = [
  'bg-muted',           // Level 0: 0 min
  'bg-primary/15',      // Level 1: 1-15 min
  'bg-primary/30',      // Level 2: 16-45 min
  'bg-primary/50',      // Level 3: 46-90 min
  'bg-primary',         // Level 4: 90+ min
];

const LEVEL_THRESHOLDS = [0, 1, 16, 46, 90]; // in minutes

const DAY_LABELS = ['一', '', '三', '', '五', '', '日'];

interface HeatmapCell {
  date: string;
  minutes: number;
  level: number;
  col: number;
  row: number;
  isFuture: boolean;
  isToday: boolean;
}

interface TooltipData {
  date: string;
  minutes: number;
  left: number;
  top: number;
}

interface HeatmapStats {
  totalDays: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTodayDateStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getLevel(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes < LEVEL_THRESHOLDS[1]) return 0;
  if (minutes < LEVEL_THRESHOLDS[2]) return 1;
  if (minutes < LEVEL_THRESHOLDS[3]) return 2;
  if (minutes < LEVEL_THRESHOLDS[4]) return 3;
  return 4;
}

function getTodaySeconds(): number {
  if (typeof window === 'undefined') return 0;
  try {
    // Try new state format first
    const raw = localStorage.getItem(POMODORO_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { totalFocusSeconds?: number; date?: string };
      if (parsed.date === getTodayDateStr() && parsed.totalFocusSeconds) {
        return parsed.totalFocusSeconds;
      }
    }
    // Fallback to legacy format
    const legacyRaw = localStorage.getItem(FOCUS_TIME_KEY);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw) as { seconds: number; date: string };
      if (parsed.date === getTodayDateStr()) {
        return parsed.seconds;
      }
    }
  } catch {
    // ignore
  }
  return 0;
}

function loadFocusHistory(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(FOCUS_HISTORY_KEY);
    if (raw) {
      return JSON.parse(raw) as Record<string, number>;
    }
  } catch {
    // ignore
  }
  return {};
}

function saveFocusHistory(history: Record<string, number>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FOCUS_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
}

/** Generate realistic demo data for the last 12 weeks */
function generateDemoHistory(): Record<string, number> {
  const history: Record<string, number> = {};
  const now = new Date();
  const todayStr = getTodayDateStr();

  for (let i = TOTAL_DAYS - 1; i >= 1; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = formatDateStr(d);
    const dayOfWeek = d.getDay();

    // Weekend: less likely to study
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const studyProbability = isWeekend ? 0.35 : 0.72;

    if (Math.random() < studyProbability) {
      // Generate between 5 and 180 minutes with weighted distribution
      const base = Math.random();
      let minutes: number;
      if (base < 0.3) {
        minutes = Math.floor(Math.random() * 15) + 5; // 5-19 min (level 1)
      } else if (base < 0.55) {
        minutes = Math.floor(Math.random() * 30) + 16; // 16-45 min (level 2)
      } else if (base < 0.8) {
        minutes = Math.floor(Math.random() * 45) + 46; // 46-90 min (level 3)
      } else {
        minutes = Math.floor(Math.random() * 90) + 91; // 91-180 min (level 4)
      }
      history[dateStr] = minutes * 60; // store in seconds
    }
  }

  // Set today's data from actual pomodoro state if available
  const todaySeconds = getTodaySeconds();
  if (todaySeconds > 0) {
    history[todayStr] = todaySeconds;
  }

  return history;
}

function buildHeatmapCells(history: Record<string, number>): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  const now = new Date();
  const todayStr = getTodayDateStr();

  // Find the start date: go back TOTAL_DAYS from today, align to Monday
  const endDate = new Date(now);
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - (TOTAL_DAYS - 1));

  // Align start to Monday (0=Sun, 1=Mon)
  const startDay = startDate.getDay();
  const mondayOffset = startDay === 0 ? -6 : 1 - startDay;
  startDate.setDate(startDate.getDate() + mondayOffset);

  // Rebuild end date based on aligned start
  const alignedEnd = new Date(startDate);
  alignedEnd.setDate(startDate.getDate() + TOTAL_DAYS - 1);

  let col = 0;
  let row = 0;

  const current = new Date(startDate);
  while (current <= alignedEnd) {
    const dateStr = formatDateStr(current);
    const isFuture = current > now;
    const isToday = dateStr === todayStr;
    const seconds = history[dateStr] || 0;
    const minutes = Math.floor(seconds / 60);

    // Skip cells that are before our 84-day window
    if (current >= new Date(now.getTime() - (TOTAL_DAYS - 1) * 24 * 60 * 60 * 1000) || isToday || !isFuture) {
      cells.push({
        date: dateStr,
        minutes: isFuture ? 0 : minutes,
        level: isFuture ? 0 : getLevel(minutes),
        col,
        row: current.getDay() === 0 ? 6 : current.getDay() - 1, // Mon=0, Sun=6
        isFuture,
        isToday,
      });
    }

    // Advance to next day
    current.setDate(current.getDate() + 1);
    if (current.getDay() === 1 && current > startDate) {
      col++;
    }
  }

  return cells;
}

function calculateStats(cells: HeatmapCell[]): HeatmapStats {
  const studyDays = cells.filter((c) => !c.isFuture && c.minutes > 0);
  const totalDays = studyDays.length;
  const totalMinutes = studyDays.reduce((sum, c) => sum + c.minutes, 0);

  // Build a set of studied dates for streak calculation
  const studiedDates = new Set(
    cells.filter((c) => !c.isFuture && c.minutes > 0).map((c) => c.date)
  );

  // Calculate current streak (counting backwards from today)
  let currentStreak = 0;
  const now = new Date();
  for (let i = 0; i < TOTAL_DAYS; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = formatDateStr(d);
    if (studiedDates.has(dateStr)) {
      currentStreak++;
    } else if (i > 0) {
      // Allow today to not have data yet, but break on past gaps
      // Actually, if today has no data, skip it and continue counting
      if (i === 0) continue;
      break;
    } else {
      // Today has no data, start counting from yesterday
      continue;
    }
  }

  // Fix: if today has no data, count streak from the most recent studied day
  if (!studiedDates.has(getTodayDateStr())) {
    currentStreak = 0;
    for (let i = 1; i < TOTAL_DAYS; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = formatDateStr(d);
      if (studiedDates.has(dateStr)) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  const sortedDates = Array.from(studiedDates).sort();

  if (sortedDates.length > 0) {
    for (let i = 0; i < sortedDates.length; i++) {
      const current = new Date(sortedDates[i]);
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(sortedDates[i - 1]);
        const diffDays = Math.round((current.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));
        tempStreak = diffDays === 1 ? tempStreak + 1 : 1;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }
  }

  return { totalDays, totalMinutes, currentStreak, longestStreak };
}

function formatTotalTime(totalMinutes: number): { hours: number; minutes: number } {
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}

/** Build month labels for the heatmap */
function getMonthLabels(cells: HeatmapCell[]): { label: string; col: number }[] {
  const months: { label: string; col: number }[] = [];
  let lastMonth = -1;

  // Group cells by column and find the first row that has a valid date
  const colMap = new Map<number, HeatmapCell>();
  for (const cell of cells) {
    if (cell.isFuture) continue;
    const existing = colMap.get(cell.col);
    if (!existing || cell.row < existing.row) {
      colMap.set(cell.col, cell);
    }
  }

  const sortedCols = Array.from(colMap.entries()).sort(([a], [b]) => a - b);
  for (const [col, cell] of sortedCols) {
    const d = new Date(cell.date);
    const month = d.getMonth();
    if (month !== lastMonth) {
      months.push({
        label: `${month + 1}月`,
        col,
      });
      lastMonth = month;
    }
  }

  return months;
}

// ─── Animated Number Component ──────────────────────────────────────────────

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

// ─── Tooltip Component ──────────────────────────────────────────────────────

function formatTooltipContent(date: string, minutes: number) {
  const d = new Date(date + 'T00:00:00');
  const dayOfWeek = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
  const dateLabel = `${d.getMonth() + 1}月${d.getDate()}日 ${dayOfWeek}`;
  const timeLabel = minutes <= 0
    ? '无学习记录'
    : minutes < 60
      ? `${minutes} 分钟`
      : `${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分钟`;
  return { dateLabel, timeLabel };
}

function HeatmapTooltip({ data }: {
  data: TooltipData | null;
}) {
  if (!data) return null;

  const { dateLabel, timeLabel } = formatTooltipContent(data.date, data.minutes);

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="absolute z-50 pointer-events-none px-2.5 py-1.5 rounded-md bg-popover border border-border shadow-md text-xs whitespace-nowrap"
          style={{
            left: data.left + 8,
            top: data.top - 36,
          }}
        >
          <p className="font-medium text-foreground">{dateLabel}</p>
          <p className="text-muted-foreground">{timeLabel}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function StudyHeatmap() {
  const didMount = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const isDesktop = useIsDesktop();

  // Initialize with empty history — SSR-safe
  const [history, setHistory] = useState<Record<string, number>>({});
  const [hydrated, setHydrated] = useState(false);

  // Read from localStorage after mount
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      requestAnimationFrame(() => {
        let hist = loadFocusHistory();

        // If no history, generate demo data
        if (Object.keys(hist).length === 0) {
          hist = generateDemoHistory();
          saveFocusHistory(hist);
        }

        // Merge today's live data
        const todayStr = getTodayDateStr();
        const todaySeconds = getTodaySeconds();
        if (todaySeconds > 0) {
          hist[todayStr] = todaySeconds;
        }

        setHistory(hist);
        setHydrated(true);
      });
    }

    // Poll for updated focus time every 5 seconds
    const interval = setInterval(() => {
      const todaySeconds = getTodaySeconds();
      if (todaySeconds > 0) {
        setHistory((prev) => {
          const todayStr = getTodayDateStr();
          const existing = prev[todayStr] || 0;
          if (todaySeconds !== existing) {
            const updated = { ...prev, [todayStr]: todaySeconds };
            saveFocusHistory(updated);
            return updated;
          }
          return prev;
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Build cells and stats
  const cells = useMemo(() => buildHeatmapCells(history), [history]);
  const stats = useMemo(() => calculateStats(cells), [cells]);
  const monthLabels = useMemo(() => getMonthLabels(cells), [cells]);
  const { hours, minutes } = useMemo(() => formatTotalTime(stats.totalMinutes), [stats.totalMinutes]);

  // Group cells into columns for rendering
  const maxCol = cells.reduce((max, c) => Math.max(max, c.col), 0);
  const columns = useMemo(() => {
    const cols: HeatmapCell[][] = [];
    for (let c = 0; c <= maxCol; c++) {
      cols.push(cells.filter((cell) => cell.col === c));
    }
    return cols;
  }, [cells, maxCol]);

  const handleMouseEnter = useCallback((cell: HeatmapCell, e: React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const parentRect = containerRef.current?.getBoundingClientRect();
    if (!parentRect) return;
    setTooltip({
      date: cell.date,
      minutes: cell.minutes,
      left: rect.left - parentRect.left + rect.width / 2,
      top: rect.top - parentRect.top,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.38, ease: 'easeOut' }}
      className="rounded-lg bg-card border border-border/60 p-5 md:p-6 notion-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span>🗓️</span>
          <span>学习活动热力图</span>
        </h3>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span>少</span>
            {LEVEL_CLASSES.map((cls, i) => (
              <div
                key={i}
                className={cn('w-2.5 h-2.5 rounded-sm', cls)}
              />
            ))}
            <span>多</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div ref={containerRef} className="relative mb-5 overflow-x-auto">
        <div className="inline-flex gap-0 min-w-fit">
          {/* Day labels column */}
          <div className="flex flex-col gap-[2px] mr-1.5 pt-[18px]">
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="hidden md:flex items-center justify-end text-[10px] text-muted-foreground/50 w-4 shrink-0"
                style={{ height: `${isDesktop ? 12 : 10}px` }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Month labels + Grid */}
          <div className="relative">
            {/* Month labels row */}
            <div className="relative h-[18px] flex">
              {monthLabels.map((m) => (
                <span
                  key={`${m.label}-${m.col}`}
                  className="absolute top-0 text-[10px] text-muted-foreground/50"
                  style={{ left: `${m.col * (isDesktop ? 14 : 12)}px` }}
                >
                  {m.label}
                </span>
              ))}
            </div>

            {/* Grid columns */}
            <div className="flex gap-0">
              {columns.map((colCells, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-[2px]">
                  {Array.from({ length: 7 }).map((_, rowIdx) => {
                    const cell = colCells.find((c) => c.row === rowIdx);
                    if (!cell) {
                      // Empty spacer — match cell size
                      return (
                        <div
                          key={rowIdx}
                          className={cn(
                            'rounded-sm',
                            isDesktop ? 'w-3 h-3' : 'w-[10px] h-[10px]',
                          )}
                        />
                      );
                    }

                    return (
                      <motion.div
                        key={cell.date}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                          opacity: hydrated ? 1 : 0,
                          scale: hydrated ? 1 : 0,
                        }}
                        transition={{
                          delay: 0.4 + (colIdx * 7 + rowIdx) * 0.003,
                          duration: 0.2,
                          ease: 'easeOut',
                        }}
                        onMouseEnter={(e) => handleMouseEnter(cell, e)}
                        onMouseLeave={handleMouseLeave}
                        className={cn(
                          'rounded-sm cursor-default transition-colors duration-150',
                          isDesktop ? 'w-3 h-3' : 'w-[10px] h-[10px]',
                          cell.isFuture
                            ? 'bg-transparent'
                            : cell.isToday && cell.level === 0
                              ? 'bg-muted ring-1 ring-primary/40 ring-inset'
                              : cell.isToday
                                ? cn(LEVEL_CLASSES[cell.level], 'ring-1 ring-primary/40 ring-inset')
                                : LEVEL_CLASSES[cell.level]
                        )}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tooltip */}
        <HeatmapTooltip data={tooltip} />
      </div>

      {/* Mobile legend */}
      <div className="flex sm:hidden items-center justify-end gap-1 mb-4">
        <span className="text-[9px] text-muted-foreground/50">少</span>
        {LEVEL_CLASSES.map((cls, i) => (
          <div key={i} className={cn('w-2 h-2 rounded-sm', cls)} />
        ))}
        <span className="text-[9px] text-muted-foreground/50">多</span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: hydrated ? 1 : 0, y: hydrated ? 0 : 6 }}
          transition={{ delay: 0.6, duration: 0.3 }}
          className="flex items-center gap-2.5 p-2.5 rounded-lg bg-secondary/30"
        >
          <div className="size-7 rounded-md bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
            <Calendar className="size-3.5 text-emerald-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">学习天数</p>
            <p className="text-sm font-semibold font-mono tabular-nums text-foreground">
              <AnimatedNumber value={stats.totalDays} /> 天
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: hydrated ? 1 : 0, y: hydrated ? 0 : 6 }}
          transition={{ delay: 0.65, duration: 0.3 }}
          className="flex items-center gap-2.5 p-2.5 rounded-lg bg-secondary/30"
        >
          <div className="size-7 rounded-md bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center shrink-0">
            <Clock className="size-3.5 text-orange-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">累计时长</p>
            <p className="text-sm font-semibold font-mono tabular-nums text-foreground">
              {hours > 0 ? (
                <>
                  <AnimatedNumber value={hours} />h {minutes > 0 ? <><AnimatedNumber value={minutes} />m</> : null}
                </>
              ) : (
                <><AnimatedNumber value={minutes} />m</>
              )}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: hydrated ? 1 : 0, y: hydrated ? 0 : 6 }}
          transition={{ delay: 0.7, duration: 0.3 }}
          className="flex items-center gap-2.5 p-2.5 rounded-lg bg-secondary/30"
        >
          <div className="size-7 rounded-md bg-red-50 dark:bg-red-950/30 flex items-center justify-center shrink-0">
            <Flame className="size-3.5 text-red-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">当前连续</p>
            <p className="text-sm font-semibold font-mono tabular-nums text-foreground">
              <AnimatedNumber value={stats.currentStreak} /> 天
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: hydrated ? 1 : 0, y: hydrated ? 0 : 6 }}
          transition={{ delay: 0.75, duration: 0.3 }}
          className="flex items-center gap-2.5 p-2.5 rounded-lg bg-secondary/30"
        >
          <div className="size-7 rounded-md bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
            <Trophy className="size-3.5 text-amber-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">最长连续</p>
            <p className="text-sm font-semibold font-mono tabular-nums text-foreground">
              <AnimatedNumber value={stats.longestStreak} /> 天
            </p>
          </div>
        </motion.div>
      </div>

      {/* Summary text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: hydrated ? 1 : 0 }}
        transition={{ delay: 0.8, duration: 0.3 }}
        className="mt-4 text-center text-xs text-muted-foreground"
      >
        共 <span className="font-semibold text-foreground tabular-nums"><AnimatedNumber value={stats.totalDays} /></span> 天学习，
        累计{' '}
        <span className="font-semibold text-foreground tabular-nums">
          {hours > 0 ? (
            <><AnimatedNumber value={hours} /> 小时 </>
          ) : null}
          <AnimatedNumber value={minutes} /> 分钟
        </span>
      </motion.p>
    </motion.div>
  );
}
