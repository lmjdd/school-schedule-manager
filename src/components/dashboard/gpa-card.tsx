'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { GraduationCap, Award, TrendingUp, ArrowRight, BarChart3 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';
import {
  formatGPA,
  calculateGPA,
  getGPAColor,
  calculateTotalCredits,
  cn,
} from '@/lib/helpers';
import type { Grade } from '@/lib/types';

async function fetchGrades(): Promise<Grade[]> {
  const res = await fetch('/api/grades');
  if (!res.ok) throw new Error('Failed to fetch grades');
  return res.json();
}

function GPACardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-end gap-3">
        <Skeleton className="h-12 w-24" />
        <Skeleton className="h-4 w-16 mb-1" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function GPACard() {
  const { data: grades = [], isLoading } = useQuery({
    queryKey: ['grades'],
    queryFn: fetchGrades,
  });
  const { setCurrentPage } = useAppStore();

  const gpa = useMemo(() => calculateGPA(grades), [grades]);
  const totalCredits = useMemo(() => calculateTotalCredits(grades), [grades]);
  const avgScore = useMemo(() => {
    const graded = grades.filter((g) => g.score !== null && g.score !== undefined);
    if (graded.length === 0) return 0;
    return graded.reduce((sum, g) => sum + (g.score as number), 0) / graded.length;
  }, [grades]);
  const gpaColor = useMemo(() => getGPAColor(gpa), [gpa]);
  const progressPercent = useMemo(() => Math.min((gpa / 4.0) * 100, 100), [gpa]);
  const gradedCount = useMemo(
    () => grades.filter((g) => g.score !== null && g.score !== undefined).length,
    [grades],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.16, ease: 'easeOut' }}
      className="rounded-lg bg-card border border-border/60 p-5 md:p-6 notion-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span>📊</span>
          <span>GPA 概览</span>
        </h3>
        <GraduationCap className="size-4 text-muted-foreground" />
      </div>

      {/* Content */}
      {isLoading ? (
        <GPACardSkeleton />
      ) : grades.length === 0 ? (
        <div className="py-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="size-16 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-950/40 dark:to-purple-950/40 flex items-center justify-center animate-float">
              <span className="text-3xl">📊</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm mb-1">开始添加成绩数据，追踪你的学业表现</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage('statistics')}
            className="mt-3 gap-1.5"
          >
            <BarChart3 className="size-3.5" />
            前往统计
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* GPA large display */}
          <div className="flex items-end gap-3">
            <span
              className={cn(
                'text-4xl md:text-5xl font-bold font-mono tabular-nums leading-none tracking-tight',
                gpaColor,
                gpa >= 3.7 && 'animate-pulse-glow',
              )}
            >
              {formatGPA(gpa)}
            </span>
            <span className="text-sm text-muted-foreground mb-1">/ 4.00</span>
            {gpa >= 3.7 && (
              <span className="text-xs font-medium text-emerald-500 mb-1.5">⭐ 优秀</span>
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <Progress
              value={progressPercent}
              className="h-1.5"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>GPA 进度</span>
              <span className="font-mono tabular-nums">{Math.round(progressPercent)}%</span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Total credits */}
            <div className="rounded-md bg-secondary/60 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Award className="size-3" />
                <span>已修学分</span>
              </div>
              <p className="text-lg font-semibold font-mono tabular-nums text-foreground">
                {totalCredits}
              </p>
            </div>

            {/* Average score */}
            <div className="rounded-md bg-secondary/60 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <TrendingUp className="size-3" />
                <span>平均分</span>
              </div>
              <p className="text-lg font-semibold font-mono tabular-nums text-foreground">
                {avgScore > 0 ? Math.round(avgScore) : '--'}
              </p>
            </div>
          </div>

          {/* Subtle footer */}
          <div className="flex items-center justify-between">
            {gradedCount > 0 && (
              <p className="text-[11px] text-muted-foreground/70">
                共 {gradedCount} 门课程有成绩
              </p>
            )}
            {grades.length > 0 && (
              <button
                onClick={() => setCurrentPage('statistics')}
                className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                查看详情
                <ArrowRight className="size-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
