'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { EXAM_TYPES } from '@/lib/types';
import type { Course, Exam } from '@/lib/types';
import { toast } from 'sonner';

interface ExamFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: Exam | null; // null = add mode, Exam = edit mode
}

interface FormData {
  title: string;
  courseId: string;
  date: string;
  location: string;
  seat: string;
  type: string;
  remindDays: number;
}

interface FormErrors {
  title?: string;
  courseId?: string;
  date?: string;
}

const DEFAULT_FORM: FormData = {
  title: '',
  courseId: '',
  date: '',
  location: '',
  seat: '',
  type: '期中考试',
  remindDays: 3,
};

function toLocalDatetimeString(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getInitialForm(exam: Exam | null): FormData {
  if (!exam) return DEFAULT_FORM;
  return {
    title: exam.title,
    courseId: exam.courseId,
    date: toLocalDatetimeString(exam.date),
    location: exam.location || '',
    seat: exam.seat || '',
    type: exam.type || '期中考试',
    remindDays: exam.remindDays,
  };
}

function ExamForm({
  exam,
  onSuccess,
}: {
  exam: Exam | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!exam;

  const [form, setForm] = useState<FormData>(() => getInitialForm(exam));
  const [errors, setErrors] = useState<FormErrors>({});

  // Fetch courses for the select dropdown
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async (): Promise<Course[]> => {
      const res = await fetch('/api/courses');
      if (!res.ok) throw new Error('Failed to fetch courses');
      return res.json();
    },
  });

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
    if (!form.title.trim()) newErrors.title = '请输入考试名称';
    if (!form.courseId) newErrors.courseId = '请选择所属课程';
    if (!form.date) newErrors.date = '请选择考试日期';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('创建考试失败');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success('考试创建成功');
      onSuccess();
    },
    onError: () => {
      toast.error('创建考试失败，请重试');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/exams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('更新考试失败');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success('考试更新成功');
      onSuccess();
    },
    onError: () => {
      toast.error('更新考试失败，请重试');
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = () => {
    if (!validate()) return;

    const payload = {
      title: form.title.trim(),
      courseId: form.courseId,
      date: new Date(form.date).toISOString(),
      location: form.location.trim() || null,
      seat: form.seat.trim() || null,
      type: form.type,
      remindDays: Number(form.remindDays),
    };

    if (isEdit && exam?.id) {
      updateMutation.mutate({ ...payload, id: exam.id });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <>
      <div className="grid gap-4 py-2">
        {/* 考试名称 */}
        <div className="grid gap-1.5">
          <Label htmlFor="exam-title">
            考试名称 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="exam-title"
            placeholder="如：高等数学期中考试"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            className={errors.title ? 'border-red-400' : ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          {errors.title && (
            <p className="text-xs text-red-500">{errors.title}</p>
          )}
        </div>

        {/* 所属课程 */}
        <div className="grid gap-1.5">
          <Label>
            所属课程 <span className="text-red-500">*</span>
          </Label>
          <Select
            value={form.courseId}
            onValueChange={(val) => updateField('courseId', val)}
          >
            <SelectTrigger className={`w-full ${errors.courseId ? 'border-red-400' : ''}`}>
              <SelectValue placeholder="选择课程" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full shrink-0 inline-block"
                      style={{ backgroundColor: course.color || '#6366f1' }}
                    />
                    {course.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.courseId && (
            <p className="text-xs text-red-500">{errors.courseId}</p>
          )}
        </div>

        {/* 考试日期 */}
        <div className="grid gap-1.5">
          <Label htmlFor="exam-date">
            考试日期 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="exam-date"
            type="datetime-local"
            value={form.date}
            onChange={(e) => updateField('date', e.target.value)}
            className={errors.date ? 'border-red-400' : 'w-full'}
          />
          {errors.date && (
            <p className="text-xs text-red-500">{errors.date}</p>
          )}
        </div>

        {/* 考试地点 + 座位号 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="exam-location">考试地点</Label>
            <Input
              id="exam-location"
              placeholder="如：教A-301"
              value={form.location}
              onChange={(e) => updateField('location', e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="exam-seat">座位号</Label>
            <Input
              id="exam-seat"
              placeholder="如：A12"
              value={form.seat}
              onChange={(e) => updateField('seat', e.target.value)}
            />
          </div>
        </div>

        {/* 考试类型 + 提前提醒天数 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label>考试类型</Label>
            <Select
              value={form.type}
              onValueChange={(val) => updateField('type', val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXAM_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="exam-remind">提前提醒天数</Label>
            <Input
              id="exam-remind"
              type="number"
              min={0}
              max={30}
              value={form.remindDays}
              onChange={(e) => updateField('remindDays', Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">在考试前几天发送提醒</p>
          </div>
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

export function ExamFormDialog({ open, onOpenChange, exam }: ExamFormDialogProps) {
  const isEdit = !!exam;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑考试' : '添加考试'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改考试信息' : '填写考试信息以添加新考试'}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <ExamForm
            key={exam?.id ?? '__new__'}
            exam={exam}
            onSuccess={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
