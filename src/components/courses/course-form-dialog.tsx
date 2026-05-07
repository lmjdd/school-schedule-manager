'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DAY_NAMES, TIME_SLOTS, COURSE_CATEGORIES } from '@/lib/types';
import type { Course } from '@/lib/types';
import { toast } from 'sonner';

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null; // null = add mode, Course = edit mode
}

interface FormData {
  name: string;
  teacher: string;
  location: string;
  credit: number;
  category: string;
  color: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  startWeek: number;
  endWeek: number;
  semester: string;
}

interface FormErrors {
  name?: string;
  credit?: string;
  startWeek?: string;
  endWeek?: string;
  endTime?: string;
}

const DEFAULT_FORM: FormData = {
  name: '',
  teacher: '',
  location: '',
  credit: 2,
  category: '必修',
  color: '#6366f1',
  dayOfWeek: '1',
  startTime: '08:00',
  endTime: '09:40',
  startWeek: 1,
  endWeek: 16,
  semester: '2024-2025-2',
};

const QUICK_COLORS = [
  '#6366f1', '#ec4899', '#f97316', '#22c55e',
  '#06b6d4', '#8b5cf6', '#eab308', '#f43f5e',
];

function getInitialForm(course: Course | null): FormData {
  if (!course) return DEFAULT_FORM;
  return {
    name: course.name,
    teacher: course.teacher || '',
    location: course.location || '',
    credit: course.credit,
    category: course.category,
    color: course.color || '#6366f1',
    dayOfWeek: String(course.dayOfWeek),
    startTime: course.startTime,
    endTime: course.endTime,
    startWeek: course.startWeek,
    endWeek: course.endWeek,
    semester: course.semester || '2024-2025-2',
  };
}

