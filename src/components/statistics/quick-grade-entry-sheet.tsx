'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Zap, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Course } from '@/lib/types';
import { toast } from 'sonner';

async function fetchCourses(): Promise<Course[]> {
  const res = await fetch('/api/courses');
  if (!res.ok) throw new Error('Failed to fetch courses');
  return res.json();
}

// Grade mapping table (10-level system per requirements)
const GRADE_MAPPING: { min: number; max: number; label: string; point: number }[] = [
  { min: 90, max: 100, label: 'A', point: 4.0 },
  { min: 85, max: 89, label: 'A-', point: 3.7 },
  { min: 82, max: 84, label: 'B+', point: 3.3 },
  { min: 78, max: 81, label: 'B', point: 3.0 },
  { min: 75, max: 77, label: 'B-', point: 2.7 },
  { min: 72, max: 74, label: 'C+', point: 2.3 },
  { min: 68, max: 71, label: 'C', point: 2.0 },
  { min: 64, max: 67, label: 'C-', point: 1.7 },
  { min: 60, max: 63, label: 'D', point: 1.0 },
  { min: 0, max: 59, label: 'F', point: 0 },
];

function scoreToGradePoint(score: number): { label: string; point: number } {
  for (const g of GRADE_MAPPING) {
    if (score >= g.min && score <= g.max) {
      return { label: g.label, point: g.point };
    }
  }
  return { label: 'F', point: 0 };
}

