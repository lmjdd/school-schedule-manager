'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { GraduationCap, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Area, AreaChart, ResponsiveContainer } from 'recharts';
import {
  formatGPA,
  calculateGPA,
  getGPAColor,
  cn,
} from '@/lib/helpers';
import type { Grade } from '@/lib/types';

async function fetchGrades(): Promise<Grade[]> {
  const res = await fetch('/api/grades');
  if (!res.ok) throw new Error('Failed to fetch grades');
  return res.json();
}

const gpaChartConfig = {
  gpa: {
    label: 'GPA',
    color: 'var(--chart-1)',
  },
  target: {
    label: '目标 GPA',
    color: 'var(--chart-3)',
  },
  gradePoint: {
    label: '绩点',
    color: 'var(--chart-1)',
  },
};

function getGPATrendIcon(current: number, previous: number | null) {
  if (previous === null) return <Minus className="size-3 text-muted-foreground" />;
  if (current > previous) return <TrendingUp className="size-3 text-emerald-500" />;
  if (current < previous) return <TrendingDown className="size-3 text-red-500" />;
  return <Minus className="size-3 text-muted-foreground" />;
}

/** Gradient colors for per-course bars based on grade point */
function getBarColor(gradePoint: number | null): string {
  if (gradePoint === null || gradePoint === undefined) return 'var(--chart-5)';
  if (gradePoint >= 3.7) return '#10b981'; // emerald-500
  if (gradePoint >= 3.3) return '#34d399'; // emerald-400
  if (gradePoint >= 3.0) return '#fbbf24'; // amber-400
  if (gradePoint >= 2.3) return '#fb923c'; // orange-400
  if (gradePoint >= 2.0) return '#f87171'; // red-400
  return '#ef4444'; // red-500
}

interface GPAOverviewProps {
  semester?: string | null;
}

