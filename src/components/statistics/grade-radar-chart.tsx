'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Radar, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
} from 'recharts';
import type { Grade, Course } from '@/lib/types';

async function fetchGrades(): Promise<Grade[]> {
  const res = await fetch('/api/grades');
  if (!res.ok) throw new Error('Failed to fetch grades');
  return res.json();
}

async function fetchCourses(): Promise<Course[]> {
  const res = await fetch('/api/courses');
  if (!res.ok) throw new Error('Failed to fetch courses');
  return res.json();
}

/** Maximum number of subjects shown on the radar to keep it readable */
const MAX_SUBJECTS = 8;

/** Subject label max length (desktop) */
const LABEL_MAX_DESKTOP = 6;

/** Subject label max length (mobile) */
const LABEL_MAX_MOBILE = 4;

const radarChartConfig = {
  value: {
    label: '绩点',
    color: 'var(--chart-1)',
  },
  score: {
    label: '分数',
    color: 'var(--chart-2)',
  },
};

type DisplayMode = 'gpa' | 'score';

interface RadarDataPoint {
  courseId: string;
  subject: string;
  fullSubject: string;
  fullMark: number;
  value: number;
  score: number;
  credit: number;
  gradeCount: number;
  latestScore: number | null;
  latestGpa: number | null;
}

interface GradeRadarChartProps {
  semester?: string | null;
}