function getGradePointColor(point: number): string {
  if (point >= 3.7) return 'text-emerald-600 dark:text-emerald-400';
  if (point >= 3.0) return 'text-blue-600 dark:text-blue-400';
  if (point >= 2.0) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getGradePointBadgeStyle(point: number): string {
  if (point >= 3.7) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400';
  if (point >= 3.0) return 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400';
  if (point >= 2.0) return 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400';
  return 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400';
}

interface QuickGradeEntrySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickGradeEntrySheet({ open, onOpenChange }: QuickGradeEntrySheetProps) {
  const queryClient = useQueryClient();

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  const [courseId, setCourseId] = useState('');
  const [semester, setSemester] = useState('2024-2025-2');
  const [score, setScore] = useState('');
  const [credit, setCredit] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const scoreNum = parseFloat(score);
  const isValidScore = !isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= 100;
  const gradeInfo = isValidScore ? scoreToGradePoint(scoreNum) : null;

  const handleScoreChange = useCallback((value: string) => {
    // Allow empty string or valid numbers 0-100
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      const num = parseFloat(value);
      if (value === '' || (num >= 0 && num <= 100)) {
        setScore(value);
      }
    }
  }, []);

  const handleCourseChange = useCallback((value: string) => {
    setCourseId(value);
    const course = courses.find((c) => c.id === value);
    if (course && !credit) {
      setCredit(String(course.credit));
    }
  }, [courses, credit]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!courseId) {
      newErrors.courseId = '请选择课程';
    }
    if (!semester.trim()) {
      newErrors.semester = '请输入学期';
    }
    if (score === '' || isNaN(parseFloat(score)) || parseFloat(score) < 0 || parseFloat(score) > 100) {
      newErrors.score = '请输入 0-100 的成绩';
    }
    const creditNum = parseFloat(credit);
    if (credit === '' || isNaN(creditNum) || creditNum < 1 || creditNum > 8) {
      newErrors.credit = '请输入 1-8 的学分';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [courseId, semester, score, credit]);

  const mutation = useMutation({
    mutationFn: async (data: {
      courseId: string;
      semester: string;
      score: number;
      gradePoint: number;
      credit: number;
    }) => {
      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('添加失败');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('成绩已添加');
      // Reset form
      setCourseId('');
      setScore('');
      setCredit('');
      setSemester('2024-2025-2');
      setErrors({});
      onOpenChange(false);
    },
    onError: () => {
      toast.error('添加成绩失败');
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      const s = parseFloat(score);
      const gp = scoreToGradePoint(s);

      mutation.mutate({
        courseId,
        semester: semester.trim(),
        score: s,
        gradePoint: gp.point,
        credit: parseFloat(credit),
      });
    },
    [validate, mutation, courseId, semester, score, credit],
  );

  const resetForm = useCallback(() => {
    setCourseId('');
    setScore('');
    setCredit('');
    setSemester('2024-2025-2');
    setErrors({});
  }, []);

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <SheetContent side="right" className="overflow-y-auto custom-scrollbar">
        <SheetHeader className="pr-6">
          <SheetTitle className="text-base font-semibold flex items-center gap-2">
            <Zap className="size-4 text-amber-500" />
            快速录入成绩
          </SheetTitle>
          <SheetDescription>
            快速添加单门课程成绩，绩点自动计算
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 pb-6 pt-2">
          {/* Course Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">
              课程 <span className="text-red-500">*</span>
            </Label>
            <Select value={courseId} onValueChange={handleCourseChange}>
              <SelectTrigger className={errors.courseId ? 'border-red-400' : ''}>
                <SelectValue placeholder="选择课程" />
              </SelectTrigger>
              <SelectContent>
                {courses.length === 0 && (
                  <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                    暂无课程，请先添加课程
                  </div>
                )}
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: course.color }}
                      />
                      <span>{course.name}</span>
                      <span className="text-muted-foreground text-xs">
                        ({course.credit}学分)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.courseId && (
              <p className="text-xs text-red-500">{errors.courseId}</p>
            )}
          </div>

          {/* Score Input */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">
              成绩 <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              min={0}
              max={100}
              step={1}
              value={score}
              onChange={(e) => handleScoreChange(e.target.value)}
              placeholder="输入成绩（0-100）"
              className={errors.score ? 'border-red-400' : ''}
            />
            {errors.score && (
              <p className="text-xs text-red-500">{errors.score}</p>
            )}
          </div>

          {/* Semester Input */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">
              学期 <span className="text-red-500">*</span>
            </Label>
            <Input
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              placeholder="例如：2024-2025-1"
              className={errors.semester ? 'border-red-400' : ''}
            />
            {errors.semester && (
              <p className="text-xs text-red-500">{errors.semester}</p>
            )}
          </div>

          {/* Credit Input */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">
              学分 <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              min={1}
              max={8}
              step={0.5}
              value={credit}
              onChange={(e) => setCredit(e.target.value)}
              placeholder="1-8"
              className={errors.credit ? 'border-red-400' : ''}
            />
            {errors.credit && (
              <p className="text-xs text-red-500">{errors.credit}</p>
            )}
          </div>

          <Separator />

          {/* Auto-calculated Grade Point Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <Info className="size-3.5 text-muted-foreground" />
              <Label className="text-xs font-medium text-muted-foreground">
                自动计算绩点
              </Label>
            </div>

            {/* Real-time Grade Point Display */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {gradeInfo ? `成绩 ${scoreNum} 分 → ${gradeInfo.label} 等级` : '请输入成绩'}
                  </p>
                  {gradeInfo && (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs text-muted-foreground">绩点：</span>
                      <span className={`text-2xl font-bold font-mono tabular-nums ${getGradePointColor(gradeInfo.point)}`}>
                        {gradeInfo.point.toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">/ 4.0</span>
                    </div>
                  )}
                </div>
                {gradeInfo && (
                  <Badge
                    className={getGradePointBadgeStyle(gradeInfo.point)}
                    variant="secondary"
                  >
                    {gradeInfo.label} ({gradeInfo.point})
                  </Badge>
                )}
              </div>
            </div>

            {/* Grade Mapping Table */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">成绩等级对照表</p>
              <div className="grid grid-cols-2 gap-1.5">
                {GRADE_MAPPING.map((g) => (
                  <div
                    key={g.label}
                    className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs ${
                      gradeInfo && gradeInfo.label === g.label
                        ? getGradePointBadgeStyle(g.point) + ' font-medium ring-1 ring-current/10'
                        : 'bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    <span>
                      {g.min === 0 ? '<60' : g.min === g.max ? `${g.min}` : `${g.min}-${g.max}`}
                    </span>
                    <span className="font-mono tabular-nums">
                      {g.label} ({g.point})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin mr-1.5" />
                提交中...
              </>
            ) : (
              <>
                <Zap className="size-3.5 mr-1.5" />
                录入成绩
              </>
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
