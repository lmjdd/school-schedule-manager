'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { scoreToGradePoint } from '@/lib/helpers';
import type { Grade, Course } from '@/lib/types';
import { toast } from 'sonner';

async function fetchCourses(): Promise<Course[]> {
  const res = await fetch('/api/courses');
  if (!res.ok) throw new Error('Failed to fetch courses');
  return res.json();
}

interface GradeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grade?: Grade | null;
}

function GradeForm({ grade, onSuccess }: { grade?: Grade | null; onSuccess: () => void }) {
  const queryClient = useQueryClient();

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  const isEditing = !!grade?.id;

  const [courseId, setCourseId] = useState(grade?.courseId || '');
  const [semester, setSemester] = useState(grade?.semester || '2024-2025-2');
  const [score, setScore] = useState(
    grade?.score !== null && grade?.score !== undefined ? String(grade.score) : '',
  );
  const [credit, setCredit] = useState(String(grade?.credit || ''));
  const [gradePoint, setGradePoint] = useState(
    grade?.gradePoint !== null && grade?.gradePoint !== undefined ? String(grade.gradePoint) : '',
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-calculate grade point from score
  const handleScoreChange = useCallback((value: string) => {
    setScore(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setGradePoint(String(scoreToGradePoint(num)));
    }
  }, []);

  // Auto-fill credit from selected course
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
    const scoreNum = parseFloat(score);
    if (score === '' || isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      newErrors.score = '请输入 0-100 的成绩';
    }
    const creditNum = parseFloat(credit);
    if (credit === '' || isNaN(creditNum) || creditNum <= 0) {
      newErrors.credit = '请输入有效的学分';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [courseId, semester, score, credit]);

  const mutation = useMutation({
    mutationFn: async (data: Partial<Grade>) => {
      const url = '/api/grades';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(isEditing ? '更新失败' : '添加失败');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success(isEditing ? '成绩已更新' : '成绩已添加');
      onSuccess();
    },
    onError: () => {
      toast.error(isEditing ? '更新成绩失败' : '添加成绩失败');
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      mutation.mutate({
        ...(isEditing ? { id: grade!.id } : {}),
        courseId,
        semester: semester.trim(),
        score: parseFloat(score),
        credit: parseFloat(credit),
        gradePoint: parseFloat(gradePoint) || scoreToGradePoint(parseFloat(score)),
      });
    },
    [validate, mutation, isEditing, grade, courseId, semester, score, credit, gradePoint],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Course */}
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
                  <span className="text-muted-foreground text-xs">({course.credit}学分)</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.courseId && (
          <p className="text-xs text-red-500">{errors.courseId}</p>
        )}
      </div>

      {/* Semester */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">
          学期 <span className="text-red-500">*</span>
        </Label>
        <Input
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          placeholder="例如：2024-2025-2"
          className={errors.semester ? 'border-red-400' : ''}
        />
        {errors.semester && (
          <p className="text-xs text-red-500">{errors.semester}</p>
        )}
      </div>

      {/* Score */}
      <div className="grid grid-cols-2 gap-3">
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
            placeholder="0-100"
            className={errors.score ? 'border-red-400' : ''}
          />
          {errors.score && (
            <p className="text-xs text-red-500">{errors.score}</p>
          )}
        </div>

        {/* Credit */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">
            学分 <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            min={0.5}
            max={10}
            step={0.5}
            value={credit}
            onChange={(e) => setCredit(e.target.value)}
            placeholder="学分"
            className={errors.credit ? 'border-red-400' : ''}
          />
          {errors.credit && (
            <p className="text-xs text-red-500">{errors.credit}</p>
          )}
        </div>
      </div>

      {/* Grade Point */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">
          绩点 <span className="text-muted-foreground font-normal">(自动计算)</span>
        </Label>
        <Input
          type="number"
          min={0}
          max={4.0}
          step={0.1}
          value={gradePoint}
          onChange={(e) => setGradePoint(e.target.value)}
          placeholder="绩点"
        />
      </div>

      {/* Submit */}
      <DialogFooter className="pt-2">
        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin mr-1.5" />
              保存中...
            </>
          ) : isEditing ? (
            '更新成绩'
          ) : (
            '添加成绩'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function GradeFormDialog({ open, onOpenChange, grade }: GradeFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-base">
            {grade ? '✏️ 编辑成绩' : '➕ 添加成绩'}
          </DialogTitle>
        </DialogHeader>
        <GradeForm
          key={grade?.id ?? '__new__'}
          grade={grade}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