export function GradeRadarChart({ semester }: GradeRadarChartProps) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('gpa');

  const { data: allGrades = [], isLoading: gradesLoading } = useQuery({
    queryKey: ['grades'],
    queryFn: fetchGrades,
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  const isLoading = gradesLoading || coursesLoading;

  // Filter grades by selected semester
  const grades = useMemo(() => {
    if (!semester) return allGrades;
    return allGrades.filter((g) => g.semester === semester);
  }, [allGrades, semester]);

  // Group grades by courseId, compute average gradePoint and score
  const allRadarData = useMemo(() => {
    const courseMap = new Map<string, { grades: Grade[]; name: string }>();

    grades.forEach((g) => {
      const existing = courseMap.get(g.courseId);
      const name = g.course?.name || '未知课程';
      if (existing) {
        existing.grades.push(g);
      } else {
        courseMap.set(g.courseId, { grades: [g], name });
      }
    });

    const entries = Array.from(courseMap.entries()).map(
      ([courseId, data]) => {
        const gpaGrades = data.grades.filter(
          (g) => g.gradePoint !== null && g.gradePoint !== undefined,
        );
        const scoreGrades = data.grades.filter(
          (g) => g.score !== null && g.score !== undefined,
        );

        const avgGpa =
          gpaGrades.length > 0
            ? gpaGrades.reduce((sum, g) => sum + g.gradePoint!, 0) /
              gpaGrades.length
            : 0;

        const avgScore =
          scoreGrades.length > 0
            ? scoreGrades.reduce((sum, g) => sum + g.score!, 0) /
              scoreGrades.length
            : 0;

        const latestGrade = data.grades[data.grades.length - 1];

        return {
          courseId,
          subject: data.name,
          fullSubject: data.name,
          fullMark: 4.0,
          value: parseFloat(avgGpa.toFixed(2)),
          score: parseFloat(avgScore.toFixed(1)),
          credit: latestGrade?.credit ?? 0,
          gradeCount: data.grades.length,
          latestScore: latestGrade?.score ?? null,
          latestGpa: latestGrade?.gradePoint ?? null,
        };
      },
    );

    // Sort by subject name for consistent display
    entries.sort((a, b) =>
      a.fullSubject.localeCompare(b.fullSubject, 'zh-CN'),
    );

    return entries;
  }, [grades]);

  // Apply mobile/desktop label truncation and limit to top N subjects
  const radarData = useMemo(() => {
    // Pick top courses: sort by value desc then take first MAX_SUBJECTS
    const limited = allRadarData.slice(0, MAX_SUBJECTS);

    return limited.map((entry) => ({
      ...entry,
      subject:
        entry.subject.length > LABEL_MAX_DESKTOP
          ? entry.subject.slice(0, LABEL_MAX_DESKTOP) + '…'
          : entry.subject,
    }));
  }, [allRadarData]);

  // Mobile-friendly label data (fewer characters)
  const mobileRadarData = useMemo(() => {
    return radarData.map((entry) => ({
      ...entry,
      subject:
        entry.fullSubject.length > LABEL_MAX_MOBILE
          ? entry.fullSubject.slice(0, LABEL_MAX_MOBILE) + '…'
          : entry.fullSubject,
    }));
  }, [radarData]);

  const hasMoreCourses = allRadarData.length > MAX_SUBJECTS;
  const isScoreMode = displayMode === 'score';
  const dataKey = isScoreMode ? 'score' : 'value';
  const maxValue = isScoreMode ? 100 : 4.0;
  const ticks = isScoreMode ? [0, 20, 40, 60, 80, 100] : [0, 1, 2, 3, 4];

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
      >
        <Card className="rounded-lg border-border/60 notion-card overflow-hidden">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-[280px] w-full" />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Custom tooltip renderer
  function renderTooltipContent(
    value: number,
    name: string,
    item: any,
  ) {
    const payload = item.payload as RadarDataPoint;
    return (
      <div className="space-y-1.5 min-w-[170px]">
        <p className="text-xs font-semibold text-foreground">
          {payload.fullSubject}
        </p>
        {payload.latestScore !== null && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">成绩</span>
            <span className="text-xs font-mono font-medium">
              {payload.latestScore}
            </span>
          </div>
        )}
        {payload.latestGpa !== null && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">绩点</span>
            <span className="text-xs font-mono font-medium">
              {payload.latestGpa}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">学分</span>
          <span className="text-xs font-mono font-medium">
            {payload.credit}
          </span>
        </div>
        {payload.gradeCount > 1 && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">记录数</span>
            <span className="text-xs font-mono font-medium">
              {payload.gradeCount}
            </span>
          </div>
        )}
        <div className="pt-1 border-t border-border/50 flex items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">
            {isScoreMode ? '平均分' : '平均绩点'}
          </span>
          <span className="text-xs font-mono font-bold text-primary">
            {isScoreMode ? `${payload.score}` : `${payload.value}`}
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
    >
      <Card className="rounded-lg border-border/60 notion-card overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span>🕸️</span>
              <span>学科成绩雷达图</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Radar className="size-4 text-muted-foreground" />
              <ToggleGroup
                type="single"
                value={displayMode}
                onValueChange={(val) => {
                  if (val) setDisplayMode(val as DisplayMode);
                }}
                size="sm"
                variant="outline"
                className="h-7"
              >
                <ToggleGroupItem value="gpa" className="text-xs px-2.5 gap-1">
                  绩点
                </ToggleGroupItem>
                <ToggleGroupItem value="score" className="text-xs px-2.5 gap-1">
                  分数
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {allRadarData.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              <div className="flex items-center justify-center mb-3">
                <div className="size-14 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-950/40 dark:to-pink-950/40 flex items-center justify-center animate-float">
                  <span className="text-2xl">🕸️</span>
                </div>
              </div>
              <p>暂无成绩数据</p>
              <p className="text-xs mt-1 opacity-60">
                添加成绩后即可查看学科对比
              </p>
            </div>
          ) : allRadarData.length < 3 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              <div className="flex items-center justify-center mb-3">
                <div className="size-14 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/40 dark:to-orange-950/40 flex items-center justify-center animate-float">
                  <span className="text-2xl">📐</span>
                </div>
              </div>
              <p>至少需要 3 门课程</p>
              <p className="text-xs mt-1 opacity-60">
                当前仅 {allRadarData.length} 门，继续添加吧
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Info line */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  {isScoreMode ? '分数模式 (0-100)' : '绩点模式 (0-4.0)'}
                  {hasMoreCourses && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] opacity-70">
                      <Info className="size-3" />
                      显示前 {MAX_SUBJECTS} 门
                    </span>
                  )}
                </span>
                <span>共 {allRadarData.length} 门课程</span>
              </div>

              {/* Desktop Radar Chart (≥ sm) */}
              <div className="hidden sm:block">
                <ChartContainer
                  config={radarChartConfig}
                  className="h-[320px] w-full"
                >
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="75%"
                    data={radarData}
                  >
                    <defs>
                      <linearGradient
                        id="radarFillGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="var(--chart-1)"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--chart-1)"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <PolarGrid
                      stroke="hsl(var(--border))"
                      strokeDasharray="3 3"
                    />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{
                        fontSize: 11,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                      tickLine={false}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, maxValue]}
                      ticks={ticks}
                      tick={{
                        fontSize: 9,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={renderTooltipContent}
                        />
                      }
                    />
                    <RechartsRadar
                      name={isScoreMode ? '分数' : '绩点'}
                      dataKey={dataKey}
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      fill="url(#radarFillGradient)"
                      dot={{
                        r: 4,
                        fill: 'var(--chart-1)',
                        strokeWidth: 2,
                        stroke: 'hsl(var(--background))',
                      }}
                      activeDot={{
                        r: 6,
                        fill: 'var(--chart-1)',
                        strokeWidth: 2,
                        stroke: 'hsl(var(--background))',
                      }}
                      animationDuration={600}
                      animationEasing="ease-out"
                      isAnimationActive
                    />
                  </RadarChart>
                </ChartContainer>
              </div>

              {/* Mobile Radar Chart (< sm) */}
              <div className="block sm:hidden">
                <ChartContainer
                  config={radarChartConfig}
                  className="h-[260px] w-full"
                >
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                    data={mobileRadarData}
                  >
                    <defs>
                      <linearGradient
                        id="radarFillGradientMobile"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="var(--chart-1)"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--chart-1)"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <PolarGrid
                      stroke="hsl(var(--border))"
                      strokeDasharray="3 3"
                    />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{
                        fontSize: 9,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                      tickLine={false}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, maxValue]}
                      ticks={ticks}
                      tick={{
                        fontSize: 8,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={renderTooltipContent}
                        />
                      }
                    />
                    <RechartsRadar
                      name={isScoreMode ? '分数' : '绩点'}
                      dataKey={dataKey}
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      fill="url(#radarFillGradientMobile)"
                      dot={{
                        r: 3,
                        fill: 'var(--chart-1)',
                        strokeWidth: 1.5,
                        stroke: 'hsl(var(--background))',
                      }}
                      activeDot={{
                        r: 5,
                        fill: 'var(--chart-1)',
                        strokeWidth: 2,
                        stroke: 'hsl(var(--background))',
                      }}
                      animationDuration={600}
                      animationEasing="ease-out"
                      isAnimationActive
                    />
                  </RadarChart>
                </ChartContainer>
              </div>

              {/* Quick summary */}
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const sorted = [...radarData].sort(
                    (a, b) => b[dataKey] - a[dataKey],
                  );
                  const best = sorted[0];
                  const worst = sorted[sorted.length - 1];
                  const avg =
                    radarData.reduce((sum, d) => sum + d[dataKey], 0) /
                    radarData.length;

                  return (
                    <>
                      <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1">
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                          最强
                        </span>
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          {best.fullSubject}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-500">
                          {isScoreMode ? best.score : best.value}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1">
                        <span className="text-[10px] text-rose-700 dark:text-rose-400 font-medium">
                          待提升
                        </span>
                        <span className="text-xs font-medium text-rose-700 dark:text-rose-400">
                          {worst.fullSubject}
                        </span>
                        <span className="text-[10px] font-mono text-rose-600 dark:text-rose-500">
                          {isScoreMode ? worst.score : worst.value}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-2.5 py-1">
                        <span className="text-[10px] text-muted-foreground font-medium">
                          平均
                        </span>
                        <span className="text-xs font-mono font-medium tabular-nums text-foreground">
                          {isScoreMode ? avg.toFixed(1) : avg.toFixed(2)}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