// Inner form component — remounts when course key changes
function CourseForm({
  course,
  onSuccess,
}: {
  course: Course | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!course;

  const [form, setForm] = useState<FormData>(() => getInitialForm(course));
  const [errors, setErrors] = useState<FormErrors>({});

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key in errors) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as keyof FormErrors];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = '请输入课程名称';
    if (form.credit < 0 || form.credit > 10) newErrors.credit = '学分范围为 0-10';
    if (form.startWeek < 1 || form.startWeek > 30) newErrors.startWeek = '周次范围为 1-30';
    if (form.endWeek < 1 || form.endWeek > 30) newErrors.endWeek = '周次范围为 1-30';
    if (form.startWeek > form.endWeek) newErrors.endWeek = '结束周次不能小于起始周次';
    if (form.startTime >= form.endTime) newErrors.endTime = '结束时间必须晚于开始时间';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('创建课程失败');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('课程创建成功');
      onSuccess();
    },
    onError: () => {
      toast.error('创建课程失败，请重试');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('更新课程失败');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('课程更新成功');
      onSuccess();
    },
    onError: () => {
      toast.error('更新课程失败，请重试');
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = () => {
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      teacher: form.teacher.trim() || null,
      location: form.location.trim() || null,
      credit: Number(form.credit),
      category: form.category,
      color: form.color,
      dayOfWeek: Number(form.dayOfWeek),
      startTime: form.startTime,
      endTime: form.endTime,
      startWeek: Number(form.startWeek),
      endWeek: Number(form.endWeek),
      semester: form.semester.trim() || '2024-2025-2',
    };

    if (isEdit && course?.id) {
      updateMutation.mutate({ ...payload, id: course.id });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <>
      <div className="grid gap-4 py-2">
        {/* 课程名称 */}
        <div className="grid gap-1.5">
          <Label htmlFor="course-name">
            课程名称 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="course-name"
            placeholder="如：高等数学"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            className={errors.name ? 'border-red-400' : ''}
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name}</p>
          )}
        </div>

        {/* 教师 + 地点 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="teacher">教师</Label>
            <Input
              id="teacher"
              placeholder="如：张教授"
              value={form.teacher}
              onChange={(e) => updateField('teacher', e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="location">上课地点</Label>
            <Input
              id="location"
              placeholder="如：教A-301"
              value={form.location}
              onChange={(e) => updateField('location', e.target.value)}
            />
          </div>
        </div>

        {/* 学分 + 类别 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="credit">学分</Label>
            <Input
              id="credit"
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={form.credit}
              onChange={(e) => updateField('credit', Number(e.target.value))}
              className={errors.credit ? 'border-red-400' : ''}
            />
            {errors.credit && (
              <p className="text-xs text-red-500">{errors.credit}</p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label>课程类别</Label>
            <Select
              value={form.category}
              onValueChange={(val) => updateField('category', val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COURSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 颜色 */}
        <div className="grid gap-1.5">
          <Label>颜色</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.color}
              onChange={(e) => updateField('color', e.target.value)}
              className="size-9 rounded-md border border-input cursor-pointer bg-transparent p-0.5"
            />
            <span className="text-sm text-muted-foreground font-mono">{form.color}</span>
            <div className="flex gap-1.5 ml-1">
              {QUICK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="size-5 rounded-full transition-transform hover:scale-125"
                  style={{
                    backgroundColor: c,
                    boxShadow: form.color === c ? `0 0 0 2px var(--background), 0 0 0 3.5px ${c}` : 'none',
                  }}
                  onClick={() => updateField('color', c)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/50 my-1" />

        {/* 星期几 */}
        <div className="grid gap-1.5">
          <Label>星期几</Label>
          <Select
            value={form.dayOfWeek}
            onValueChange={(val) => updateField('dayOfWeek', val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {DAY_NAMES[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 开始时间 + 结束时间 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label>开始时间</Label>
            <Select
              value={form.startTime}
              onValueChange={(val) => updateField('startTime', val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot.start} value={slot.start}>
                    {slot.label} ({slot.start})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>结束时间</Label>
            <Select
              value={form.endTime}
              onValueChange={(val) => updateField('endTime', val)}
            >
              <SelectTrigger className={`w-full ${errors.endTime ? 'border-red-400' : ''}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot.end} value={slot.end}>
                    {slot.label} ({slot.end})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.endTime && (
              <p className="text-xs text-red-500">{errors.endTime}</p>
            )}
          </div>
        </div>

        {/* 起始周次 + 结束周次 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="start-week">起始周次</Label>
            <Input
              id="start-week"
              type="number"
              min={1}
              max={30}
              value={form.startWeek}
              onChange={(e) => updateField('startWeek', Number(e.target.value))}
              className={errors.startWeek ? 'border-red-400' : ''}
            />
            {errors.startWeek && (
              <p className="text-xs text-red-500">{errors.startWeek}</p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="end-week">结束周次</Label>
            <Input
              id="end-week"
              type="number"
              min={1}
              max={30}
              value={form.endWeek}
              onChange={(e) => updateField('endWeek', Number(e.target.value))}
              className={errors.endWeek ? 'border-red-400' : ''}
            />
            {errors.endWeek && (
              <p className="text-xs text-red-500">{errors.endWeek}</p>
            )}
          </div>
        </div>

        {/* 学期 */}
        <div className="grid gap-1.5">
          <Label htmlFor="semester">学期</Label>
          <Input
            id="semester"
            placeholder="如：2024-2025-2"
            value={form.semester}
            onChange={(e) => updateField('semester', e.target.value)}
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={onSuccess}
          disabled={isSubmitting}
        >
          取消
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center gap-1.5">
              <span className="size-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              保存中...
            </span>
          ) : (
            '保存'
          )}
        </Button>
      </DialogFooter>
    </>
  );
}

export function CourseFormDialog({ open, onOpenChange, course }: CourseFormDialogProps) {
  const isEdit = !!course;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑课程' : '添加课程'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改课程信息' : '填写课程信息以添加新课程'}
          </DialogDescription>
        </DialogHeader>

        {/* Key forces remount when dialog opens with different course */}
        {open && (
          <CourseForm
            key={course?.id ?? '__new__'}
            course={course}
            onSuccess={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
