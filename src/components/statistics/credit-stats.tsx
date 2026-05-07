'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Award, BookOpen, Settings2, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell } from 'recharts';
import { calculateTotalCredits, cn } from '@/lib/helpers';
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

const creditChartConfig = {
  required: { label: '必修', color: 'var(--chart-1)' },
  elective: { label: '选修', color: 'var(--chart-2)' },
  general: { label: '通识', color: 'var(--chart-3)' },
  practice: { label: '实践', color: 'var(--chart-4)' },
  other: { label: '其他', color: 'var(--chart-5)' },
};

const CATEGORY_COLORS: Record<string, string> = {
  '必修': 'var(--chart-1)',
  '选修': 'var(--chart-2)',
  '通识': 'var(--chart-3)',
  '实践': 'var(--chart-4)',
};

const CATEGORY_KEYS: Record<string, string> = {
  '必修': 'required',
  '选修': 'elective',
  '通识': 'general',
  '实践': 'practice',
};

const CATEGORY_ICONS: Record<string, string> = {
  '必修': '📘',
  '选修': '📗',
  '通识': '📙',
  '实践': '📓',
};

/** Animated number that counts up from 0 to target */
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

/** Circular progress ring with gradient stroke */
function ProgressRing({
  progress,
  size = 100,
  strokeWidth = 8,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const springProgress = useSpring(0, { stiffness: 60, damping: 20 });
  const strokeDashoffset = useTransform(
    springProgress,
    (latest) => circumference - (latest / 100) * circumference
  );

  useEffect(() => {
    springProgress.set(progress);
  }, [springProgress, progress]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="progressRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-secondary/60"
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressRingGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.3, ease: 'linear' }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-lg font-bold font-mono tabular-nums text-foreground"
        >
          <AnimatedNumber value={Math.round(progress)} className="" />%
        </motion.span>
        <span className="text-[9px] text-muted-foreground">完成</span>
      </div>
    </div>
  );
}

interface CreditStatsProps {
  semester?: string | null;
}

