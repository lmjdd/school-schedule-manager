'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ClipboardList, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/helpers';
import { Skeleton } from '@/components/ui/skeleton';
import { DAY_NAMES_SHORT } from '@/lib/types';

interface DayEvents {
  courses: number;
  assignments: number;
  exams: number;
}

const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'] as const;

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

function getWeekDays(): Date[] {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function EventDots({ events }: { events: DayEvents }) {
  const hasAny = events.courses > 0 || events.assignments > 0 || events.exams > 0;
  if (!hasAny) return null;

  return (
    <div className="flex items-center justify-center gap-0.5 mt-1.5">
      {events.courses > 0 && (
        <div className="size-1.5 rounded-full bg-blue-400 dark:bg-blue-500" title={`${events.courses} 门课程`} />
      )}
      {events.assignments > 0 && (
        <div className="size-1.5 rounded-full bg-amber-400 dark:bg-amber-500" title={`${events.assignments} 个作业`} />
      )}
      {events.exams > 0 && (
        <div className="size-1.5 rounded-full bg-rose-400 dark:bg-rose-500" title={`${events.exams} 场考试`} />
      )}
    </div>
  );
}

function CalendarStripSkeleton() {
  return (
    <div className="flex items-center gap-1 overflow-hidden">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 py-2">
          <Skeleton className="h-3 w-4 rounded" />
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-2 w-6 rounded" />
        </div>
      ))}
    </div>
  );
}

export function WeeklyOverviewStrip() {
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
  const weekDays = useMemo(() => getWeekDays(), []);
  const today = useMemo(() => new Date(), []);

  const dayEventsMap = useMemo(() => {
    const map: Record<string, DayEvents> = {};
    const todayStr = formatDateStr(today);

    weekDays.forEach((day) => {
      const dayStr = formatDateStr(day);
      const dayOfWeek = day.getDay() === 0 ? 7 : day.getDay();

      // Courses that have sessions on this day of week
      const dayCourses = courses.filter((c: any) => c.dayOfWeek === dayOfWeek);
      // Deduplicate by course name
      const uniqueCourseNames = new Set(dayCourses.map((c: any) => c.name));

      // Pending assignments due on this day
      const dayAssignments = assignments.filter((a: any) => {
        if (!a.dueDate || a.status === 'completed') return false;
        return a.dueDate.startsWith(dayStr);
      });

      // Exams on this day
      const dayExams = exams.filter((e: any) => {
        return e.date.startsWith(dayStr);
      });

      map[dayStr] = {
        courses: uniqueCourseNames.size,
        assignments: dayAssignments.length,
        exams: dayExams.length,
      };
    });

    return map;
  }, [courses, assignments, exams, weekDays, today]);

  // Legend
  const legend = useMemo(() => {
    const totals = { courses: 0, assignments: 0, exams: 0 };
    weekDays.forEach((day) => {
      const dayStr = formatDateStr(day);
      const events = dayEventsMap[dayStr];
      if (events) {
        totals.courses += events.courses;
        totals.assignments += events.assignments;
        totals.exams += events.exams;
      }
    });
    return totals;
  }, [weekDays, dayEventsMap]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
      className="rounded-lg bg-card border border-border/60 p-4 md:p-5 notion-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span>📅</span>
          <span>本周日历</span>
        </h3>
        {/* Legend */}
        {!isLoading && (
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-blue-400" />
              课程
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-amber-400" />
              作业
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-rose-400" />
              考试
            </span>
          </div>
        )}
      </div>

      {/* Calendar Strip */}
      <div className="relative">
        {/* Mobile horizontal scroll wrapper */}
        <div className="overflow-x-auto -mx-1 px-1 pb-1">
          <div className="flex items-stretch min-w-[420px]">
            {isLoading ? (
              <CalendarStripSkeleton />
            ) : (
              weekDays.map((day, index) => {
                const dayStr = formatDateStr(day);
                const isToday = isSameDay(day, today);
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                const events = dayEventsMap[dayStr] || { courses: 0, assignments: 0, exams: 0 };
                const hasEvents = events.courses > 0 || events.assignments > 0 || events.exams > 0;

                return (
                  <motion.div
                    key={dayStr}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.2 + index * 0.04 }}
                    className={cn(
                      'flex-1 flex flex-col items-center py-2 rounded-lg transition-colors',
                      isToday
                        ? 'bg-primary/10 dark:bg-primary/15'
                        : 'hover:bg-secondary/50'
                    )}
                  >
                    {/* Day label */}
                    <span className={cn(
                      'text-[11px] font-medium mb-1.5',
                      isToday
                        ? 'text-primary dark:text-primary'
                        : isWeekend
                          ? 'text-muted-foreground/60'
                          : 'text-muted-foreground'
                    )}>
                      周{DAY_LABELS[index]}
                    </span>

                    {/* Date number */}
                    <div className={cn(
                      'flex items-center justify-center size-8 rounded-full text-sm font-medium transition-colors',
                      isToday
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-foreground'
                    )}>
                      {day.getDate()}
                    </div>

                    {/* Event count badge */}
                    {hasEvents && !isToday && (
                      <span className="text-[9px] font-mono tabular-nums text-muted-foreground/70 mt-1">
                        {(events.courses + events.assignments + events.exams) > 0
                          ? `${events.courses + events.assignments + events.exams}`
                          : ''}
                      </span>
                    )}

                    {/* Event dots */}
                    <EventDots events={events} />
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Weekly summary bar */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="flex items-center justify-center gap-4 mt-3 pt-2.5 border-t border-border/30"
        >
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <BookOpen className="size-3 text-blue-500" />
            <span className="font-mono tabular-nums">{legend.courses}</span> 节课
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <ClipboardList className="size-3 text-amber-500" />
            <span className="font-mono tabular-nums">{legend.assignments}</span> 项作业
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <GraduationCap className="size-3 text-rose-500" />
            <span className="font-mono tabular-nums">{legend.exams}</span> 场考试
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
