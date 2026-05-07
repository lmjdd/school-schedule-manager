'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DAY_NAMES, TIME_SLOTS } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { timeToMinutes, getCoursesForDay, cn } from '@/lib/helpers';
import type { Course } from '@/lib/types';

async function fetchCourses(): Promise<Course[]> {
  const res = await fetch('/api/courses');
  if (!res.ok) throw new Error('Failed to fetch courses');
  return res.json();
}

// Map dayOfWeek (1-7, Mon-Sun) to column index (0-6)
function dayToCol(dayOfWeek: number): number {
  return dayOfWeek - 1; // 1=Mon->0, 7=Sun->6
}

// Get the column index for today (0-6)
function getTodayCol(): number {
  const jsDay = new Date().getDay();
  // JS: 0=Sun, 1=Mon... Map to: 0=Mon, 6=Sun
  return jsDay === 0 ? 6 : jsDay - 1;
}

function ScheduleSkeleton() {
  return (
    <div className="space-y-2">
      {/* Week nav skeleton */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-20" />
      </div>
      {/* Grid skeleton */}
      <div className="grid gap-px bg-border/50 rounded-lg overflow-hidden">
        {/* Header row */}
        <div className="bg-background flex">
          <div className="w-20 shrink-0" />
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 p-2 text-center">
              <Skeleton className="h-4 w-8 mx-auto mb-1" />
              <Skeleton className="h-3 w-6 mx-auto" />
            </div>
          ))}
        </div>
        {/* Time rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-background flex min-h-[80px]">
            <div className="w-20 shrink-0 p-2">
              <Skeleton className="h-3 w-16" />
            </div>
            {Array.from({ length: 7 }).map((_, j) => (
              <div key={j} className="flex-1 border-l border-border/30">
                <Skeleton className="h-full w-3/4 mx-auto my-1 rounded" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function WeeklyScheduleView() {
  const { currentWeek, setCurrentWeek } = useAppStore();
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  const todayCol = getTodayCol();

  // Precompute the time range for the grid (full day)
  const dayStart = timeToMinutes('08:00'); // 480
  const dayEnd = timeToMinutes('20:40'); // 1240
  const dayDuration = dayEnd - dayStart; // 760

  // Group courses by (dayOfWeek, week) for the current view
  const courseCells = useMemo(() => {
    // Build a map of col -> courses for the current week
    const cellMap = new Map<number, Course[]>();

    for (let day = 1; day <= 7; day++) {
      const dayCourses = getCoursesForDay(courses, day, currentWeek);
      if (dayCourses.length > 0) {
        cellMap.set(dayToCol(day), dayCourses);
      }
    }
    return cellMap;
  }, [courses, currentWeek]);

  const handlePrevWeek = () => {
    setCurrentWeek(Math.max(1, currentWeek - 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(Math.min(30, currentWeek + 1));
  };

  const handleToday = () => {
    // Calculate the actual current week based on semester start date
    // Default: assume semester starts on the first Monday of September
    const now = new Date();
    const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
    const septFirst = new Date(year, 8, 1); // Sep 1
    // Find first Monday on or after Sep 1
    const dayOffset = septFirst.getDay() === 0 ? 1 : (8 - septFirst.getDay());
    const semesterStart = new Date(year, 8, dayOffset);
    const diffMs = now.getTime() - semesterStart.getTime();
    const weekNum = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
    setCurrentWeek(Math.max(1, Math.min(30, weekNum)));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="sm" onClick={handlePrevWeek} disabled={currentWeek <= 1}>
          <ChevronLeft className="size-4" />
        </Button>

        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground">
            第 {currentWeek} 周
          </span>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleToday}>
            今天
          </Button>
        </div>

        <Button variant="outline" size="sm" onClick={handleNextWeek} disabled={currentWeek >= 30}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {isLoading ? (
        <ScheduleSkeleton />
      ) : (
        <div className="overflow-x-auto -mx-1 px-1 pb-2">
          <div className="min-w-[700px]">
            <div className="grid gap-px bg-border/40 rounded-lg overflow-hidden border border-border/40">
              {/* Header row */}
              <div className="bg-muted/30 flex">
                <div className="w-[72px] sm:w-20 shrink-0 flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground font-medium">时间</span>
                </div>
                {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                  const col = dayToCol(day);
                  const isToday = col === todayCol;
                  return (
                    <div
                      key={day}
                      className={cn(
                        'flex-1 py-2 text-center border-l border-border/30 transition-colors',
                        isToday && 'bg-primary/5'
                      )}
                    >
                      <div
                        className={cn(
                          'text-xs font-semibold',
                          isToday ? 'text-primary' : 'text-foreground'
                        )}
                      >
                        {DAY_NAMES[day]}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Time slot rows */}
              {TIME_SLOTS.map((slot, slotIndex) => {
                const slotStartMin = timeToMinutes(slot.start);
                const slotEndMin = timeToMinutes(slot.end);
                const slotDuration = slotEndMin - slotStartMin;

                return (
                  <div
                    key={slotIndex}
                    className="bg-background flex relative"
                    style={{ minHeight: '80px' }}
                  >
                    {/* Time label */}
                    <div className="w-[72px] sm:w-20 shrink-0 flex flex-col items-center justify-start pt-2 border-r border-border/30">
                      <span className="text-[10px] text-muted-foreground leading-tight text-center">
                        <span className="font-mono tabular-nums">{slot.start}</span>
                        <br />
                        <span className="font-mono tabular-nums">{slot.end}</span>
                      </span>
                    </div>

                    {/* Day columns */}
                    {[0, 1, 2, 3, 4, 5, 6].map((col) => {
                      const isToday = col === todayCol;
                      const dayCourses = courseCells.get(col) || [];
                      // Filter courses that fall within this time slot
                      const slotCourses = dayCourses.filter((c) => {
                        const cStart = timeToMinutes(c.startTime);
                        const cEnd = timeToMinutes(c.endTime);
                        // Course overlaps with this slot
                        return cStart < slotEndMin && cEnd > slotStartMin;
                      });

                      return (
                        <div
                          key={col}
                          className={cn(
                            'flex-1 relative border-l border-border/30',
                            isToday && 'bg-primary/[0.02]'
                          )}
                        >
                          {/* Today indicator line */}
                          {isToday && slotIndex === 0 && (
                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary/40 z-10" />
                          )}

                          {slotCourses.map((course) => {
                            // Calculate position within the slot
                            const cStart = timeToMinutes(course.startTime);
                            const cEnd = timeToMinutes(course.endTime);
                            const overlapStart = Math.max(cStart, slotStartMin);
                            const overlapEnd = Math.min(cEnd, slotEndMin);
                            const overlapDuration = overlapEnd - overlapStart;

                            // Only render if this is the starting slot
                            if (cStart < slotStartMin) return null;

                            // Calculate total span relative to slot height
                            const topPercent = 0;
                            const heightPercent = (overlapDuration / slotDuration) * 100;

                            return (
                              <motion.div
                                key={course.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2, delay: col * 0.02 }}
                                className="absolute left-0.5 right-0.5 z-20 rounded-md px-1.5 py-1 overflow-hidden cursor-default group"
                                style={{
                                  top: `${topPercent + 2}%`,
                                  height: `${heightPercent - 4}%`,
                                  backgroundColor: `${course.color}18`,
                                  borderLeft: `3px solid ${course.color}`,
                                  minHeight: '28px',
                                }}
                                title={`${course.name}\n${course.startTime}-${course.endTime}\n${course.location || ''}`}
                              >
                                <p className="text-[11px] font-semibold text-foreground truncate leading-tight">
                                  {course.name}
                                </p>
                                {(heightPercent > 50 || !course.location) && (
                                  <p className="text-[9px] text-muted-foreground font-mono tabular-nums truncate leading-tight mt-0.5">
                                    {course.startTime}-{course.endTime}
                                  </p>
                                )}
                                {heightPercent > 65 && course.location && (
                                  <p className="text-[9px] text-muted-foreground truncate leading-tight mt-0.5 flex items-center gap-0.5">
                                    <MapPin className="size-2 shrink-0" />
                                    {course.location}
                                  </p>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Empty state for schedule */}
            {courses.length > 0 && courseCells.size === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  第 {currentWeek} 周没有课程安排
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  试试切换到其他周次查看
                </p>
              </div>
            )}

            {courses.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">还没有课程，添加课程后即可查看课表</p>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