export function CreditStats({ semester }: CreditStatsProps) {
  const [requiredCredits, setRequiredCredits] = useState(160);

  const { data: allGrades = [], isLoading: gradesLoading } = useQuery({
    queryKey: ['grades'],
    queryFn: fetchGrades,
  });

  const grades = useMemo(() => {
    if (!semester) return allGrades;
    return allGrades.filter((g) => g.semester === semester);
  }, [allGrades, semester]);

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  const totalCredits = useMemo(() => calculateTotalCredits(grades), [grades]);
  const progressPercent = useMemo(() => Math.min((totalCredits / requiredCredits) * 100, 100), [totalCredits, requiredCredits]);

  const courseMap = useMemo(() => {
    const map = new Map<string, Course>();
    courses.forEach((c) => map.set(c.id, c));
    return map;
  }, [courses]);

  const categoryBreakdown = useMemo(() => {
    const catMap: Record<string, number> = {};
    grades.forEach((g) => {
      const course = courseMap.get(g.courseId);
      const cat = course?.category || '其他';
      catMap[cat] = (catMap[cat] || 0) + g.credit;
    });

    return Object.entries(catMap)
      .map(([name, credits]) => ({
        name,
        credits,
        fill: CATEGORY_COLORS[name] || 'var(--chart-5)',
        key: CATEGORY_KEYS[name] || 'other',
      }))
      .sort((a, b) => b.credits - a.credits);
  }, [grades, courseMap]);

  const pieData = useMemo(() => {
    return categoryBreakdown.map((item) => ({
      ...item,
      value: item.credits,
    }));
  }, [categoryBreakdown]);

  // Calculate graduation prediction
  const graduationPrediction = useMemo(() => {
    // Count unique semesters
    const semesterSet = new Set<string>();
    allGrades.forEach((g) => {
      if (g.semester) semesterSet.add(g.semester);
    });
    const semestersCount = semesterSet.size;
    if (semestersCount === 0 || totalCredits === 0) return null;
    const avgCreditsPerSemester = totalCredits / semestersCount;
    const remainingCredits = requiredCredits - totalCredits;
    if (remainingCredits <= 0) return { semestersNeeded: 0, message: '已满足毕业学分要求！🎉' };
    const semestersNeeded = Math.ceil(remainingCredits / avgCreditsPerSemester);
    const totalSemesters = semestersCount + semestersNeeded;
    const yearsNeeded = (totalSemesters / 2).toFixed(1);
    return {
      semestersNeeded,
      message: semestersNeeded <= 2
        ? `按当前 pace，还需约 ${semestersNeeded} 个学期 (${yearsNeeded} 年) 达标 🎯`
        : `按当前 pace，还需约 ${semestersNeeded} 个学期 (${yearsNeeded} 年) 达标`,
    };
  }, [allGrades, totalCredits, requiredCredits]);

  if (gradesLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
      >
        <Card className="rounded-lg border-border/60 notion-card overflow-hidden">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-5">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-[160px] w-full" />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
    >
      <Card className="rounded-lg border-border/60 notion-card overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span>🎓</span>
              <span>学分统计</span>
            </CardTitle>
            <div className="flex items-center gap-1.5">
              <Settings2 className="size-3 text-muted-foreground" />
              <Input
                type="number"
                min={1}
                max={300}
                value={requiredCredits}
                onChange={(e) => setRequiredCredits(parseInt(e.target.value) || 160)}
                className="h-6 w-14 text-[11px] font-mono tabular-nums bg-secondary/40 border-transparent focus:border-primary/50 px-1.5 text-right"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Top Section: Credits + Progress Ring + Graduation Prediction */}
          <div className="flex items-center gap-5">
            {/* Total Credits with animated number */}
            <div className="flex-1">
              <div className="flex items-end gap-2">
                <span className="text-4xl md:text-5xl font-bold font-mono tabular-nums leading-none tracking-tight text-foreground">
                  <AnimatedNumber value={totalCredits} />
                </span>
                <span className="text-sm text-muted-foreground mb-1">/ {requiredCredits}</span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5 mt-3">
                <Progress value={progressPercent} className="h-1.5" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>毕业进度</span>
                  <span className="font-mono tabular-nums">{progressPercent.toFixed(1)}%</span>
                </div>
              </div>

              {/* Graduation Prediction */}
              {graduationPrediction && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className={cn(
                    'mt-3 flex items-start gap-2 px-3 py-2 rounded-lg text-xs',
                    graduationPrediction.semestersNeeded === 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-secondary/50 text-muted-foreground',
                  )}
                >
                  <GraduationCap className="size-3.5 mt-0.5 shrink-0" />
                  <span>{graduationPrediction.message}</span>
                </motion.div>
              )}
            </div>

            {/* Circular Progress Ring */}
            <div className="shrink-0 hidden sm:block">
              <ProgressRing progress={progressPercent} size={96} strokeWidth={7} />
            </div>
          </div>

          {/* Pie Chart */}
          {categoryBreakdown.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">学分分布</p>
              <ChartContainer config={creditChartConfig} className="h-[200px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} className="cursor-pointer" />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>
          )}

          {/* Category Breakdown */}
          <div className="space-y-2.5">
            {categoryBreakdown.map((cat) => {
              const pct = requiredCredits > 0 ? ((cat.credits / requiredCredits) * 100) : 0;
              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{CATEGORY_ICONS[cat.name] || '📄'}</span>
                      <span className="text-xs font-medium text-foreground">{cat.name}</span>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-muted-foreground">
                      <AnimatedNumber value={cat.credits} /> 学分
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-secondary/60 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(pct, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: cat.fill }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {grades.length === 0 && (
            <div className="py-6 text-center text-muted-foreground text-sm">
              <div className="flex items-center justify-center mb-3">
                <div className="size-14 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/40 dark:to-orange-950/40 flex items-center justify-center animate-float">
                  <span className="text-2xl">📚</span>
                </div>
              </div>
              <p>暂无学分数据</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
