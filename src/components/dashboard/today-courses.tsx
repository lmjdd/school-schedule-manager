'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Clock, User, BookOpen, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';
import type { Course } from '@/lib/types';

async function fetchCourses(): Promise<Course[]> {
  const res = await fetch('/api/courses');
  if (!res.ok) throw new Error('Failed to fetch courses');
  return res.json();
}

function getTodayDayOfWeek(): number {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 7 : jsDay;
}

function TodayCoursesSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
          <Skeleton className="size-3 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function TodayCourses() {
  const { setCurrentPage } = useAppStore();
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  const todayCourses = useMemo(() => {
    const today = getTodayDayOfWeek();
    return courses
      .filter((c) => c.dayOfWeek === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [courses]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="rounded-lg bg-card border border-border/60 p-5 md:p-6 notion-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span>📅</span>
          <span>今日课程</span>
          {todayCourses.length > 0 && (
            <Badge variant="secondary" className="tabular-nums font-mono text-xs">
              {todayCourses.length}
            </Badge>
          )}
        </h3>
      </div>

      {/* Content */}
      {isLoading ? (
        <TodayCoursesSkeleton />
      ) : todayCourses.length === 0 ? (
        <div className="py-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="size-16 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-950/40 dark:to-rose-950/40 flex items-center justify-center animate-float">
              <span className="text-3xl">🎉</span>
            </div>
          </div>
          <p className="text-foreground text-sm font-medium mb-1">今天没有课程</p>
          <p className="text-muted-foreground text-xs mb-3">享受自由时光，或提前准备明天的课程</p>
          <button
            onClick={() => setCurrentPage('courses')}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            查看课表
            <ArrowRight className="size-3" />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {todayCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/60 transition-colors group cursor-default"
            >
              {/* Color dot */}
              <div
                className="size-3 rounded-full shrink-0 ring-2 ring-background"
                style={{ backgroundColor: course.color || '#6366f1' }}
              />

              {/* Course info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {course.name}
                </p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    <span className="font-mono tabular-nums">
                      {course.startTime}-{course.endTime}
                    </span>
                  </span>
                  {course.location && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="size-3 shrink-0" />
                      <span className="truncate">{course.location}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Teacher */}
              {course.teacher && (
                <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <User className="size-3" />
                  <span className="max-w-[60px] truncate">{course.teacher}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
