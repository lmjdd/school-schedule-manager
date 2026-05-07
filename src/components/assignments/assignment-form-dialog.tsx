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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { STATUS_LABELS } from '@/lib/types';
import type { Course, Assignment } from '@/lib/types';
import { toast } from 'sonner';

interface AssignmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: Assignment | null; // null = add mode, Assignment = edit mode
}

interface FormData {
  title: string;
  courseId: string;
  description: string;
  dueDate: string;
  status: string;
  priority: number;
  remindDays: number;
}

interface FormErrors {
  title?: string;
  courseId?: string;
}

const DEFAULT_FORM: FormData = {
  title: '',
  courseId: '',
  description: '',
  dueDate: '',
  status: 'pending',
  priority: 1,
  remindDays: 1,
};

const PRIORITY_OPTIONS = [
  { value: 0, label: '低' },
  { value: 1, label: '中' },
  { value: 2, label: '高' },
  { value: 3, label: '紧急' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: '待完成' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
];

function toLocalDatetimeString(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getInitialForm(assignment: Assignment | null): FormData {
  if (!assignment) return DEFAULT_FORM;
  return {
    title: assignment.title,
    courseId: assignment.courseId,
    description: assignment.description || '',
    dueDate: toLocalDatetimeString(assignment.dueDate),
    status: assignment.status,
    priority: assignment.priority,
    remindDays: assignment.remindDays,
  };
}

function AssignmentForm({
  assignment,
  onSuccess,
}: {
  assignment: Assignment | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!assignment;

  const [form, setForm] = useState<FormData>(() => getInitialForm(assignment));
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
    if (!form.title.trim()) newErrors.title = '请输入作业标题';
    if (!form.courseId) newErrors.courseId = '请选择所属课程';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('创建作业失败');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('作业创建成功');
      onSuccess();
    },
    onError: () => {
      toast.error('创建作业失败，请重试');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('更新作业失败');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('作业更新成功');
      onSuccess();
    },
    onError: () => {
      toast.error('更新作业失败，请重试');
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = () => {
    if (!validate()) return;

    const payload = {
      title: form.title.trim(),
      courseId: form.courseId,
      description: form.description.trim() || null,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      status: form.status,
      priority: Number(form.priority),
      remindDays: Number(form.remindDays),
    };

    if (isEdit && assignment?.id) {
      updateMutation.mutate({ ...payload, id: assignment.id });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <>
      <div className="grid gap-4 py-2">
        {/* 作业标题 */}
        <div className="grid gap-1.5">
          <Label htmlFor="assignment-title">
            作业标题 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="assignment-title"
            placeholder="如：高等数学第三章作业"
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

        {/* 描述 */}
        <div className="grid gap-1.5">
          <Label htmlFor="assignment-desc">描述</Label>
          <Textarea
            id="assignment-desc"
            placeholder="作业描述或备注..."
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* 截止日期 */}
        <div className="grid gap-1.5">
          <Label htmlFor="assignment-due">截止日期</Label>
          <Input
            id="assignment-due"
            type="datetime-local"
            value={form.dueDate}
            onChange={(e) => updateField('dueDate', e.target.value)}
            className="w-full"
          />
        </div>

        {/* 状态 + 优先级 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label>状态</Label>
            <Select
              value={form.status}
              onValueChange={(val) => updateField('status', val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>优先级</Label>
            <Select
              value={String(form.priority)}
              onValueChange={(val) => updateField('priority', Number(val))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full inline-block"
                        style={{
                          backgroundColor:
                            opt.value === 0
                              ? '#9ca3af'
                              : opt.value === 1
                                ? '#3b82f6'
                                : opt.value === 2
                                  ? '#f59e0b'
                                  : '#ef4444',
                        }}
                      />
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 提前提醒天数 */}
        <div className="grid gap-1.5">
          <Label htmlFor="remind-days">提前提醒天数</Label>
          <Input
            id="remind-days"
            type="number"
            min={0}
            max={30}
            value={form.remindDays}
            onChange={(e) => updateField('remindDays', Number(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">在截止日期前几天发送提醒</p>
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

export function AssignmentFormDialog({ open, onOpenChange, assignment }: AssignmentFormDialogProps) {
  const isEdit = !!assignment;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑作业' : '添加作业'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改作业信息' : '填写作业信息以添加新作业'}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <AssignmentForm
            key={assignment?.id ?? '__new__'}
            assignment={assignment}
            onSuccess={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