export function GPAOverview({ semester }: GPAOverviewProps) {
  const [targetGPA, setTargetGPA] = useState(3.5);
  const { data: allGrades = [], isLoading } = useQuery({
    queryKey: ['grades'],
    queryFn: fetchGrades,
  });

  const grades = useMemo(() => {
    if (!semester) return allGrades;
    return allGrades.filter((g) => g.semester === semester);
  }, [allGrades, semester]);

  const gpa = useMemo(() => calculateGPA(grades), [grades]);
  const gpaColor = useMemo(() => getGPAColor(gpa), [gpa]);

  // Semester-over-semester GPA trend data (for "全部" view)
  const semesterData = useMemo(() => {
    const semesterMap = new Map<string, Grade[]>();
    allGrades.forEach((g) => {
      const sem = g.semester || '未知学期';
      const existing = semesterMap.get(sem) || [];
      existing.push(g);
      semesterMap.set(sem, existing);
    });

    const entries = Array.from(semesterMap.entries());
    entries.sort(([a], [b]) => a.localeCompare(b));

    return entries.map(([sem, semGrades]) => ({
      semester: sem.replace(/-\d+$/, ''),
      gpa: parseFloat(calculateGPA(semGrades).toFixed(2)),
      target: targetGPA,
    }));
  }, [allGrades, targetGPA, semester]);

  // Per-course data for a specific semester view
  const courseData = useMemo(() => {
    if (!semester || grades.length === 0) return [];
    return grades.map((g) => ({
      name: g.course?.name || '未知课程',
      gradePoint: g.gradePoint !== null && g.gradePoint !== undefined ? parseFloat(g.gradePoint.toFixed(2)) : 0,
      score: g.score,
      credit: g.credit,
      color: getBarColor(g.gradePoint),
    }));
  }, [grades, semester]);

  const latestGPA = semesterData.length > 0 ? semesterData[semesterData.length - 1].gpa : gpa;
  const previousGPA = semesterData.length > 1 ? semesterData[semesterData.length - 2].gpa : null;

  const diff = previousGPA !== null
    ? (latestGPA - previousGPA).toFixed(2)
    : null;

  const meetsTarget = latestGPA >= targetGPA;

  const isSemesterView = !!semester;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <Card className="rounded-lg border-border/60 notion-card overflow-hidden">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-end gap-3">
              <Skeleton className="h-12 w-28" />
              <Skeleton className="h-4 w-12 mb-1" />
            </div>
            <Skeleton className="h-[180px] w-full" />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="rounded-lg border-border/60 notion-card overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span>📊</span>
              <span>{isSemesterView ? '课程 GPA 详情' : 'GPA 概览'}</span>
            </CardTitle>
            <GraduationCap className="size-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* GPA Display */}
          <div className="flex items-end gap-3">
            <span
              className={cn(
                'text-4xl md:text-5xl font-bold font-mono tabular-nums leading-none tracking-tight',
                gpaColor,
              )}
            >
              {formatGPA(latestGPA)}
            </span>
            <span className="text-sm text-muted-foreground mb-1">/ 4.00</span>
            {!isSemesterView && diff !== null && (
              <div className="flex items-center gap-1 mb-1 ml-2">
                {getGPATrendIcon(latestGPA, previousGPA)}
                <span className={cn(
                  'text-xs font-mono tabular-nums',
                  parseFloat(diff) > 0 ? 'text-emerald-600' : parseFloat(diff) < 0 ? 'text-red-600' : 'text-muted-foreground',
                )}>
                  {parseFloat(diff) > 0 ? '+' : ''}{diff}
                </span>
              </div>
            )}
            {isSemesterView && (
              <span className="text-xs text-muted-foreground mb-1 ml-2">
                {semester}
              </span>
            )}
          </div>

          {/* Target GPA */}
          <div className="flex items-center gap-3">
            <Target className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">目标 GPA</span>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="4.0"
              value={targetGPA}
              onChange={(e) => setTargetGPA(Math.min(4.0, Math.max(0, parseFloat(e.target.value) || 0)))}
              className="h-7 w-16 text-xs font-mono tabular-nums bg-secondary/40 border-transparent focus:border-primary/50 px-2"
            />
            {grades.length > 0 && (
              <span className={cn(
                'text-xs font-medium ml-auto',
                meetsTarget ? 'text-emerald-600' : 'text-amber-600',
              )}>
                {meetsTarget ? '✓ 已达标' : `差 ${(targetGPA - latestGPA).toFixed(2)}`}
              </span>
            )}
          </div>

          {/* Chart: Semester trend (全部) or Per-course bars (specific semester) */}
          {!isSemesterView && semesterData.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">GPA 趋势</p>
              <ChartContainer config={gpaChartConfig} className="h-[180px] w-full">
                <AreaChart data={semesterData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gpaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="semester"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 4.0]}
                    ticks={[0, 1.0, 2.0, 3.0, 4.0]}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="gpa"
                    stroke="var(--color-gpa)"
                    strokeWidth={2.5}
                    fill="url(#gpaGradient)"
                    dot={{ r: 4, fill: 'var(--color-gpa)', strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="var(--color-target)"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={false}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          )}

          {/* Per-course GPA bars for specific semester */}
          {isSemesterView && courseData.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">各课程绩点</p>
              <ChartContainer config={gpaChartConfig} className="h-[180px] w-full">
                <BarChart
                  data={courseData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={55}
                  />
                  <YAxis
                    domain={[0, 4.0]}
                    ticks={[0, 1.0, 2.0, 3.0, 4.0]}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, _name, item) => (
                          <div className="space-y-1 min-w-[140px]">
                            <p className="text-xs font-medium text-foreground">
                              {item.payload.name}
                            </p>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-xs text-muted-foreground">成绩</span>
                              <span className="text-xs font-mono font-medium">
                                {item.payload.score !== null && item.payload.score !== undefined ? item.payload.score : '—'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-xs text-muted-foreground">绩点</span>
                              <span className="text-xs font-mono font-medium">
                                {item.payload.gradePoint}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-xs text-muted-foreground">学分</span>
                              <span className="text-xs font-mono font-medium">
                                {item.payload.credit}
                              </span>
                            </div>
                          </div>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="gradePoint" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {courseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          )}

          {/* Color legend for per-course view */}
          {isSemesterView && courseData.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-[#10b981]" />
                <span>≥ 3.7</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-[#34d399]" />
                <span>≥ 3.3</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-[#fbbf24]" />
                <span>≥ 3.0</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-[#fb923c]" />
                <span>≥ 2.3</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-[#f87171]" />
                <span>&lt; 2.3</span>
              </div>
            </div>
          )}

          {grades.length === 0 && (
            <div className="py-6 text-center text-muted-foreground text-sm">
              <div className="flex items-center justify-center mb-3">
                <div className="size-14 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-950/40 dark:to-purple-950/40 flex items-center justify-center animate-float">
                  <span className="text-2xl">📝</span>
                </div>
              </div>
              <p>暂无成绩数据</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
