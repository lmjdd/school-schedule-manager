'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  RotateCcw,
  Sparkles,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Minus,
  CreditCard,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { calculateGPA, getGPAColor, cn } from '@/lib/helpers';
import type { Course, Grade } from '@/lib/types';

// Grade options for the GPA calculator
const GRADE_OPTIONS = [
  { label: 'A (90-100)', value: '4.0', gradePoint: 4.0, range: '90-100' },
  { label: 'A- (85-89)', value: '3.7', gradePoint: 3.7, range: '85-89' },
  { label: 'B+ (82-84)', value: '3.3', gradePoint: 3.3, range: '82-84' },
  { label: 'B (78-81)', value: '3.0', gradePoint: 3.0, range: '78-81' },
  { label: 'B- (75-77)', value: '2.7', gradePoint: 2.7, range: '75-77' },
  { label: 'C+ (72-74)', value: '2.3', gradePoint: 2.3, range: '72-74' },
  { label: 'C (68-71)', value: '2.0', gradePoint: 2.0, range: '68-71' },
  { label: 'C- (64-67)', value: '1.7', gradePoint: 1.7, range: '64-67' },
  { label: 'D (60-63)', value: '1.0', gradePoint: 1.0, range: '60-63' },
  { label: 'F (<60)', value: '0', gradePoint: 0, range: '<60' },
] as const;

// Map score to grade option value for auto-fill
function scoreToOptionValue(score: number | null | undefined): string {
  if (score == null) return '';
  if (score >= 90) return '4.0';
  if (score >= 85) return '3.7';
  if (score >= 82) return '3.3';
  if (score >= 78) return '3.0';
  if (score >= 75) return '2.7';
  if (score >= 72) return '2.3';
  if (score >= 68) return '2.0';
  if (score >= 64) return '1.7';
  if (score >= 60) return '1.0';
  return '0';
}

// Get grade point from option value string
function getGradePointFromValue(value: string): number {
  const opt = GRADE_OPTIONS.find((o) => o.value === value);
  return opt ? opt.gradePoint : 0;
}

// Get label for option value
function getLabelForValue(value: string): string {
  const opt = GRADE_OPTIONS.find((o) => o.value === value);
  return opt ? opt.label : '';
}

// Color for grade level badge
function getGradeBadgeStyle(value: string): string {
  const gp = getGradePointFromValue(value);
  if (gp >= 3.7) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (gp >= 3.0) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (gp >= 2.0) return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-red-100 text-red-700 border-red-200';
}

