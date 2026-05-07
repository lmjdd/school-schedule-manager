'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Award,
  TrendingUp,
  Trophy,
  BookOpen,
  Plus,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GPAOverview } from './gpa-overview';
import { CreditStats } from './credit-stats';
import { GradeDistribution } from './grade-distribution';
import { GradeRadarChart } from './grade-radar-chart';
import { GradeTable } from './grade-table';
import { GradeFormDialog } from './grade-form-dialog';
import { GPACalculator } from './gpa-calculator';
import {
  calculateGPA,
  calculateTotalCredits,
  formatGPA,
  getGPAColor,
  cn,
} from '@/lib/helpers';
import type { Grade } from '@/lib/types';

async function fetchGrades(): Promise<Grade[]> {
  const res = await fetch('/api/grades');
  if (!res.ok) throw new Error('Failed to fetch grades');
  return res.json();
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
      <Card className="rounded-lg border-border/60 notion-card">
        <CardContent className="p-4 md:p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Icon className="size-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
              </div>
              <p
                className={cn(
                  'text-2xl md:text-3xl font-bold font-mono tabular-nums leading-none tracking-tight',
                  color || 'text-foreground',
                )}
              >
                {value}
              </p>
              {subValue && (
                <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MetricCardSkeleton() {
  return (
    <Card className="rounded-lg border-border/60">
      <CardContent className="p-4 md:p-5">
        <Skeleton className="h-3 w-16 mb-3" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-3 w-24 mt-2" />
      </CardContent>
    </Card>
  );
}

export function StatisticsPage() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);

  const { data: allGrades = [], isLoading } = useQuery({
    queryKey: ['grades'],
    queryFn: fetchGrades,
  });

  // Extract unique semesters, sorted descending (most recent first)
  const semesters = useMemo(() => {
    const semSet = new Set<string>();
    allGrades.forEach((g) => {
      if (g.semester) semSet.add(g.semester);
    });
    return Array.from(semSet).sort((a, b) => b.localeCompare(a));
  }, [allGrades]);

  // Filter grades by selected semester
  const grades = useMemo(() => {
    if (!selectedSemester) return allGrades;
    return allGrades.filter((g) => g.semester === selectedSemester);
  }, [allGrades, selectedSemester]);

  const gpa = useMemo(() => calculateGPA(grades), [grades]);
  const gpaColor = useMemo(() => getGPAColor(gpa), [gpa]);
  const totalCredits = useMemo(() => calculateTotalCredits(grades), [grades]);
  const requiredCredits = 160;
  const creditProgress = useMemo(() => Math.min((totalCredits / requiredCredits) * 100, 100), [totalCredits]);

  const avgScore = useMemo(() => {
    const graded = grades.filter((g) => g.score !== null && g.score !== undefined);
    if (graded.length === 0) return 0;
    return graded.reduce((sum, g) => sum + (g.score as number), 0) / graded.length;
  }, [grades]);

  const maxScore = useMemo(() => {
    const graded = grades.filter((g) => g.score !== null && g.score !== undefined);
    if (graded.length === 0) return 0;
    return Math.max(...graded.map((g) => g.score as number));
  }, [grades]);

  const totalCourses = grades.length;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            📊 学业统计
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            全面了解你的学业表现
          </p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          size="sm"
          className="gap-1.5"
        >
          <Plus className="size-3.5" />
          添加成绩
        </Button>
      </motion.div>

      {/* Semester Filter Tabs */}
      {semesters.length > 0 && (
        <Tabs
          value={selectedSemester || 'all'}
          onValueChange={(val) => setSelectedSemester(val === 'all' ? null : val)}
          className="w-full"
        >
          <TabsList className="h-9 gap-0.5 p-1 overflow-x-auto max-w-full">
            <TabsTrigger value="all" className="text-xs px-3">
              全部
            </TabsTrigger>
            {semesters.map((sem) => (
              <TabsTrigger key={sem} value={sem} className="text-xs px-3 whitespace-nowrap">
                {sem}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <MetricCardSkeleton key={i} />)
        ) : (
          <>
            <MetricCard
              icon={GraduationCap}
              label="当前 GPA"
              value={formatGPA(gpa)}
              subValue="/ 4.00"
              color={gpaColor}
              delay={0}
            />
            <MetricCard
              icon={Award}
              label="已修学分"
              value={totalCredits}
              subValue={`/ ${requiredCredits} · ${creditProgress.toFixed(0)}%`}
              delay={0.05}
            />
            <MetricCard
              icon={TrendingUp}
              label="平均分"
              value={avgScore > 0 ? Math.round(avgScore) : '--'}
              subValue={grades.length > 0 ? '加权平均' : '暂无数据'}
              delay={0.1}
            />
            <MetricCard
              icon={Trophy}
              label="最高分"
              value={maxScore > 0 ? maxScore : '--'}
              subValue={grades.length > 0 ? `共 ${grades.length} 门` : '暂无数据'}
              delay={0.15}
            />
            <MetricCard
              icon={BookOpen}
              label="总课程数"
              value={totalCourses}
              delay={0.2}
            />
          </>
        )}
      </div>

      {/* Charts Row: GPA Overview + Grade Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        <GPAOverview semester={selectedSemester} />
        <GradeDistribution semester={selectedSemester} />
      </div>

      {/* Grade Radar Chart */}
      <GradeRadarChart semester={selectedSemester} />

      {/* Credit Stats */}
      <CreditStats semester={selectedSemester} />

      {/* Grade Table */}
      <GradeTable semester={selectedSemester} />

      {/* GPA Calculator */}
      <GPACalculator />

      {/* Add Dialog */}
      <GradeFormDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
    </div>
  );
}