function GPACalculatorSkeleton() {
  return (
    <Card className="rounded-lg border-border/60 notion-card">
      <CardContent className="p-5 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Skeleton className="size-5 rounded" />
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-28 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
        <div className="mt-5 flex gap-4">
          <Skeleton className="h-24 flex-1 rounded-lg" />
          <Skeleton className="h-24 flex-1 rounded-lg" />
          <Skeleton className="h-24 flex-1 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

export function GPACalculator() {
  const [selections, setSelections] = useState<Record<string, string>>({});

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => fetch('/api/courses').then((r) => r.json()),
  });

  const { data: grades = [] } = useQuery({
    queryKey: ['grades'],
    queryFn: () => fetch('/api/grades').then((r) => r.json()),
  });

  // Calculate predicted GPA based on user selections
  const predictedGPA = useMemo(() => {
    const entries = Object.entries(selections).filter(([, v]) => v !== '');
    if (entries.length === 0) return 0;
    let totalWeightedPoints = 0;
    let totalCredits = 0;
    for (const [courseId, value] of entries) {
      const course = courses.find((c: Course) => c.id === courseId);
      if (!course || course.credit <= 0) continue;
      const gp = getGradePointFromValue(value);
      totalWeightedPoints += gp * course.credit;
      totalCredits += course.credit;
    }
    return totalCredits > 0 ? totalWeightedPoints / totalCredits : 0;
  }, [selections, courses]);

  // Total credits with selections
  const predictedCredits = useMemo(() => {
    const entries = Object.entries(selections).filter(([, v]) => v !== '');
    let total = 0;
    for (const [courseId] of entries) {
      const course = courses.find((c: Course) => c.id === courseId);
      if (course) total += course.credit;
    }
    return total;
  }, [selections, courses]);

  // Weighted total points
  const weightedPoints = useMemo(() => {
    const entries = Object.entries(selections).filter(([, v]) => v !== '');
    let total = 0;
    for (const [courseId, value] of entries) {
      const course = courses.find((c: Course) => c.id === courseId);
      if (!course || course.credit <= 0) continue;
      total += getGradePointFromValue(value) * course.credit;
    }
    return total;
  }, [selections, courses]);

  // Actual GPA from grades table
  const actualGPA = useMemo(() => calculateGPA(grades), [grades]);

  // GPA difference
  const gpaDiff = useMemo(() => {
    const hasPredicted = Object.values(selections).some((v) => v !== '');
    if (!hasPredicted || actualGPA === 0) return null;
    return predictedGPA - actualGPA;
  }, [predictedGPA, actualGPA, selections]);

  const selectedCount = Object.values(selections).filter((v) => v !== '').length;

  function handleGradeChange(courseId: string, value: string) {
    setSelections((prev) => ({ ...prev, [courseId]: value }));
  }

  function handleReset() {
    setSelections({});
  }

  function handleAutoFill() {
    const newSelections: Record<string, string> = {};
    for (const grade of grades) {
      if (grade.courseId && grade.score != null) {
        const value = scoreToOptionValue(grade.score);
        if (value) {
          newSelections[grade.courseId] = value;
        }
      }
    }
    setSelections(newSelections);
  }

  const predictedGPAColor = getGPAColor(predictedGPA);

  if (isLoading) {
    return <GPACalculatorSkeleton />;
  }

  if (courses.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="rounded-lg border-border/60 notion-card">
        <CardContent className="p-5 md:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center border border-violet-200/50 dark:border-violet-500/20">
                <Calculator className="size-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground leading-tight">
                  🎯 GPA 计算器
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  预测你的 GPA，探索不同成绩组合
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handleAutoFill}
              >
                <Sparkles className="size-3" />
                基于实际成绩自动填充
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handleReset}
              >
                <RotateCcw className="size-3" />
                重置
              </Button>
            </div>
          </div>

          {/* Course list with grade selectors */}
          <ScrollArea className="max-h-80">
            <div className="space-y-2">
              {/* Table header - hidden on mobile */}
              <div className="hidden md:grid md:grid-cols-[1fr_70px_180px] gap-3 px-3 py-2 text-xs font-medium text-muted-foreground">
                <span>课程名称</span>
                <span className="text-center">学分</span>
                <span className="text-center">预期成绩</span>
              </div>

              <AnimatePresence mode="popLayout">
                {courses.map((course: Course, index: number) => {
                  const selectedValue = selections[course.id] || '';
                  const isSelected = selectedValue !== '';

                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      className={cn(
                        'grid grid-cols-1 md:grid-cols-[1fr_70px_180px] gap-2 md:gap-3 items-center p-3 rounded-lg border transition-colors',
                        isSelected
                          ? 'border-primary/20 bg-primary/[0.02]'
                          : 'border-border/40 bg-card/50 hover:border-border/60',
                      )}
                    >
                      {/* Course name */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-1.5 h-6 rounded-full shrink-0"
                          style={{ backgroundColor: course.color }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {course.name}
                          </p>
                          <p className="text-xs text-muted-foreground md:hidden">
                            {course.credit} 学分
                          </p>
                        </div>
                      </div>

                      {/* Credit */}
                      <div className="hidden md:flex items-center justify-center">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {course.credit}
                        </Badge>
                      </div>

                      {/* Grade Select */}
                      <div className="flex items-center gap-2">
                        <Select
                          value={selectedValue}
                          onValueChange={(v) => handleGradeChange(course.id, v)}
                        >
                          <SelectTrigger className="h-8 w-full text-xs" size="sm">
                            <SelectValue placeholder="选择成绩" />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADE_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <span className="flex items-center gap-1.5">
                                  <span
                                    className={cn(
                                      'inline-block w-1.5 h-1.5 rounded-full',
                                      opt.gradePoint >= 3.7
                                        ? 'bg-emerald-500'
                                        : opt.gradePoint >= 3.0
                                          ? 'bg-blue-500'
                                          : opt.gradePoint >= 2.0
                                            ? 'bg-amber-500'
                                            : 'bg-red-500',
                                    )}
                                  />
                                  {opt.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          >
                            <Badge
                              variant="outline"
                              className={cn('text-[10px] px-1.5 py-0 font-mono shrink-0', getGradeBadgeStyle(selectedValue))}
                            >
                              {getGradePointFromValue(selectedValue).toFixed(1)}
                            </Badge>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </ScrollArea>

          {/* Results Summary */}
          <AnimatePresence mode="wait">
            {selectedCount > 0 ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="mt-5 pt-5 border-t border-border/40"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Predicted GPA */}
                  <div className="rounded-lg bg-gradient-to-br from-violet-50/80 to-purple-50/60 dark:from-violet-950/30 dark:to-purple-950/20 border border-violet-200/50 dark:border-violet-500/20 p-4 flex flex-col items-center justify-center text-center">
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      预测 GPA
                    </p>
                    <p className={cn('text-3xl font-bold font-mono tabular-nums leading-none', predictedGPAColor)}>
                      {predictedGPA.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      / 4.00 · {selectedCount} 门课程
                    </p>
                  </div>

                  {/* Total Credits & Weighted Points */}
                  <div className="rounded-lg bg-gradient-to-br from-cyan-50/80 to-sky-50/60 dark:from-cyan-950/30 dark:to-sky-950/20 border border-cyan-200/50 dark:border-cyan-500/20 p-4 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-2">
                      <CreditCard className="size-3" />
                      学分统计
                    </div>
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-lg font-bold font-mono tabular-nums text-foreground">
                          {predictedCredits}
                        </p>
                        <p className="text-[10px] text-muted-foreground">总学分</p>
                      </div>
                      <div className="w-px h-8 bg-border/60" />
                      <div>
                        <p className="text-lg font-bold font-mono tabular-nums text-foreground">
                          {weightedPoints.toFixed(1)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">加权绩点</p>
                      </div>
                    </div>
                  </div>

                  {/* Comparison with actual GPA */}
                  <div className="rounded-lg bg-gradient-to-br from-amber-50/80 to-orange-50/60 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-500/20 p-4 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-1">
                      <BookOpen className="size-3" />
                      与实际 GPA 对比
                    </div>
                    {gpaDiff !== null ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          {gpaDiff > 0.001 ? (
                            <TrendingUp className="size-4 text-emerald-500" />
                          ) : gpaDiff < -0.001 ? (
                            <TrendingDown className="size-4 text-red-500" />
                          ) : (
                            <Minus className="size-4 text-muted-foreground" />
                          )}
                          <p
                            className={cn(
                              'text-lg font-bold font-mono tabular-nums',
                              gpaDiff > 0.001
                                ? 'text-emerald-600'
                                : gpaDiff < -0.001
                                  ? 'text-red-600'
                                  : 'text-muted-foreground',
                            )}
                          >
                            {gpaDiff > 0 ? '+' : ''}{gpaDiff.toFixed(2)}
                          </p>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          实际 GPA: {actualGPA.toFixed(2)}
                        </p>
                      </>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">暂无实际成绩</p>
                        <p className="text-[10px] text-muted-foreground">
                          添加成绩后可对比
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-5 pt-5 border-t border-border/40 flex flex-col items-center justify-center py-6 text-center"
              >
                <div className="size-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                  <Calculator className="size-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  选择课程成绩开始计算
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  为每门课程选择预期成绩，实时查看 GPA 预测结果
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
